import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { interactWithDropdown } from './dropdown.js';

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

  // Process standard inputs
  for (const input of standardInputs) {
    // TODO
    console.log('standard input', input);
  }

  // Process custom select elements
  for (const select of customSelects) {
    // TODO Dropdown is working, but no implementation for multiselect dropdown
    await interactWithDropdown(page, select, async (options) => {
      // For now, just select the first or 3rd option
      console.log('choosing from options:', options);
      return options.length > 2 ? options[2] : options.length > 0 ? options[0] : null;
    });
  }

  // Take a screenshot
  // await page.screenshot({ path: 'example.png' });
  // await browser.close();
  
  // return { title, screenshotPath: 'example.png' };
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