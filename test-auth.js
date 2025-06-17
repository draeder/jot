// Simple test script to verify authentication flow
const puppeteer = require('puppeteer');

async function testAuth() {
  try {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    // Navigate to the app
    await page.goto('http://localhost:3000');
    
    // Should redirect to sign-in page
    await page.waitForSelector('input[placeholder="Enter your name"]');
    
    // Fill in the name
    await page.type('input[placeholder="Enter your name"]', 'Test User');
    
    // Click sign in
    await page.click('button[type="submit"]');
    
    // Wait for redirect back to dashboard
    await page.waitForSelector('h1', { timeout: 10000 });
    
    const title = await page.$eval('h1', el => el.textContent);
    console.log('Success! App title:', title);
    
    await browser.close();
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAuth();
