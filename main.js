const { chromium } = require('playwright');

let url = 'https://family.e-klase.lv/';

(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto(url);

    // 3. YOUR TASK: Add the fill and click functions here
    await page.fill('#username', '130509-22584');
    await page.fill('#password', 'j52*dazu');
    await page.click('#login-button');

    page.on('response', async (response) => {
    const url = response.url();

    // Check if the URL contains 'diary' or 'summary'
    if (url.includes('diary?from=')) {
        console.log(`>> Intercepted: ${url}`);
        
        try {
        // This is how you grab the actual JSON object
        const data = await response.json(); 
        console.log(data); // This prints the raw data to your terminal
        } catch (e) {
        // Sometimes responses aren't JSON, this prevents the bot from crashing
        }
    }
    });

  // Keep it open for 10 seconds so you can inspect things
    await new Promise(r => setTimeout(r, 100000));
    await browser.close();


})();