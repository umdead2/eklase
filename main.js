const { chromium } = require('playwright');
const fs = require('fs');

// Failu ceļi datu saglabāšanai
const diaryFilePath = 'saved_data/diary_data.json';
const testsFilePath = 'saved_data/tests.json';
const summaryFilePath = 'saved_data/summary.json';
const newsFilePath = 'saved_data/news.json';
const evalNewsFilePath = 'saved_data/evalNews.json';

const username = '130509-22584';
const password = 'j52*dazu';
// Izveidojam mapi, ja tās nav
if (!fs.existsSync('saved_data')) fs.mkdirSync('saved_data');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    let authHeaders = null;

    // "Noķeram" autorizācijas datus no pārlūka pieprasījumiem
    page.on('request', request => {
        const url = request.url();
        if (url.includes('api/')) {
            authHeaders = request.headers();
        }
    });

    // Atveram E-klasi un ielogojamies
    await page.goto('https://family.e-klase.lv/');

    await page.fill('#username', username);
    await page.fill('#password', password);

    await page.click('#login-button');

    // Pagaidām, līdz ielādējas galvenais ekrāns
    await page.waitForURL(/\/home/i, { waitUntil: 'networkidle' });

    // Aprēķinām mācību gada sākuma un beigu datumus
    const now = new Date();
    const currentYear = now.getFullYear();
    const isSecondSemester = (now.getMonth() + 1) < 9; 
    const sameclass = false;

    const fromDate = isSecondSemester ? `${currentYear - 1}-09-01` : `${currentYear}-09-01`;
    const toDate = isSecondSemester ? `${currentYear}-8-31` : `${currentYear + 1}-08-31`;

    if (authHeaders) {
        // Izpildām API pieprasījumus tieši no pārlūka vides
        const data = await page.evaluate(async ({ h, from, to }) => {
            const [dRes, tRes, sRes, nRes, enRes] = await Promise.all([
                fetch(`/api/diary?from=${from}&to=${to}`, { headers: h }),
                fetch('/api/test-schedules', { headers: h }),
                fetch('/api/evaluations/summary', { headers: h }),
                fetch('/api/news', { headers: h }),
                fetch(`/api/evaluation-ratings?includeSameLevelClasses=${sameclass}&datePeriodModel.from=${from}&datePeriodModel.to=${to}`, { headers: h }),
            ]);      
            
            return {
                diary: dRes.ok ? await dRes.json() : null,
                tests: tRes.ok ? await tRes.json() : null,
                summary: sRes.ok ? await sRes.json() : null,
                news: nRes.ok ? await nRes.json() : null,
                evalNews: enRes.ok ? await enRes.json() : null
            };
        }, { h: authHeaders, from: fromDate, to: toDate });

        // Saglabājam iegūtos datus JSON failos
        if (data.diary) fs.writeFileSync(diaryFilePath, JSON.stringify(data.diary, null, 4));
        if (data.tests) fs.writeFileSync(testsFilePath, JSON.stringify(data.tests, null, 4));
        if (data.summary) fs.writeFileSync(summaryFilePath, JSON.stringify(data.summary, null, 4));
        if (data.news) fs.writeFileSync(newsFilePath, JSON.stringify(data.news, null, 4));
        if (data.evalNews) fs.writeFileSync(evalNewsFilePath, JSON.stringify(data.evalNews, null, 4));
    }

    await browser.close();
})();