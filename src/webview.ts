export function getWebviewContent(tags: any[] = []) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cat Coding</title>
    <style>
      #buttons {
        position: fixed;
        right: 20px;
        bottom: 20px;
        width: 40px;
        text-align: center;
        top: 45%;
      }
      .button {
        font-size: 32px;
        font-weight: bold;
        cursor: pointer;
        color: #000;
      }
    </style>
    <script src="https://cdn.jsdelivr.net/npm/wordcloud@1.2.2/src/wordcloud2.min.js"></script>
</head>
<body>
    <canvas id="wordcloud"></canvas>
    <div id="buttons">
      <div class="button" onclick="redraw(1)">+</div>
      <div class="button" onclick="redraw(-1)">-</div>
      <div class="button" onclick="draw()">🔁</div>
    </div>

    <script>
      const vscode = acquireVsCodeApi();
      const tags = ${JSON.stringify(tags)};

      let weightFactor = 5;

      function redraw(diff) {
        weightFactor += diff;
        draw();
      }
  
      const canvas = document.getElementById('wordcloud');
  
      function draw() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
  
        WordCloud(canvas, {
          list: tags,
          gridSize: 5,
          fontFamily: 'Times, serif',
          weightFactor,
          color: 'random-dark',
          rotateRatio: 0,
          rotationSteps: 2,
          backgroundColor: '#fff',
          minSize: 4,
          drawOutOfBound: true,
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
