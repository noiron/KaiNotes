export function getWebviewContent(tags: any[] = []) {
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