import { chromium } from 'playwright';

const BASE = 'http://localhost:3001';
const VIEWPORT = { width: 390, height: 844 }; // iPhone 14

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: VIEWPORT });
const page    = await context.newPage();

const views = [
  { hash: '#dashboard', file: '/tmp/forge-1-dashboard.png' },
  { hash: '#log',       file: '/tmp/forge-2-log.png'       },
];

for (const { hash, file } of views) {
  await page.goto(`${BASE}/${hash}`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  await page.screenshot({ path: file });
  console.log(`Screenshot saved: ${file}`);
}

await browser.close();
