import * as vscode from 'vscode';
import { TextDecoder } from 'util';
import * as path from 'path';
import { posix } from 'path';
import * as fs from 'fs';
import {
  extractTagsFromContent,
  extractTitleFromContent,
  isMarkdownFile,
} from 'kainotes-tools';
import { ALL_TAGS, MARKDOWN_REGEX, UNTAGGED } from './constants';

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
    const matchedTags = await extractFileTags(file);
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

// /**
//  * 在文件列表中查找包含给定标签的文件
//  * @param folderPath {string} 文件夹路径
//  * @param fileList {string[]} 文件路径列表
//  * @param searchTag {string} 要查找的标签
//  * @returns
//  */
// export async function getFilesContainTag(
//   folderPath: string,
//   fileList: string[],
//   searchTag: string
// ) {
//   const list: string[] = [];
//   const promises = fileList.filter(isMarkdownFile).map(async (absolutePath) => {
//     const tagsInFile = await extractFileTags(absolutePath);
//     const relativePath = path.relative(folderPath, absolutePath);

//     if (searchTag === ALL_TAGS) {
//       list.push(relativePath);
//     } else if (tagsInFile) {
//       for (const tag of tagsInFile) {
//         if (tag === searchTag) {
//           list.push(relativePath);
//           break;
//         }
//       }
//     } else if (!searchTag) {
//       // 查找所有不包含标签的文件
//       list.push(relativePath);
//     }
//   });
//   await Promise.all(promises);
//   return list;
// }

/**
 * 给定文件路径，读取内容，检查其中是否包含标签
 */
export const extractFileTags = async (filePath: string) => {
  const content = await readFileContent(filePath);
  return extractTagsFromContent(content);
};

/**
 * 从文件内容中获得文件标题，一般为文件的第一行，以 # 开头
 * @param {string} filePath
 */
export async function getFileTitle(filePath: string) {
  const content = await readFileContent(filePath);
  return extractTitleFromContent(content);
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
