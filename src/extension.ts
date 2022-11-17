import * as vscode from 'vscode';
import { getTags, walk } from './utils';
import { TagProvider } from './TagsProvider';
import { FilesProvider } from './FilesProvider';
import { getWebviewContent } from './webview';
import { ALL_TAGS, UNTAGGED } from './constants';

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
    const tagList = keys
      .map((key) => [key, tags[key]])
      .filter(([key]) => {
        return key !== UNTAGGED;
      });

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
  const tagTreeView = vscode.window.createTreeView('tags', {
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
    tagTreeView.reveal(tagProvider.elements[ALL_TAGS], {
      focus: true,
      select: true,
    });
  });
}

// this method is called when your extension is deactivated
export function deactivate() {}
