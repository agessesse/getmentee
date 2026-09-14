import { chromium, devices } from 'playwright';
const b=await chromium.launch();
const p=await b.newPage({...devices['iPhone 13']});
const msgs=[]; p.on('console',m=>{if(m.type()==='error')msgs.push(m.text()+' @ '+(m.location().url||'').slice(0,90));});
const bad=[]; p.on('response',r=>{if(r.status()>=400)bad.push(r.status()+' '+r.request().method()+' '+r.url().slice(0,140));});
await p.goto('https://mentable.co/login',{waitUntil:'networkidle'});
await p.fill('input[type="email"]',process.argv[2]); await p.fill('input[type="password"]','QaFirstRun!2026');
await p.locator('button[type="submit"]').click(); await p.waitForTimeout(9000);
for (let i=0;i<2;i++){ await p.locator('button:has-text("Continue")').click(); await p.waitForTimeout(1400); }
await p.locator('button:has-text("Investment Banking")').first().click(); await p.waitForTimeout(300);
await p.locator('button:has-text("Complete Profile")').click(); await p.waitForTimeout(7000);
console.log('console errors:'); [...new Set(msgs)].forEach(m=>console.log('  •',m));
console.log('failed responses:'); [...new Set(bad)].forEach(m=>console.log('  •',m));
await b.close();
