import { chromium } from 'playwright';
const D='/private/tmp/claude-501/-Users-abelgessesse/25b64ad0-2074-47af-9793-f5fe3a0e0e49/scratchpad/';
const EMAIL=process.argv[2], PW='QaFirstRun!2026';
const b = await chromium.launch();
const p = await b.newPage({viewport:{width:1440,height:900}});
const errs=[]; p.on('console',m=>m.type()==='error'&&errs.push(m.text())); p.on('pageerror',e=>errs.push('pageerror: '+e.message));
let step=0; const t0=Date.now();
const mark = async (what)=>{ step++;
  console.log(`\n[${String(step).padStart(2)}] +${((Date.now()-t0)/1000).toFixed(1)}s  ${what}  →  ${p.url().replace('https://mentable.co','')}`);
  const h=await p.evaluate(()=>[...document.querySelectorAll('h1,h2,h3')].map(x=>x.tagName+':'+x.textContent.replace(/\s+/g,' ').trim().slice(0,54)).slice(0,8));
  console.log('     headings: '+(h.join(' | ')||'(none)'));
  const a=await p.evaluate(()=>[...new Set([...document.querySelectorAll('a,button')].map(x=>x.textContent.replace(/\s+/g,' ').trim()).filter(t=>t&&t.length<40))]);
  console.log('     actions: '+a.slice(0,16).join(' · '));
  const f=await p.evaluate(()=>[...document.querySelectorAll('input,select,textarea')].map(i=>(i.labels?.[0]?.textContent?.trim()||i.name||i.id||i.placeholder||i.type)+(i.required?'*':'')));
  if(f.length) console.log('     fields: '+f.join(' · '));
  const bad=await p.evaluate(()=>{const t=document.body.innerText; return ['Unknown','Name unavailable','Former member','undefined','NaN','null'].filter(x=>t.includes(x));});
  if(bad.length) console.log('     ⚠ BAD IDENTITY STRINGS: '+bad.join(', '));
  await p.screenshot({path:`${D}fr-${String(step).padStart(2,'0')}.png`, fullPage:true});
};

await p.goto('https://mentable.co/login',{waitUntil:'networkidle'}); await p.waitForTimeout(1500);
await mark('LOGIN (where signup drops you)');
await p.fill('input[type="email"]',EMAIL); await p.fill('input[type="password"]',PW);
await p.locator('button[type="submit"]').click();
await p.waitForTimeout(9000);
await mark('FIRST SCREEN AFTER LOGIN');
// follow whatever it wants
for (let i=0;i<4;i++){
  const cur=p.url();
  await p.waitForTimeout(2500);
  if (p.url()!==cur) await mark('auto-navigated');
}
await mark('SETTLED');
console.log('\nconsole errors:', [...new Set(errs.filter(e=>!/favicon|404/.test(e)))].slice(0,4));
await b.close();
