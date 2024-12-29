import { FormField } from '../types/formInputs';

interface FormInfo {
  fields: FormField[];
}

export const radioCheck = (form: Element, input: Element, field: FormField, formInfo: FormInfo): void => {
  const groupedInputs = form.querySelectorAll(`input[name="${(input as HTMLInputElement).name}"]`);
  field.options = Array.from(groupedInputs).map(opt => {
    let optLabel = '';
    const optFor = opt.id;
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
}

export const stringInputs = (form: HTMLFormElement, formInfo: FormInfo): void => {
  const allInputs = form.querySelectorAll('input, select, textarea');
  allInputs.forEach(input => {
    // Skip if already processed via label
    if (input.closest('label') || form.querySelector(`label[for="${input.id}"]`)) return;

    let field: FormField = {
      label: input.getAttribute('aria-label') || input.getAttribute('placeholder') || 'No label',
      type: input.tagName.toLowerCase() === 'input' ? (input as HTMLInputElement).type : input.tagName.toLowerCase(),
      name: input.getAttribute('name') || null,
      id: input.getAttribute('id') || null,
      placeholder: input.getAttribute('placeholder') || null,
      required: input.hasAttribute('required') || false,
      // selector: generateUniqueSelector(input)
    };

    // For select elements, extract options
    if (input instanceof HTMLSelectElement) {
      field.options = Array.from(input.options).map(option => ({
        value: option.value,
        label: option.text.trim()
      }));
    }

    // For radio buttons and checkboxes, group them by name
    if (input instanceof HTMLInputElement && (input.type === 'radio' || input.type === 'checkbox')) {
      radioCheck(form, input, field, formInfo);
      return;
    }

    // Handle textarea type
    if (input instanceof HTMLTextAreaElement) {
      field.type = 'textarea';
    }

    formInfo.fields.push(field);
  });
}
