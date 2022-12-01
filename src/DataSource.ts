import * as vscode from 'vscode';
import { UNTAGGED } from './constants';
import { getTags, Tags, walk } from './utils';

const workspaceFolders = vscode.workspace.workspaceFolders;

class DataSource {
  /** A list of all tags */
  tagKeys: string[];
  /** Tags and their occurrence in array format */
  tagList: [string, number][];
  /** Tags and their occurrence in object format */
  tags: Tags;
  fileList: string[];

  constructor() {
    this.tagList = [];
    this.tagKeys = [];
    this.tags = {};
    this.fileList = [];
  }

  async update() {
    if (!workspaceFolders) {
      vscode.window.showInformationMessage('Open a folder first');
      return;
    }
    const folderUri = workspaceFolders[0].uri;
    const fileList = await walk(folderUri);
    const tags = await getTags(fileList);
    const keys = Object.keys(tags);
    const tagList = keys
      .map((key) => [key, tags[key]] as [string, number])
      .filter(([key]) => {
        return key !== UNTAGGED;
      });

    this.fileList = fileList;
    this.tags = tags;
    this.tagKeys = keys;
    this.tagList = tagList;
  }
}

export default new DataSource();;
