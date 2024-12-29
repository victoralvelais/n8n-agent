import puppeteer from 'puppeteer';
import { radioCheck, stringInputs } from './formFill'
import { FormField } from '../types/formInputs';

interface FormInfo {
  formIndex: number;
  action: string | null;
  method: string;
  fields: FormField[];
}

async function main(url: string) {
  console.log('Starting the test...');
  const browser = await puppeteer.launch({ headless: false });
  
  const page = await browser.newPage();
  await page.goto(url);

  // Wait for the form to load. Adjust the selector if necessary.
  await page.waitForSelector('form');

  // Evaluate the page to extract form data
  const formData = await page.evaluate(() => {
      // Function to generate a unique selector for an element
    // const generateUniqueSelector = (element) => {
    //   const path = [];
    //   while (element && element.nodeType === Node.ELEMENT_NODE) {
    //     let selector = element.nodeName.toLowerCase();
    //     if (element.id) {
    //       selector += `#${element.id}`;
    //       path.unshift(selector);
    //       break;
    //     } else {
    //       let sib = element, nth = 1;
    //       while (sib = sib.previousElementSibling) {
    //         if (sib.nodeName.toLowerCase() === selector) nth++;
    //       }
    //       if (nth !== 1) selector += `:nth-of-type(${nth})`;
    //     }
    //     path.unshift(selector);
    //     element = element.parentNode;
    //   }
    //   return path.join(' > ');
    // };

    const forms = document.querySelectorAll('form');
    const extractedForms: FormInfo[] = [];

    forms.forEach((form, formIndex) => {
      const formInfo: FormInfo = {
        formIndex: formIndex + 1,
        action: form.getAttribute('action') || null,
        method: form.getAttribute('method') || 'GET',
        fields: []
      };

      // Get all label elements within the form
      const labels = form.querySelectorAll('label');

      labels.forEach(label => {
        let field: FormField = {};

        // Extract the label text (question)
        field.label = label.innerText.replace(/\*\s*$/, '').trim();

        // Determine if the field is required
        // 1. Check for 'required' attribute on associated input
        // 2. Check if label contains an asterisk (*)
        let isRequired = false;

        // Find associated input/select/textarea
        let input: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null = null;
        const forAttr = label.getAttribute('for');
        console.log('forAttr:', forAttr, 'label', label.innerText, label);
        if (forAttr) {
          input = form.querySelector(`#${forAttr}`) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
        } else {
          // If label wraps the input
          input = label.querySelector('input, select, textarea') as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
        }

        if (input) {
          isRequired = input.hasAttribute('required') || /.*\*$/.test(label.innerText);
          
          // Populate field properties
          field.type = input.tagName.toLowerCase() === 'input' ? (input as HTMLInputElement).type : input.tagName.toLowerCase();
          field.name = input.getAttribute('name') || null;
          field.id = input.getAttribute('id') || null;
          field.placeholder = input.getAttribute('placeholder') || null;
          field.required = isRequired;

          // For select elements, extract options
          if (input instanceof HTMLSelectElement) {
            field.options = Array.from(input.options).map(option => ({
              value: option.value,
              label: option.text.trim()
            }));
          }

          // For radio buttons and checkboxes, group them by name
          if (input instanceof HTMLInputElement && (input.type === 'radio' || input.type === 'checkbox')) {
            const groupedInputs = form.querySelectorAll(`input[name="${input.name}"]`);
            field.options = Array.from(groupedInputs).map(opt => {
              let optLabel = '';
              const optFor = (opt as HTMLInputElement).id;
              if (optFor) {
                const optLabelElem = form.querySelector(`label[for="${optFor}"]`);
                if (optLabelElem) {
                  optLabel = optLabelElem.textContent?.trim() || '';
                }
              }
              if (!optLabel) {
                // If label is not associated via 'for', try parent label
                const parentLabel = opt.closest('label');
                if (parentLabel) {
                  optLabel = parentLabel.textContent?.trim() || '';
                }
              }
              return {
                value: (opt as HTMLInputElement).value,
                label: optLabel
              };
            });
            // To avoid duplicate entries in formInfo.fields
            if (!formInfo.fields.some(f => f.name === field.name)) {
              formInfo.fields.push(field);
            }
            return; // Skip adding individually
          }

          // Handle textarea type
          if (input instanceof HTMLTextAreaElement) {
            field.type = 'textarea';
          }

          // Add the field to formInfo
          formInfo.fields.push(field);
        }
      });
      // Handle inputs without labels
      stringInputs(form, formInfo);

      extractedForms.push(formInfo);
    });

    return extractedForms;
  });

  // Output the extracted form data as JSON
  console.log(`formData - ${formData.length} inputs`, JSON.stringify(formData, null, 2));
}

export default main;

// pnpm tsx src/job-apps/app-input-test https://apply.workable.com/n8n/j/613C3A6E23/apply/
// pnpm tsx src/job-apps/app-input-test https://motionrecruitment.com/tech-jobs/houston/contract/ux-ui-developer/553909?utm_source=linkedin&utm_medium=feed&utm_campaign=paid-20210428
// pnpm tsx src/job-apps/app-input-test https://job-boards.greenhouse.io/notion/jobs/5180851003
// pnpm tsx src/job-apps/app-input-test https://careers.tractian.com/jobs/0d9c0f26-847f-448c-8828-8d6ad2a04f38/apply
// Only run if directly executed
if (import.meta.url === import.meta.resolve('./app-input-test.ts')) {
  console.log('Running app-input-test.ts', process.argv);
  const url = process.argv[2] || 'https://n8n.io/';
  main(url)
    .then(result => console.log(JSON.stringify(result)))
    .catch(console.error);
}

console.log('app-input-test.ts loaded');
