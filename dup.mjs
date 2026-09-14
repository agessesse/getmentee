import { chromium } from 'playwright';
const b=await chromium.launch();
const p=await b.newPage({viewport:{width:1440,height:900}});
const ev=[]; p.on('request',r=>{const u=r.url(); if(/google-analytics|googletagmanager\.com\/g\/collect/.test(u)){
  const sp=new URL(u).searchParams; ev.push({en:sp.get('en'),dl:sp.get('dl')});}});
await p.goto('https://mentable.co/login',{waitUntil:'networkidle'});
await p.fill('input[type="email"]',process.argv[2]); await p.fill('input[type="password"]','QaPilot!2026');
await p.locator('button[type="submit"]').click(); await p.waitForTimeout(8000);
await p.goto('https://mentable.co/discover',{waitUntil:'networkidle'}); await p.waitForTimeout(5000);
const pv=ev.filter(e=>e.en==='page_view');
console.log('page_view hits:', pv.length);
pv.forEach(e=>console.log('   ', e.dl));
console.log('all events:', [...new Set(ev.map(e=>e.en))].join(', '));
await b.close();
