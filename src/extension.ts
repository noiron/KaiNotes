import * as vscode from 'vscode';
import { getTags, isMarkdownFile, walk } from './utils';
import { TagProvider } from './TagsProvider';
import { FilesProvider } from './FilesProvider';
import { getWebviewContent } from './webview';
import { ALL_TAGS, MARKDOWN_REGEX, UNTAGGED } from './constants';

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "kainotes" is now active!');

  const workspaceFolders = vscode.workspace.workspaceFolders;

  vscode.commands.registerCommand('kainotes.tagCloud', async function () {
    // const workspaceFolders = vscode.workspace.workspaceFolders;
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

  const completion = vscode.languages.registerCompletionItemProvider(
    'markdown',
    {
      async provideCompletionItems(document, position) {
        if (!workspaceFolders) {
          return;
        }
        const folderUri = workspaceFolders[0].uri;
        // 这里每次输入都重复调用了？之后优化
        const list = await walk(folderUri);
        const tags = await getTags(list);
        const keys = Object.keys(tags);

        return keys.map(
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
  const editor = vscode.window.activeTextEditor!;
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
    backgroundColor: '#d9ad00',
    color: '#1f1f1f',
    fontWeight: 'medium',
  });

  editor.setDecorations(decorationType, ranges);
}

// this method is called when your extension is deactivated
export function deactivate() {}
