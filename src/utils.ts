import * as vscode from 'vscode';
import { TextDecoder } from 'util';
import * as path from 'path';
import { posix } from 'path';

/**
 * 给定一个文件地址，以字符串形式返回文件内容
 * @param filePath
 * @returns
 */
export async function readFileContent(filePath: string): Promise<string> {
  const content = await vscode.workspace.fs.readFile(vscode.Uri.file(filePath));
  return new TextDecoder().decode(content);
}

/**
 * 检查给定的内容中是否包含标签
 */
export const checkTags = (content: string) => {
  return content.match(/(?<=(^|\s))#(?!(\s|#|!))([\S]+)/gm);
};

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
    if (!file.endsWith('.md')) {
      return;
    }
    const content = await readFileContent(file);
    const matchedTags = checkTags(content);
    if (matchedTags) {
      matchedTags.forEach((t) => {
        t = purifyTag(t);
        tags[t] = !tags[t] ? 1 : tags[t] + 1;
      });
    }
    return new Promise((resolve) => {
      resolve(true);
    });
  });
  await Promise.all(promises);
  return tags;
}

/**
 * 在标签文字的获取过程中，可能会带上开头的 #，统一用这个函数去处理
 */
export const purifyTag = (tag: string) => {
  if (typeof tag !== 'string' || tag.length === 0) {
    return '';
  }
  if (tag[0] !== '#') {
    return tag;
  }
  return tag.slice(1);
};

/**
 * 判断一个文件是否为 markdown 文件
 */
export const isMarkdownFile = (filePath: string) => {
  const extname = path.extname(filePath).toLowerCase();
  return extname === '.md' || extname === '.markdown';
};

export async function walk(folder: vscode.Uri, list: string[]): Promise<void> {
  for (const [name, type] of await vscode.workspace.fs.readDirectory(folder)) {
    if (type === vscode.FileType.File) {
      const filePath = posix.join(folder.path, name);
      list.push(filePath);
    } else if (type === vscode.FileType.Directory) {
      if (name.startsWith('.')) {
        continue;
      }
      const filePath = posix.join(folder.path, name);
      await walk(folder.with({ path: filePath }), list);
    }
  }
}
