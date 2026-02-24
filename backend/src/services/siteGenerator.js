export const generateSiteCode = async (prompt) => {
  const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width">
  <title>Generated Site</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>Generated Content</h1>
  <p>${prompt}</p>
  <script src="script.js"></script>
</body>
</html>`

  return {
    html: htmlTemplate,
    css: 'body { font-family: Arial; margin: 0; padding: 20px; }',
    js: 'console.log("Site generated");'
  }
}
