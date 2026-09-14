import { chromium } from 'playwright';
const D='/private/tmp/claude-501/-Users-abelgessesse/25b64ad0-2074-47af-9793-f5fe3a0e0e49/scratchpad/';
const b = await chromium.launch();
const p = await b.newPage({viewport:{width:1440,height:900}});
let clicks=0; const t0=Date.now(); const el=()=>((Date.now()-t0)/1000).toFixed(0);
await p.goto('https://mentable.co/login',{waitUntil:'networkidle'});
await p.fill('input[type="email"]',process.argv[2]); await p.fill('input[type="password"]','QaFirstRun!2026');
await p.locator('button[type="submit"]').click(); clicks++; await p.waitForTimeout(9000);
await p.locator('button:has-text("Continue")').click(); clicks++; await p.waitForTimeout(1400);
await p.locator('button:has-text("Continue")').click(); clicks++; await p.waitForTimeout(1400);
// last card's submit button, at the very bottom
const all = await p.evaluate(()=>[...document.querySelectorAll('button')].map((b,i)=>({i,t:b.textContent.replace(/\s+/g,' ').trim(),y:Math.round(b.getBoundingClientRect().top+window.scrollY),type:b.type})));
console.log('bottom-most buttons:', all.sort((a,b)=>b.y-a.y).slice(0,6).map(x=>`"${x.t}"@${x.y}(${x.type})`).join(' | '));
const sub = p.locator('button[type="submit"]');
console.log('submit buttons:', await sub.count(), await sub.allTextContents());
// required fields on step 3
console.log('step3 fields:', await p.evaluate(()=>[...document.querySelectorAll('input,textarea,select')].map(i=>(i.labels?.[0]?.textContent?.trim()||i.placeholder||i.name)+(i.required?'*':''))));
await p.locator("button:has-text(\"Complete Profile\")").click(); clicks++;
await p.waitForTimeout(8000);
console.log(`\n[+${el()}s, ${clicks} clicks] LANDED → ${p.url().replace('https://mentable.co','')}`);
await p.screenshot({path:D+'fr-dash.png', fullPage:true});
console.log('─── text ───\n'+(await p.evaluate(()=>document.body.innerText)).replace(/\n{2,}/g,'\n').slice(0,1200));
await b.close();
