import { ElementHandle } from "puppeteer";
/**
 * Interacts with a React Select dropdown - opens it, gets options, and selects one
 * @param page Puppeteer Page object
 * @param dropdown Selector for the dropdown element
 * @param optionSelector Function that takes options array and returns the option to select
 * @returns Promise resolving to the selected option or null if selection failed
 */

export async function interactWithDropdown(
  page: any, 
  dropdown: ElementHandle<HTMLDivElement>,
  optionSelector: (options: string[], isMulti: boolean) => Promise<string | string[]>
): Promise<string | null> {
  try {
    // Find and click the control element to open the dropdown
    const control = await dropdown.$('.select__control');
    if (!control) {
      console.log('Select control not found');
      return null;
    }
    
    // Click to open the dropdown
    await control.click();
    await page.waitForFunction('setTimeout(() => true, 500)');
    
    // Check if dropdown opened
    const isOpen = await page.evaluate(() => {
      return !!(
        document.querySelector('.select__menu') || 
        document.querySelector('.select__control--menu-is-open')
      );
    });
    
    if (!isOpen) {
      console.log('Failed to open dropdown');
      return null;
    }
    
    // Get available options
    const options = await page.evaluate(() => {
      const optElements = document.querySelectorAll('.select__option');
      return Array.from(optElements).map(opt => opt.textContent?.trim() || '');
    });

    const isMulti = await dropdown.$('.select__value-container--is-multi')
      .then(el => !!el);
    
    // Get the option to select using the provided selector function
    const optionsToSelect = await optionSelector(options, isMulti);
    if (!optionsToSelect.length) {
      console.log('No option selected');
      return null;
    }
    
    // Select the option
    const selected = await page.evaluate((texts: string[]) => {
      const options = document.querySelectorAll('.select__option');
      const selectedTexts: string[] = [];
      
      texts.forEach(text => {
        const option = Array.from(options).find(opt => 
          opt.textContent?.trim() === text
        );
        
        if (option) {
          (option as HTMLElement).click();
          selectedTexts.push(text);
        }
      });
      
      return selectedTexts.length ? selectedTexts : null;
    }, optionsToSelect);
    
    return selected;
  } catch (error) {
    console.error('Error interacting with dropdown:', error);
    return null;
  }
}