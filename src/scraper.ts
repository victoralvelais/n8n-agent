import puppeteer from 'puppeteer';

async function main(url: string) {
  const browser = await puppeteer.launch({ headless: false });
  
  const page = await browser.newPage();
  await page.goto(url);
  
  // Get the title of the page
  const title = await page.title();
  
  // Take a screenshot
  await page.screenshot({ path: 'example.png' });
  await browser.close();
  
  return { title, screenshotPath: 'example.png' };
}

export default main;

// Only run if directly executed
if (import.meta.url === import.meta.resolve('./scraper.ts')) {
    const url = process.argv[2] || 'https://n8n.io/';
    main(url)
    .then(result => console.log(JSON.stringify(result)))
    .catch(console.error);
}