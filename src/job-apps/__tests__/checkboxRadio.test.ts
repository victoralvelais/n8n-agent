import fs from 'fs';
import path from 'path';
import type { Browser, Page } from 'puppeteer';
import puppeteer from 'puppeteer';
import { radioCheck } from '../formFill';
import { FormField } from '../../types/formInputs';
const notionHtml = fs.readFileSync(path.join(__dirname, '../sources/notion.html'), 'utf8');
const workableHtml = fs.readFileSync(path.join(__dirname, '../sources/workable.html'), 'utf8');

interface FormInfo {
  fields: FormField[];
}

describe('Form Fill Tests', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await puppeteer.launch();
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  test('radioCheck function with radio buttons', async () => {
    page.on('console', msg => console.log('Browser console:', msg.text()));
    await page.setContent(workableHtml);
    const formInfo: FormInfo = { fields: [] };
    const serializedRadioCheck = `(${radioCheck.toString()})`

    const updatedFormInfo = await page.evaluate((serializedRadioCheck, formInfo) => {
      const form = document.forms[0];

      if (form) {
        const input = form.querySelector('input[type="radio"]') as HTMLInputElement;
        const field = { name: input.name, type: 'radio' };
        eval(serializedRadioCheck)(form, input, field, formInfo);
      }

      return formInfo;
    }, serializedRadioCheck, formInfo);
    expect(updatedFormInfo.fields.length).toBeGreaterThan(0);
  });
});

// jest src/job-apps/__tests__/checkboxRadio.test.ts -t --watch