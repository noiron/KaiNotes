import * as vscode from 'vscode';
import * as path from 'path';
import { getTags, isMarkdownFile, walk } from './utils';
import { ALL_TAGS, TAG_TEXT } from './constants';
import dataSource from './DataSource';

export class TagProvider implements vscode.TreeDataProvider<TagItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<TagItem | undefined> =
    new vscode.EventEmitter<TagItem | undefined>();
  readonly onDidChangeTreeData: vscode.Event<TagItem | undefined> =
    this._onDidChangeTreeData.event;

  constructor(private workspaceRoot: string) {}

  elements: { [tag: string]: TagItem } = {};

  refresh(): void {
    // @ts-ignore
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: TagItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: TagItem): Thenable<TagItem[]> {
    if (!this.workspaceRoot) {
      vscode.window.showInformationMessage('No tag in empty workspace');
      return Promise.resolve([]);
    }

    if (element) {
      // Nested tags is not supported for now.
      return Promise.resolve([]);
    } else {
      return Promise.resolve(this.getTagsInThisFolder());
    }
  }

  getParent() {
    return null;
  }

  private async getTagsInThisFolder(): Promise<TagItem[]> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      return [];
    }
    await dataSource.update();
    const { tags, fileList, tagKeys } = dataSource;

    const sortTag = (tag1: string, tag2: string) => tags[tag2] - tags[tag1];
    const keys = [ALL_TAGS, ...tagKeys].sort(sortTag);
    const total = fileList.filter(isMarkdownFile).length;
    const tagList = keys.map((key) => {
      const count = key === ALL_TAGS ? total : tags[key];
      const element = new TagItem(
        key,
        count,
        vscode.TreeItemCollapsibleState.None,
        {
          command: 'kainotes.showTag',
          title: 'Show',
          arguments: [key],
        }
      );
      this.elements[key] = element;
      return element;
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
    super(
      // ALL_TAGS & UNTAGGED are special tags.
      TAG_TEXT[file] ?? file,
      vscode.TreeItemCollapsibleState.Expanded
    );
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
