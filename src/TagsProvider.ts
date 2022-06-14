import * as vscode from 'vscode';
import * as path from 'path';
import { getTags, walk } from './utils';

export class TagProvider implements vscode.TreeDataProvider<TagItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<TagItem | undefined> =
    new vscode.EventEmitter<TagItem | undefined>();
  readonly onDidChangeTreeData: vscode.Event<TagItem | undefined> =
    this._onDidChangeTreeData.event;

  constructor(private workspaceRoot: string) {}

  refresh(): void {
    // @ts-ignore
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: TagItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: TagItem): Thenable<TagItem[]> {
    if (!this.workspaceRoot) {
      vscode.window.showInformationMessage('No dependency in empty workspace');
      return Promise.resolve([]);
    }

    if (element) {
      // Nested tags is not supported for now.
      return Promise.resolve([]);
    } else {
      return Promise.resolve(this.getTagsInThisFolder());
    }
  }

  private async getTagsInThisFolder(): Promise<TagItem[]> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      return [];
    }
    const folderUri = workspaceFolders[0].uri;
    const list = await walk(folderUri);
    const tags = await getTags(list);
    const sortTag = (tag1: string, tag2: string) => tags[tag2] - tags[tag1];
    const keys = Object.keys(tags).sort(sortTag);
    const tagList = keys.map((key) => {
      return new TagItem(key, tags[key], vscode.TreeItemCollapsibleState.None, {
        command: 'kainotes.showTag',
        title: 'Show',
        arguments: [key],
      });
    });
    return Promise.resolve(tagList);
  }
}

class TagItem extends vscode.TreeItem {
  constructor(
    public readonly file: string,
    private num: number,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly command?: vscode.Command
  ) {
    super(file, vscode.TreeItemCollapsibleState.Expanded);
    this.tooltip = `${this.file}`;
    this.description = 'x ' + (this.num || 0);
  }

  // iconPath = {
  //   light: path.join(__filename, '..', '..', 'media', 'light', 'label.svg'),
  //   dark: path.join(__filename, '..', '..', 'media', 'dark', 'label.svg'),
  // };

  // https://code.visualstudio.com/api/references/icons-in-labels#icon-listing
  iconPath = new vscode.ThemeIcon('tag');
}
