// Simple test to trigger schedule generation directly
import { test, expect } from '@playwright/test';

test('test schedule generation', async ({ page }) => {
  await page.goto('http://localhost:8080');
  
  // Wait for the page to load
  await page.waitForLoadState('networkidle');
  
  // Check if the generate button exists
  const generateButton = page.locator('button:has-text("Generera schema")');
  await expect(generateButton).toBeVisible();
  
  // Check if button is enabled
  const isDisabled = await generateButton.isDisabled();
  console.log('Button disabled:', isDisabled);
  
  if (!isDisabled) {
    // Click the button
    await generateButton.click();
    
    // Wait for some response
    await page.waitForTimeout(5000);
  }
  
  // Check console for any output
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
});
