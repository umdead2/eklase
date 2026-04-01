const { chromium } = require('playwright');
const fs = require('fs');

const diaryFilePath = 'saved_data/diary_data.json';
const testsFilePath = 'saved_data/tests.json';
const summaryFilePath = 'saved_data/summary.json';
const newsFilePath = 'saved_data/news.json';

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    let authHeaders = null;

    page.on('request', request => {
        const url = request.url();
        if (url.includes('api/diary') || url.includes('api/news') || url.includes('/api/test-schedules')) {
            authHeaders = request.headers();
        }
    });

    await page.goto('https://family.e-klase.lv/');
    await page.fill('#username', '130509-22584');
    await page.fill('#password', 'j52*dazu');
    await page.click('#login-button');

    await page.waitForURL(/\/home/i, { waitUntil: 'networkidle' });
    if (authHeaders) {
    const data = await page.evaluate(async (h) => {
        const [dRes, tRes, sRes, nRes] = await Promise.all([
            fetch('/api/diary?from=2026-04-01&to=2026-04-07', { headers: h }),
            fetch('/api/test-schedules', { headers: h }),
            fetch('api/evaluations/summary', { headers: h }),
            fetch('api/news', { headers: h })
        ]);
        
        return {
            diary: dRes.ok ? await dRes.json() : null,
            tests: tRes.ok ? await tRes.json() : null,
            summary: sRes.ok ? await sRes.json() : null,
            news: nRes.ok ? await nRes.json() : null
        };
    }, authHeaders);

    console.log("--- DIENASGRĀMATA ---");
    fs.writeFile(diaryFilePath, JSON.stringify(data.diary, null, 4), 'utf8', () => {
        console.log(`Data written to ${diaryFilePath} as JSON.`);
    });

    console.log("\n--- KONTROLDARBI ---");
    fs.writeFile(testsFilePath, JSON.stringify(data.tests, null, 4), 'utf8', () => {
        console.log(`Data written to ${testsFilePath} as JSON.`);
    });

    console.log("\n--- Summary ---");
    fs.writeFile(summaryFilePath, JSON.stringify(data.summary, null, 4), 'utf8', () => {
        console.log(`Data written to ${summaryFilePath} as JSON.`);
    });

    console.log("\n--- News ---");
    fs.writeFile(newsFilePath, JSON.stringify(data.news, null, 4), 'utf8', () => {
        console.log(`Data written to ${newsFilePath} as JSON.`);
    });
}

    await browser.close();
})();