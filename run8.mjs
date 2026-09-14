import { chromium } from 'playwright';
const D='/private/tmp/claude-501/-Users-abelgessesse/25b64ad0-2074-47af-9793-f5fe3a0e0e49/scratchpad/';
const b = await chromium.launch();
const p = await b.newPage({viewport:{width:1440,height:900}});
const errs=[]; p.on('console',m=>m.type()==='error'&&errs.push(m.text())); p.on('pageerror',e=>errs.push('ERR '+e.message));
await p.goto('https://mentable.co/login',{waitUntil:'networkidle'});
await p.fill('input[type="email"]',process.argv[2]); await p.fill('input[type="password"]','QaFirstRun!2026');
await p.locator('button[type="submit"]').click(); await p.waitForTimeout(9000);
await p.goto('https://mentable.co/discover',{waitUntil:'networkidle'}); await p.waitForTimeout(3500);

// mentor profile
await p.locator('a:has-text("View profile")').first().click(); await p.waitForTimeout(4000);
console.log('── MENTOR PROFILE ──', p.url().replace('https://mentable.co',''));
await p.screenshot({path:D+'fr-profile.png', fullPage:true});
console.log('headings:', await p.evaluate(()=>[...document.querySelectorAll('h1,h2,h3')].map(x=>x.tagName+':'+x.textContent.trim().slice(0,44))));
console.log('sections order:', (await p.evaluate(()=>document.body.innerText)).replace(/\n{2,}/g,' | ').slice(0,700));

// request flow
const reqBtn = p.locator('button:has-text("Request"), a:has-text("Request")').first();
console.log('\nrequest CTA:', await reqBtn.count()? (await reqBtn.textContent()).trim() : 'NONE FOUND');
await reqBtn.click(); await p.waitForTimeout(2500);
await p.screenshot({path:D+'fr-request.png', fullPage:true});
console.log('── REQUEST ──', p.url().replace('https://mentable.co',''));
console.log('dialog?', await p.locator('[role="dialog"]').count());
const scope = await p.locator('[role="dialog"]').count() ? '[role="dialog"]' : 'body';
console.log('fields:', await p.evaluate(s=>[...document.querySelectorAll(s+' input,'+s+' textarea,'+s+' select')].map(i=>({label:i.labels?.[0]?.textContent?.trim()||i.name||i.id, ph:(i.placeholder||'').slice(0,80), req:i.required, max:i.maxLength>0?i.maxLength:null})), scope));
console.log('text:', (await p.textContent(scope)).replace(/\s+/g,' ').trim().slice(0,600));
console.log('\nerrors:', [...new Set(errs.filter(e=>!/favicon/.test(e)))].slice(0,3));
await b.close();
