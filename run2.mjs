import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({viewport:{width:1440,height:900}});
for (const domain of ['mentable-qa.test','example.com','qa.mentable.co','gmail.com']) {
  const email=`qa.firstrun.${Date.now()}@${domain}`;
  await p.goto('https://mentable.co/signup?role=mentee',{waitUntil:'networkidle'}); await p.waitForTimeout(1500);
  await p.fill('#firstName','Jordan'); await p.fill('#lastName','Reyes');
  await p.fill('input[type="email"]',email); await p.fill('input[type="password"]','QaFirstRun!2026');
  await p.locator('button[type="submit"]').click();
  await p.waitForTimeout(5000);
  const err = await p.evaluate(()=>{
    const cands=[...document.querySelectorAll('p,div,span')].map(e=>e.textContent.trim())
      .filter(t=>t && t.length<200 && /invalid|error|already|unable|failed|confirm|check your|verify/i.test(t));
    return [...new Set(cands)][0]||null;});
  const moved = p.url();
  console.log(domain.padEnd(18), '| url:', moved.replace('https://mentable.co',''), '| msg:', JSON.stringify(err));
  if (!/signup/.test(moved) || (err && /check your|confirm|verify/i.test(err))) { console.log('   >>> USABLE:', email); break; }
}
await b.close();
