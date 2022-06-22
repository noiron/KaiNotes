import * as vscode from 'vscode';
import * as path from 'path';
import { getFileTitle, getFilesContainTag, walk, sortByName, sortFileByEditTime } from './utils';

export class FilesProvider implements vscode.TreeDataProvider<FileItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<FileItem | undefined> =
    new vscode.EventEmitter<FileItem | undefined>();
  readonly onDidChangeTreeData: vscode.Event<FileItem | undefined> =
    this._onDidChangeTreeData.event;

  constructor(private workspaceRoot: string) {}

  private filterTag: string | null = null;

  forTag(tag: string) {
    this.filterTag = tag;
    this.refresh();
  }

  getTreeItem(element: FileItem): vscode.TreeItem {
    return element;
  }

  refresh(): void {
    // @ts-ignore
    this._onDidChangeTreeData.fire();
  }

  getChildren(): Thenable<FileItem[]> {
    if (!this.workspaceRoot) {
      vscode.window.showInformationMessage('No files in empty workspace');
      return Promise.resolve([]);
    }

    return Promise.resolve(this.getFilesForTag(this.filterTag || ''));
  }

  private async getFilesForTag(tag: string): Promise<FileItem[]> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      return [];
    }
    const folderUri = workspaceFolders[0].uri;
    const list = await walk(folderUri);
    const files = await getFilesContainTag(folderUri.fsPath, list, tag);
    const fileItems = files.sort((file1, file2) => sortFileByEditTime(
      path.join(folderUri.fsPath, file1),
      path.join(folderUri.fsPath, file2),
    )).map(async (file) => {
      const title = await getFileTitle(path.join(folderUri.fsPath, file));

      return new FileItem(title, file, vscode.TreeItemCollapsibleState.None, {
        command: 'kainotes.openFile',
        arguments: [vscode.Uri.file(path.join(this.workspaceRoot, file))],
        title: 'show in editor',
      });
    });
    return Promise.all(fileItems);
  }
}

class FileItem extends vscode.TreeItem {
  constructor(
    public readonly title: string,
    public readonly file: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly command?: vscode.Command
  ) {
    super(title, vscode.TreeItemCollapsibleState.Expanded);
    this.tooltip = `${this.file}`;

    const folder = path.dirname(file);
    this.description = folder;
  }

  iconPath = vscode.ThemeIcon.File;
}
