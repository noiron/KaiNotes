import * as vscode from 'vscode';
import * as path from 'path';
import { getTag, walk } from './utils';

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
    const list: string[] = [];
    await walk(folderUri, list);
    const files = await getTag(folderUri.fsPath, list, tag);
    const fileItems = files.map((file) => {
      return new FileItem(file, vscode.TreeItemCollapsibleState.None, {
        command: 'kainotes.openFile',
        arguments: [vscode.Uri.file(path.join(this.workspaceRoot, file))],
        title: 'show in editor',
      });
    });
    return Promise.resolve(fileItems);
  }
}

class FileItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly command?: vscode.Command
  ) {
    super(label, vscode.TreeItemCollapsibleState.Expanded);
    this.tooltip = `${this.label}`;
  }

  iconPath = vscode.ThemeIcon.File;
}
