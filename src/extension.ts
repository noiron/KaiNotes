import * as vscode from 'vscode';
import { isMarkdownFile } from 'kainotes-tools';
import { TagProvider } from './TagsProvider';
import { FilesProvider } from './FilesProvider';
import { ALL_TAGS, MARKDOWN_REGEX, SORT_METHOD } from './constants';
import { HighlightConfig } from './types';
import * as commands from './commands';

export let sortMethod: (typeof SORT_METHOD)[keyof typeof SORT_METHOD] =
  SORT_METHOD.quantity;

export function activate(context: vscode.ExtensionContext) {
  const workspaceFolders = vscode.workspace.workspaceFolders;

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

  vscode.commands.registerCommand('kainotes.searchTag', () =>
    commands.searchTag(filesForTagProvider)
  );

  vscode.commands.registerCommand('kainotes.openFile', (resource: vscode.Uri) =>
    vscode.window.showTextDocument(resource)
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

  vscode.commands.registerCommand('kainotes.tagCloud', () =>
    commands.tagCloud(context)
  );

  vscode.commands.registerCommand('kainotes.toggleSortMethod', () => {
    sortMethod =
      sortMethod === SORT_METHOD.quantity
        ? SORT_METHOD.name
        : SORT_METHOD.quantity;
    tagProvider.refresh();
  });

  vscode.commands.registerCommand('kainotes.summary', commands.summary);
  vscode.commands.registerCommand('kainotes.renameTag', commands.renameTag);

  const completion = vscode.languages.registerCompletionItemProvider(
    'markdown',
    {
      provideCompletionItems: (document, position) =>
        commands.completeTagInput(workspaceFolders),
    },
    '#' // triggered whenever a '#' is being typed
  );

  context.subscriptions.push(
    completion,
    vscode.window.onDidChangeActiveTextEditor(() => decorateTags()),
    vscode.workspace.onDidChangeTextDocument(() => decorateTags())
  );

  decorateTags();
}

const config = vscode.workspace.getConfiguration('kainotes');
const highlight = config.get('highlight') as HighlightConfig;

const decorationType = vscode.window.createTextEditorDecorationType({
  borderRadius: '4px',
  backgroundColor: highlight.backgroundColor,
  color: highlight.color,
  fontWeight: 'medium',
});

function decorateTags() {
  if (!highlight.enable) {
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

  editor.setDecorations(decorationType, ranges);
}

// this method is called when your extension is deactivated
export function deactivate() {}
