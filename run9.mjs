import { chromium } from 'playwright';
const D='/private/tmp/claude-501/-Users-abelgessesse/25b64ad0-2074-47af-9793-f5fe3a0e0e49/scratchpad/';
const b = await chromium.launch();
const p = await b.newPage({viewport:{width:1440,height:900}});
await p.goto('https://mentable.co/login',{waitUntil:'networkidle'});
await p.fill('input[type="email"]',process.argv[2]); await p.fill('input[type="password"]','QaFirstRun!2026');
await p.locator('button[type="submit"]').click(); await p.waitForTimeout(9000);
await p.goto('https://mentable.co/discover',{waitUntil:'networkidle'}); await p.waitForTimeout(3500);
// match scores across all cards
const matches = await p.evaluate(()=>[...document.body.innerText.matchAll(/(\d+)% match/g)].map(m=>m[1]));
console.log('match scores on Discover:', [...new Set(matches)], '| count:', matches.length);
await p.locator('a:has-text("View profile")').first().click(); await p.waitForTimeout(3500);
const btn = p.getByRole('button',{name:/Request Mentorship/i}).first();
console.log('found Request Mentorship button:', await btn.count());
await btn.click(); await p.waitForTimeout(2500);
const dlg = p.locator('[role="dialog"]');
console.log('modal:', await dlg.count(), '| url:', p.url().replace('https://mentable.co',''));
const scope = await dlg.count() ? dlg : p.locator('main');
await p.screenshot({path:D+'fr-request.png', fullPage:true});
console.log('fields:', await p.evaluate(()=>{
  const root=document.querySelector('[role="dialog"]')||document.querySelector('main');
  return [...root.querySelectorAll('input,textarea,select')].map(i=>({l:i.labels?.[0]?.textContent?.trim()||i.name||i.id||'(no label)', ph:(i.placeholder||'').slice(0,90), req:i.required, max:i.maxLength>0?i.maxLength:null, min:i.minLength>0?i.minLength:null}));}));
console.log('copy:', (await scope.innerText()).replace(/\n{2,}/g,' | ').slice(0,700));
console.log('buttons:', await p.evaluate(()=>{const r=document.querySelector('[role="dialog"]')||document.querySelector('main'); return [...r.querySelectorAll('button')].map(b=>b.textContent.trim());}));
await b.close();
