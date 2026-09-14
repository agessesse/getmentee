import { chromium } from 'playwright';
const b=await chromium.launch();
const p=await b.newPage({viewport:{width:1440,height:900}});
const bad=[]; p.on('response',r=>{ if(r.status()>=400) bad.push(r.status()+' '+r.url().slice(0,130)); });
await p.goto('https://mentable.co/login',{waitUntil:'networkidle'});
await p.fill('input[type="email"]',process.argv[2]); await p.fill('input[type="password"]','QaFirstRun!2026');
await p.locator('button[type="submit"]').click(); await p.waitForTimeout(9000);
await p.goto('https://mentable.co/discover',{waitUntil:'networkidle'}); await p.waitForTimeout(5000);
await p.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=700){window.scrollBy(0,700);await new Promise(r=>setTimeout(r,80));}});
await p.waitForTimeout(1500);
const t=await p.evaluate(()=>document.body.innerText);
console.log('header:', t.split('\n').slice(0,6).join(' | '));
console.log('has "Invited mentors":', /Invited mentors/.test(t));
for (const n of ['Christopher Floyd','Peter Keane','Travis Melvin','David Sheffer','Drew Nations','Zach Smith'])
  console.log('  ', n, /\b/.test(n) && t.includes(n) ? 'PRESENT' : 'absent');
console.log('\nfailed requests:', [...new Set(bad)].slice(0,6));
await b.close();
