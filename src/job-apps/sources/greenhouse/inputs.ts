import type { ElementHandle } from 'puppeteer';

export async function getElementProps(input: ElementHandle<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLDivElement>) {
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