import * as vscode from 'vscode';

export function getWebviewContent(
  tags: any[] = [],
  icons: { [index: string]: vscode.Uri }
) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cat Coding</title>
    <style>
      body {
        background: #fff;
      }

      body.vscode-dark {
        background: #000;
      }

      #buttons {
        position: fixed;
        right: 20px;
        width: 40px;
        text-align: center;
        top: 45%;
        background: #ccc;
        border-radius: 4px;
      }
      .button {
        font-size: 32px;
        font-weight: bold;
        cursor: pointer;
        color: #000;
      }
      .button img {
        width: 24px;
      }
    </style>
    <script src="https://cdn.jsdelivr.net/npm/wordcloud@1.2.2/src/wordcloud2.min.js"></script>
    <script>

    </script>
</head>
<body>
    <canvas id="wordcloud"></canvas>
    <div id="buttons">
      <div class="button" onclick="redraw(1)">
        <img src="${icons.zoomIn}" />
      </div>
      <div class="button" onclick="redraw(-1)">
        <img src="${icons.zoomOut}" />
      </div>
      <div class="button" onclick="draw()">
        <img src="${icons.refresh}" />
      </div>
    </div>

    <script>
      const vscode = acquireVsCodeApi();
      const tags = ${JSON.stringify(tags)};
      const isDarkTheme = document.querySelector('body').classList.contains('vscode-dark');

      const maxCount = tags.reduce((a, b) => Math.max(a, b[1]), 0);
      // User a dynamic weight factor. Can we based on total count?
      let weightFactor = window.innerWidth / maxCount / 5;
      // const totalCount = tags.reduce((a, b) => a + b[1], 0);
      // let weightFactor = window.innerWidth / totalCount / 2;

      function redraw(diff) {
        weightFactor += diff;
        draw();
      }
  
      const canvas = document.getElementById('wordcloud');

      function draw() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const colors = isDarkTheme ? {
          color: 'random-light',
          backgroundColor: '#000'
        }: {
          color: 'random-dark',
          backgroundColor: '#fff'
        };

        WordCloud(canvas, {
          list: tags,
          gridSize: 5,
          fontFamily: 'Times, serif',
          weightFactor,
          ...colors,
          rotateRatio: 0,
          rotationSteps: 2,
          minSize: 4,
          drawOutOfBound: true,
          // shuffle: false,
          click: (item) => {
            const tag = item[0];
            vscode.postMessage({
              command: 'tag',
              tag
            });
          },
        });
      }
  
      draw();
  
    </script>
</body>
</html>`;
}
