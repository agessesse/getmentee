import { chromium } from 'playwright';
const b=await chromium.launch();
const p=await b.newPage({viewport:{width:1440,height:900}});
const hits=[];
p.on('request',r=>{const u=r.url(); if(/google-analytics|googletagmanager\.com\/g\/collect/.test(u)){
  const m=u.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  if(m){const params=new URL(u).searchParams; hits.push({event:params.get('en'),dl:params.get('dl'),dp:params.get('dp'),uuid:m[0]});}}});
await p.goto('https://mentable.co/login',{waitUntil:'networkidle'});
await p.fill('input[type="email"]',process.argv[2]); await p.fill('input[type="password"]','QaPilot!2026');
await p.locator('button[type="submit"]').click(); await p.waitForTimeout(8000);
await p.goto('https://mentable.co/mentor/c1054ef9-7fb0-483d-b716-6676a6ead6b3',{waitUntil:'networkidle'}); await p.waitForTimeout(5000);
console.log('GA hits containing a UUID:', hits.length);
hits.slice(0,3).forEach(h=>console.log('  event='+h.event,'\n    dl='+h.dl,'\n    dp='+h.dp));
await b.close();
