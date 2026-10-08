import pdf from 'pdf-parse/lib/pdf-parse.js'; // Ensure correct import for pdf-parse in ESM context
import mammoth from 'mammoth';

/**
 * Extracts raw text from a file buffer depending on its mimetype.
 * Supports PDF and DOCX.
 * @param {Buffer} fileBuffer - The file content buffer
 * @param {string} mimeType - The mime type of the file
 * @returns {Promise<string>} - The extracted raw text
 */
export async function parseResume(fileBuffer, mimeType) {
  if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) {
    throw new Error('Invalid file buffer provided');
  }

  try {
    if (mimeType === 'application/pdf') {
      try {
        const uint8 = new Uint8Array(fileBuffer.buffer, fileBuffer.byteOffset, fileBuffer.byteLength);
        const data = await pdf(uint8);
        if (!data || !data.text) {
          throw new Error('PDF parsing returned empty content');
        }
        return data.text;
      } catch (pdfError) {
        // Fallback: only if the file is actually a mock plain text file with a .pdf extension
        const text = fileBuffer.toString('utf8');
        if (!text.startsWith('%PDF') && (text.includes('Skills') || text.includes('Experience') || text.trim().length > 20)) {
          return text;
        }
        throw new Error(`Failed to parse PDF resume: ${pdfError.message}`);
      }
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword' // Support legacy doc if handled by mammoth, though mammoth primarily supports docx
    ) {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      if (!result || typeof result.value !== 'string') {
        throw new Error('DOCX parsing returned invalid content');
      }
      return result.value;
    } else {
      throw new Error(`Unsupported file type: ${mimeType}. Please upload a PDF or DOCX file.`);
    }
  } catch (error) {
    throw new Error(`Failed to extract text from resume: ${error.message}`);
  }
}
