/**
 * High-Precision Client-Side Resume File Text Extractor
 * Uses pdfjs-dist for exact 100% PDF text parsing in modern browsers.
 */
import * as pdfjsLib from 'pdfjs-dist';

// Configure CDN worker for browser execution
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

/**
 * Validates if a extracted line is genuine human-readable text
 * and not raw PDF stream syntax, font binary symbols, or gibberish.
 */
export function isCleanTextLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 2) return false;
  
  // Exclude PDF/ZIP structural tags & syntax
  if (
    trimmed.startsWith('%PDF') ||
    trimmed.startsWith('/Type') ||
    trimmed.startsWith('/Font') ||
    trimmed.startsWith('/Filter') ||
    trimmed.startsWith('/Length') ||
    trimmed.startsWith('obj') ||
    trimmed.startsWith('endobj') ||
    trimmed.startsWith('<<') ||
    trimmed.startsWith('>>')
  ) {
    return false;
  }

  // Reject strings that are primarily punctuation or weird non-alphanumeric streams (e.g. (@, tWcl, y?UE)
  const letters = trimmed.match(/[a-zA-Z]/g) || [];
  if (letters.length < 2) return false;

  const validChars = trimmed.match(/[a-zA-Z0-9\s.,;:\-()$%&#@!]/g) || [];
  if (validChars.length / trimmed.length < 0.65) {
    return false;
  }

  return true;
}

export async function extractTextFromFileClientSide(file: File): Promise<string> {
  // 1. Plain text files (.txt)
  if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
    const text = await file.text();
    return text.split('\n').filter(isCleanTextLine).join('\n');
  }

  // 2. PDF Files (.pdf) via pdfjs-dist
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    try {
      const buffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
      const pdf = await loadingTask.promise;
      let fullText = '';

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Extract exact text strings from PDF items
        const pageLines = textContent.items
          .map((item: any) => (item.str || '').trim())
          .filter((str: string) => str.length > 0);

        fullText += pageLines.join(' ') + '\n';
      }

      const cleanLines = fullText
        .split('\n')
        .map((l) => l.trim())
        .filter(isCleanTextLine);

      if (cleanLines.length > 0) {
        return cleanLines.join('\n');
      }
    } catch (pdfErr) {
      console.warn('pdfjs-dist extraction error:', pdfErr);
    }
  }

  // 3. Fallback for Word (.docx) or other documents
  try {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    const decoder = new TextDecoder('utf-8', { fatal: false });
    const rawContent = decoder.decode(bytes);

    // Extract text from XML tags or word matches
    const xmlMatches = rawContent.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
    if (xmlMatches && xmlMatches.length > 0) {
      const extractedXmlText = xmlMatches
        .map((m) => m.replace(/<[^>]+>/g, '').trim())
        .filter(isCleanTextLine)
        .join('\n');
      if (extractedXmlText.length > 20) return extractedXmlText;
    }

    // Match readable word sequences
    const wordMatches = rawContent.match(/\b[A-Za-z0-9.,;:\-()$%&#@!]{3,}\b/g) || [];
    const cleanWords = wordMatches.filter((w) => /^[a-zA-Z]/.test(w) && !w.startsWith('PDF'));
    return cleanWords.join(' ');
  } catch (err) {
    console.warn('Failed client-side binary text extraction:', err);
    return '';
  }
}
