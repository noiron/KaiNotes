import * as vscode from 'vscode';
import * as path from 'path';
import { getTags, walk } from './utils';

export class TagProvider implements vscode.TreeDataProvider<TagItem> {
  constructor(private workspaceRoot: string) {}

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
    const list: string[] = [];
    await walk(folderUri, list);
    const tags = await getTags(list);
    const keys = Object.keys(tags).sort((tag1, tag2) => {
      return tags[tag2] - tags[tag1];
    });
    const tagList = keys.map((key) => {
      return new TagItem(key, tags[key], vscode.TreeItemCollapsibleState.None);
    });
    return Promise.resolve(tagList);
  }
}

class TagItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    private num: number,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, vscode.TreeItemCollapsibleState.Expanded);
    this.tooltip = `${this.label}`;
    this.description = 'x' + (this.num || 0);
  }

  iconPath = {
    light: path.join(__filename, '..', '..', 'media', 'light', 'label.svg'),
    dark: path.join(__filename, '..', '..', 'media', 'dark', 'label.svg'),
  };
}
