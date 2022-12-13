import * as vscode from 'vscode';
import { posix } from 'path';
import { isMarkdownFile, purifyTag } from './utils';
import { TagProvider } from './TagsProvider';
import { FilesProvider } from './FilesProvider';
import { getWebviewContent } from './webview';
import { ALL_TAGS, MARKDOWN_REGEX, SORT_METHOD, UNTAGGED } from './constants';
import { HighlightConfig } from './types';
import dataSource from './DataSource';

export let sortMethod: typeof SORT_METHOD[keyof typeof SORT_METHOD] =
  SORT_METHOD.quantity;

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "kainotes" is now active!');

  const workspaceFolders = vscode.workspace.workspaceFolders;

  vscode.commands.registerCommand('kainotes.tagCloud', async function () {
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

  vscode.commands.registerCommand('kainotes.searchTag', () => {
    const editor = vscode.window.activeTextEditor;
    const selectedText = editor?.document.getText(editor.selection);
    if (!selectedText) {
      return;
    }
    const tag = purifyTag(selectedText);
    vscode.commands.executeCommand('filesForTag.focus');
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

  vscode.commands.registerCommand('kainotes.toggleSortMethod', () => {
    sortMethod =
      sortMethod === SORT_METHOD.quantity
        ? SORT_METHOD.name
        : SORT_METHOD.quantity;
    tagProvider.refresh();
  });

  vscode.commands.registerCommand('kainotes.summary', async () => {
    if (!vscode.workspace.workspaceFolders) {
      return vscode.window.showInformationMessage(
        'No folder or workspace opened'
      );
    }

    await dataSource.update();
    const { fileList, tagKeys } = dataSource;
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
  });

  const completion = vscode.languages.registerCompletionItemProvider(
    'markdown',
    {
      async provideCompletionItems(document, position) {
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
          (tag) =>
            new vscode.CompletionItem(
              tag,
              vscode.CompletionItemKind.Constant
              // vscode.CompletionItemKind.Value
            )
        );
      },
    },
    '#' // triggered whenever a '#' is being typed
  );

  context.subscriptions.push(completion);

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(() => decorateTags()),
    vscode.workspace.onDidChangeTextDocument(() => decorateTags())
  );

  decorateTags();
}

function decorateTags() {
  const config = vscode.workspace.getConfiguration('kainotes');
  const highlight = config.get('highlight') as HighlightConfig;

  const { enable, color = '#1f1f1f', backgroundColor = '#d9ad00' } = highlight;
  if (!enable) {
    return;
  }

  const editor = vscode.window.activeTextEditor!;
  if (!editor) {
    return;
  }
  const document = editor.document;
  if (!isMarkdownFile(document.uri.fsPath)) {
    return;
  }
  const matches = document.getText().matchAll(MARKDOWN_REGEX);

  const ranges = Array.from(matches).map((match) => {
    const index1 = match.index || 0;
    const index2 = index1 + match[0].length;
    const startPos = editor.document.positionAt(index1);
    const endPos = editor.document.positionAt(index2);
    return new vscode.Range(startPos, endPos);
  });

  const decorationType = vscode.window.createTextEditorDecorationType({
    borderRadius: '4px',
    backgroundColor,
    color,
    fontWeight: 'medium',
  });

  editor.setDecorations(decorationType, ranges);
}

// this method is called when your extension is deactivated
export function deactivate() {}
