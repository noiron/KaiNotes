import * as vscode from 'vscode';
import dataSource from './DataSource';

export class TagSearchViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'tagSearchView';

  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public async resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,

      // localResourceRoots: [
      // 	this._extensionUri
      // ]
    };

    await dataSource.update();
    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview, dataSource.tagList);

    webviewView.webview.onDidReceiveMessage((data) => {
      switch (data.type) {
        case 'tag':
          vscode.commands.executeCommand('filesForTag.focus');
          vscode.commands.executeCommand('kainotes.showTag', data.tag);
      }
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview, tags: any[] = []) {
    // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'tags-search-webview.js')
    );

    // Use a nonce to only allow a specific script to be run.
    const nonce = getNonce();

    return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
				-->

        <!--
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
        -->

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<title>Tag Search</title>
        <script>
          window.tags = ${JSON.stringify(tags)};
        </script>
			</head>
			<body>
        <div id="root"></div>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
  }
}

function getNonce() {
  let text = '';
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}