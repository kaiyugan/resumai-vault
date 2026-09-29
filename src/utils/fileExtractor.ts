/**
 * Client-Side Resume File Text Extractor
 * Reads plain text, PDF, and Word (.docx) files directly in the browser
 * as a fail-safe whenever backend API endpoints are unreachable.
 */

export async function extractTextFromFileClientSide(file: File): Promise<string> {
  // 1. Plain text files
  if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
    return await file.text();
  }

  try {
    // 2. Read ArrayBuffer for PDF / DOCX / Binary formats
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Decode bytes to UTF-8 string
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const rawContent = decoder.decode(bytes);

    // Extract readable text chunks (sequences of printable characters)
    const readableChunks = rawContent.match(/[\x20-\x7E\t\r\n]{4,}/g) || [];

    // Filter out PDF/ZIP binary headers, syntax tags, and gibberish
    const cleanLines = readableChunks
      .map((c) => c.trim())
      .filter((c) => {
        if (c.length < 3) return false;
        if (
          c.startsWith('%PDF') ||
          c.startsWith('obj') ||
          c.startsWith('endobj') ||
          c.startsWith('<<') ||
          c.startsWith('>>') ||
          c.startsWith('/Type') ||
          c.startsWith('/Font') ||
          c.startsWith('/Filter') ||
          c.startsWith('/Length')
        ) {
          return false;
        }
        // Exclude purely numeric/punctuation streams
        if (/^[\d\s%/<>\-_+=;:{}\[\]\\|]+$/.test(c)) return false;
        return true;
      });

    const extracted = cleanLines.join('\n');
    if (extracted.trim().length > 30) {
      return extracted;
    }

    // 3. Fallback: ISO-8859-1 decoding for encoded PDFs
    const latin1Decoder = new TextDecoder('iso-8859-1');
    const latin1Content = latin1Decoder.decode(bytes);
    const latin1Chunks = latin1Content.match(/[a-zA-Z0-9\s.,;:\-()$%&#@!]{4,}/g) || [];
    const fallbackClean = latin1Chunks
      .map((c) => c.trim())
      .filter((c) => c.length > 5 && !c.includes('PDF-') && !c.includes('Root'));

    return fallbackClean.join('\n');
  } catch (err) {
    console.warn('Failed client-side binary text extraction:', err);
    return '';
  }
}
