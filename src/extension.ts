import * as vscode from 'vscode';
import { posix } from 'path';
import { getTags, walk } from './utils';
import { TagProvider } from './TagsProvider';
import { FilesProvider } from './FilesProvider';

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
}

// this method is called when your extension is deactivated
export function deactivate() {}

function getWebviewContent(tags: any[] = []) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cat Coding</title>
    <script src="https://cdn.jsdelivr.net/npm/wordcloud@1.2.2/src/wordcloud2.min.js"></script>
</head>
<body>
    <canvas id="wordcloud"></canvas>
    <script>
      const tags = ${JSON.stringify(tags)};

      const canvas = document.getElementById('wordcloud');
      canvas.width = window.innerWidth * 0.95;
      canvas.height = window.innerHeight * 0.95;

      WordCloud(canvas, {
      list: tags,
      gridSize: 5,
      fontFamily: 'Times, serif',
      weightFactor: 10,
      color: 'random-dark',
      rotateRatio: 0,
      rotationSteps: 2,
      backgroundColor: '#fff',
			minSize: 4,
      drawOutOfBound: true
    });
    </script>
</body>
</html>`;
}
