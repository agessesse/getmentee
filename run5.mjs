import { chromium } from 'playwright';
const D='/private/tmp/claude-501/-Users-abelgessesse/25b64ad0-2074-47af-9793-f5fe3a0e0e49/scratchpad/';
const EMAIL=process.argv[2];
const b = await chromium.launch();
const p = await b.newPage({viewport:{width:1440,height:900}});
let clicks=0; const t0=Date.now();
const el=()=>((Date.now()-t0)/1000).toFixed(0);
await p.goto('https://mentable.co/login',{waitUntil:'networkidle'});
await p.fill('input[type="email"]',EMAIL); await p.fill('input[type="password"]','QaFirstRun!2026');
await p.locator('button[type="submit"]').click(); clicks++; await p.waitForTimeout(9000);
await p.locator('button:has-text("Continue")').click(); clicks++; await p.waitForTimeout(1500);
await p.locator('button:has-text("Continue")').click(); clicks++; await p.waitForTimeout(1500);
// step 3: pick interests
for (const t of ['Investment Banking','Private Equity']) { await p.locator(`button:has-text("${t}")`).first().click(); clicks++; await p.waitForTimeout(250); }
const finalBtns = await p.evaluate(()=>[...document.querySelectorAll('button')].map(b=>b.textContent.trim()).filter(t=>/finish|complete|done|save|continue|start/i.test(t)));
console.log('finish buttons:', finalBtns);
await p.locator('button').filter({hasText:/Finish|Complete|Done|Save|Start/i}).first().click(); clicks++;
await p.waitForTimeout(7000);
console.log(`\n[+${el()}s, ${clicks} clicks] AFTER PROFILE COMPLETE → ${p.url().replace('https://mentable.co','')}`);
await p.screenshot({path:D+'fr-dash.png', fullPage:true});
const txt = await p.evaluate(()=>document.body.innerText.replace(/\n{2,}/g,'\n').slice(0,1400));
console.log('─── screen text ───\n'+txt);
await b.close();
