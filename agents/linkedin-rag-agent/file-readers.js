const fs = require("fs");
const path = require("path");

const SUPPORTED_EXTENSIONS = [".txt", ".md", ".pdf", ".docx", ".json"];

function isSupported(filePath) {
  return SUPPORTED_EXTENSIONS.includes(path.extname(filePath).toLowerCase());
}

async function extractText(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".txt" || ext === ".md") {
    return fs.readFileSync(filePath, "utf8");
  }

  if (ext === ".json") {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
      if (Array.isArray(data)) {
        return data.map((item) => (typeof item === "string" ? item : JSON.stringify(item))).join("\n\n");
      }
      return JSON.stringify(data, null, 2);
    } catch {
      return fs.readFileSync(filePath, "utf8");
    }
  }

  if (ext === ".pdf") {
    const pdfParse = require("pdf-parse");
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (ext === ".docx") {
    const mammoth = require("mammoth");
    const buffer = fs.readFileSync(filePath);
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  throw new Error(`Unsupported file type: ${ext}`);
}

module.exports = { isSupported, extractText, SUPPORTED_EXTENSIONS };
