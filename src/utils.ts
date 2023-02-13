import * as vscode from 'vscode';
import { TextDecoder } from 'util';
import { posix } from 'path';
import * as fs from 'fs';
import { isMarkdownFile, extractFileTags } from 'kainotes-tools';
import { UNTAGGED } from './constants';

/**
 * 给定一个文件地址，以字符串形式返回文件内容
 * @param filePath
 * @returns
 */
export async function readFileContent(filePath: string): Promise<string> {
  const content = await vscode.workspace.fs.readFile(vscode.Uri.file(filePath));
  return new TextDecoder().decode(content);
}

export interface Tags {
  [tag: string]: number;
}

/**
 * 给定文件列表，找出所有文件中包含的标签
 * @param fileList {string} 文件列表
 * @returns tags
 */
export async function getTags(fileList: string[]) {
  const tags: Tags = {};
  fileList = fileList.filter(isMarkdownFile);
  const promises = fileList.map(async (file) => {
    if (!isMarkdownFile(file)) {
      return;
    }
    const matchedTags = await extractFileTags(file, readFileContent);
    if (matchedTags) {
      matchedTags.forEach((t) => {
        tags[t] = !tags[t] ? 1 : tags[t] + 1;
      });
    } else {
      // count files that has no tag
      tags[UNTAGGED] = !tags[UNTAGGED] ? 1 : tags[UNTAGGED] + 1;
    }
    return new Promise((resolve) => {
      resolve(true);
    });
  });
  await Promise.all(promises);
  return tags;
}

export async function walk(folder: vscode.Uri): Promise<string[]> {
  const list: string[] = [];

  for (const [name, type] of await vscode.workspace.fs.readDirectory(folder)) {
    if (isExcluded(name)) {
      continue;
    }

    const filePath = posix.join(folder.path, name);
    if (type === vscode.FileType.File) {
      list.push(filePath);
    } else if (type === vscode.FileType.Directory) {
      if (name.startsWith('.')) {
        continue;
      }
      const subList = await walk(vscode.Uri.file(filePath));
      list.push(...subList);
    }
  }
  return list;
}



export function isExcluded(filePath: string) {
  if (/node_modules/.test(filePath)) {
    return true;
  }
  return false;
}

export function sortByName(a: string, b: string) {
  return a.localeCompare(b);
}

export function sortFileByEditTime(file1: any, file2: any) {
  const info1 = fs.statSync(file1);
  const info2 = fs.statSync(file2);
  return info2.mtime.getTime() - info1.mtime.getTime();
}
