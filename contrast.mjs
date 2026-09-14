import { chromium } from 'playwright';
const b=await chromium.launch();
const p=await b.newPage({viewport:{width:1440,height:900}});
await p.goto('https://mentable.co/login',{waitUntil:'networkidle'});
await p.fill('input[type="email"]',process.argv[2]); await p.fill('input[type="password"]','QaPilot!2026');
await p.locator('button[type="submit"]').click(); await p.waitForTimeout(8000);
const lum=c=>{const s=c.map(v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);});return .2126*s[0]+.7152*s[1]+.0722*s[2];};
const parse=s=>(s.match(/[\d.]+/g)||[]).slice(0,3).map(Number);
const fails=[];
for (const route of ['/dashboard','/discover','/requests','/goals']) {
  await p.goto('https://mentable.co'+route,{waitUntil:'networkidle'}); await p.waitForTimeout(3500);
  const items=await p.evaluate(()=>{
    const bg=el=>{let e=el;while(e){const c=getComputedStyle(e).backgroundColor;if(c&&!/rgba\(0, 0, 0, 0\)|transparent/.test(c))return c;e=e.parentElement;}return 'rgb(255,255,255)';};
    const out=[];
    document.querySelectorAll('p,span,a,button,h1,h2,h3,li,div').forEach(e=>{
      if(e.children.length)return; const t=(e.textContent||'').trim(); if(!t)return;
      const cs=getComputedStyle(e); if(cs.visibility==='hidden'||cs.display==='none'||+cs.opacity<0.5)return;
      const r=e.getBoundingClientRect(); if(!r.width||!r.height)return;
      out.push({t:t.slice(0,32),fg:cs.color,bg:bg(e),size:parseFloat(cs.fontSize),w:cs.fontWeight});
    }); return out;});
  for(const i of items){
    const a=lum(parse(i.fg)),bl=lum(parse(i.bg));
    const ratio=(Math.max(a,bl)+0.05)/(Math.min(a,bl)+0.05);
    const large=i.size>=24||(i.size>=18.66&&+i.w>=700);
    const need=large?3:4.5;
    if(ratio<need) fails.push(`${route}  ${ratio.toFixed(2)}:1 (need ${need}) ${i.size}px "${i.t}" ${i.fg} on ${i.bg}`);
  }
}
console.log('contrast failures:', fails.length);
[...new Set(fails)].slice(0,12).forEach(f=>console.log('  ✗',f));
await b.close();
