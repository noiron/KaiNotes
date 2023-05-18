import * as fs from 'fs';
import * as path from 'path';
import { getFilesContainTag, purifyTag } from 'kainotes-tools';
import * as vscode from 'vscode';
import { posix } from 'path';
import { FilesProvider } from './FilesProvider';
import dataSource from './DataSource';
import { TagItem } from './TagsProvider';
import { readFileContent } from './utils';
import { getWebviewContent } from './webview';

export async function tagCloud(context: vscode.ExtensionContext) {
  await dataSource.update();

  const panel = vscode.window.createWebviewPanel(
    'tagCloud',
    'Tag Cloud',
    vscode.ViewColumn.One,
    {
      enableScripts: true,
    }
  );

  panel.webview.html = getWebviewContent(dataSource.tagList);

  panel.webview.onDidReceiveMessage(
    (message) => {
      switch (message.command) {
        case 'tag':
          vscode.commands.executeCommand('filesForTag.focus');
          vscode.commands.executeCommand('kainotes.showTag', message.tag);
      }
    },
    undefined,
    context.subscriptions
  );
}

export function searchTag(filesForTagProvider: FilesProvider) {
  const editor = vscode.window.activeTextEditor;
  const selectedText = editor?.document.getText(editor.selection);
  if (!selectedText) {
    return;
  }
  const tag = purifyTag(selectedText);
  vscode.commands.executeCommand('filesForTag.focus');
  filesForTagProvider.forTag(tag);
}

export async function summary() {
  if (!vscode.workspace.workspaceFolders) {
    return vscode.window.showInformationMessage(
      'No folder or workspace opened'
    );
  }

  await dataSource.update();
  const { fileList, tagKeys } = dataSource;
  // TODO: more summary todo
  const writeStr = `共有 ${fileList.length} 个文件、${tagKeys.length} 个标签
所有的标签包括：${tagKeys.join(', ')}
`;
  const writeData = Buffer.from(writeStr, 'utf8');

  const folderUri = vscode.workspace.workspaceFolders[0].uri;
  const fileUri = folderUri.with({
    path: posix.join(folderUri.path, '.kainotes/summary.txt'),
  });

  await vscode.workspace.fs.writeFile(fileUri, writeData);

  // const readData = await vscode.workspace.fs.readFile(fileUri);
  // const readStr = Buffer.from(readData).toString('utf8');
  // vscode.window.showInformationMessage(readStr);
  vscode.window.showTextDocument(fileUri);
}

export async function renameTag(tagItem: TagItem) {
  const tag = tagItem.label as string;
  const workspaceFolders = vscode.workspace.workspaceFolders!;
  const folderUri = workspaceFolders[0].uri;
  const { fileList } = dataSource;
  const files = await getFilesContainTag(
    folderUri.fsPath,
    fileList,
    tag,
    readFileContent
  );
  const newTag = await vscode.window.showInputBox({
    title: 'Please input new tag',
    value: tag,
  });
  if (!newTag || tag === newTag) {
    return;
  }

  files.forEach(async (relativePath) => {
    const absolutePath = path.join(folderUri.fsPath, relativePath);
    const content = await readFileContent(absolutePath);
    const newContent = content.replace('#' + tag, '#' + newTag);
    fs.writeFileSync(absolutePath, newContent);
  });

  vscode.window.showInformationMessage(
    `Rename tag "${tag}" to "${newTag}" in ${files.length} file${
      files.length > 1 ? 's' : ''
    }`
  );

  // todo: auto refresh tag list ?
}

export async function completeTagInput(
  workspaceFolders: readonly vscode.WorkspaceFolder[] | undefined
) {
  if (!workspaceFolders) {
    return;
  }
  const config = vscode.workspace.getConfiguration('kainotes');
  if (!config.tagCompletion) {
    return;
  }

  // 这里每次输入都重复调用了，之后优化
  dataSource.update();

  return dataSource.tagKeys.map(
    (tag) => new vscode.CompletionItem(tag, vscode.CompletionItemKind.Constant)
  );
}
