import * as vscode from 'vscode';
import { getTags, walk } from './utils';
import { TagProvider } from './TagsProvider';
import { FilesProvider } from './FilesProvider';
import { getWebviewContent } from './webview';
import { ALL_TAGS } from './constants';

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "kainotes" is now active!');

  vscode.commands.registerCommand('kainotes.tagCloud', async function () {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      return vscode.window.showInformationMessage('Open a folder first');
    }
    const folderUri = workspaceFolders[0].uri;
    const list = await walk(folderUri);
    const tags = await getTags(list);
    const keys = Object.keys(tags);
    const tagList = keys.map((key) => [key, tags[key]]);

    const panel = vscode.window.createWebviewPanel(
      'tagCloud',
      'Tag Cloud',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
      }
    );

    panel.webview.html = getWebviewContent(tagList);
  });

  const rootPath =
    vscode.workspace.workspaceFolders &&
    vscode.workspace.workspaceFolders.length > 0
      ? vscode.workspace.workspaceFolders[0].uri.fsPath
      : undefined;

  const tagProvider = new TagProvider(rootPath as string);
  vscode.window.createTreeView('tags', {
    treeDataProvider: tagProvider,
  });

  const filesForTagProvider = new FilesProvider(rootPath as string);
  vscode.window.createTreeView('filesForTag', {
    treeDataProvider: filesForTagProvider,
  });
  vscode.commands.registerCommand('kainotes.showTag', (tag: string) => {
    filesForTagProvider.forTag(tag);
  });

  vscode.commands.registerCommand(
    'kainotes.openFile',
    (resource: vscode.Uri) => {
      vscode.window.showTextDocument(resource);
    }
  );

  vscode.commands.registerCommand('kainotes.refresh', () => {
    tagProvider.refresh();
    filesForTagProvider.refresh();
  });

  vscode.commands.registerCommand('kainotes.reset', () => {
    filesForTagProvider.forTag(ALL_TAGS);
    vscode.commands.executeCommand('kainotes.showTag', ALL_TAGS);
  });
}

// this method is called when your extension is deactivated
export function deactivate() {}
