import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { ElementHandle } from 'puppeteer';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/legacy/build/pdf.worker.mjs';

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function handleFileUploads(fileUpload: ElementHandle<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLDivElement>, page: any) {
  // Get the label to determine what kind of file is needed
  const forAttr = await fileUpload.evaluate(el => {
    const childLabelEl = el.querySelector('label');
    return childLabelEl ? childLabelEl.getAttribute('for') : null;
  });
  
  // Determine which file to upload based on the label
  const labelLower = forAttr?.toLowerCase() || '';
  const matchResume = ['resume', 'cv', 'curriculum vitae']
  const resume = 'resume.pdf';

  if (!matchResume.some(word => labelLower.includes(word))) {
    return;
  }

  // Construct the full path to the file
  const filePath = path.resolve(__dirname, '..', '..', resume);

  // Check if the file exists
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  // Find the actual file input element within the file-upload div
  const fileInput = await fileUpload.$('input[type="file"]');
  if (!fileInput) {
    console.log('File input element not found');
    return;
  }

  // Upload the file - doesn't work if page/element not fully loaded
  await fileInput.uploadFile(filePath);
}

export async function getResume() {
  const filePath = path.resolve(__dirname, '..', '..', 'resume.pdf');
  // Check if the file exists
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  return filePath;
}

export async function parseResume(filePath?: string): Promise<string> {
  try {
    if (!filePath) {
      filePath = path.resolve(__dirname, '..', '..', 'resume.pdf');
    }
    // Load the PDF file
    const buffer = await fs.promises.readFile(filePath);
    // Convert Buffer to Uint8Array
    const data = new Uint8Array(buffer);
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdfDocument = await loadingTask.promise;
    
    // Get all pages
    let fullText = '';
    for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }

    // Basic text cleaning
    fullText = fullText.replace(/\s+/g, ' ').trim();

    return fullText;
  } catch (error) {
    console.error('Error parsing PDF resume:', error);
    throw new Error('Failed to parse PDF resume');
  }
}