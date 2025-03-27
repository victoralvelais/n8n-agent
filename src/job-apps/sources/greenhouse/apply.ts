import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { interactWithDropdown } from './dropdown.js';
import { getAIAnswer } from '../../agentAssist.js';

// Get the current file path and check if it's the main module
const __filename = fileURLToPath(import.meta.url);
const isMainModule = process.argv[1] === __filename;

async function main(url: string) {
  const browser = await puppeteer.launch({ headless: false });
  
  const page = await browser.newPage();
  await page.goto(url);
  
  // Find the form element
  const form = await page.waitForSelector('form')
  if (!form) throw new Error('Form not found');

  // Find all input elements and select elements separately
  const standardInputs = await form.$$('input, select, textarea');
  const customSelects = await form.$$('div.select');
  const fileploads = await form.$$('div.file-upload');

  // Process standard inputs
  for (const input of standardInputs) {
    const { label, type } = await getElementProps(input);

    // Skip if this is a custom select element
    const skip = await input.evaluate(el => !!el.closest('div.select, div.file-upload'));
    if (skip) continue;
    
    // Send question to API and get response
    const { answer } = await getAIAnswer(label);

    // Input the answer based on input type
    if (type === 'textarea' || type === 'input') {
      await input.click();
      await page.keyboard.type(String(answer));
    } else if (type === 'select') {
      await input.select(answer);
    }

    console.log('Answer:', answer);
  }

  // Process custom select elements
  for (const select of customSelects) {
    const { label } = await getElementProps(select);
    await interactWithDropdown(page, select, async (options, isMulti) => {
      const { answer } = await getAIAnswer(label, options, isMulti);
      console.log('choosing from options:', options);
      console.log('we choose:', answer);
      return options.filter(option => answer.includes(option));
    });
  }
}

export default main;

// Only run if directly executed
if (isMainModule) {
  const backupUrl = 'https://boards.greenhouse.io/whatnot/jobs/5376445004';
  const url = process.argv[2] || backupUrl;
  console.log('url', url)
  main(url)
  .then(result => console.log(JSON.stringify(result)))
  .catch(console.error);
}

async function getElementProps(input: puppeteer.ElementHandle<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLDivElement>) {
  const type = await input.evaluate(el => el.tagName.toLowerCase());
  const label = await input.evaluate(el => {
    if ('labels' in el) return el.labels?.[0]?.textContent?.trim();
    const labelEl = el.closest('label');
    const childLabelEl = el.querySelector('label');
    return (
      labelEl?.textContent?.trim() ||
      childLabelEl?.textContent?.trim() ||
      'No label found'
    );
  });
  return { label, type };
}