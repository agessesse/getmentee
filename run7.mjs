import { chromium } from 'playwright';
const D='/private/tmp/claude-501/-Users-abelgessesse/25b64ad0-2074-47af-9793-f5fe3a0e0e49/scratchpad/';
const b = await chromium.launch();
const p = await b.newPage({viewport:{width:1440,height:900}});
const errs=[]; p.on('console',m=>m.type()==='error'&&errs.push(m.text())); p.on('pageerror',e=>errs.push('ERR '+e.message));
await p.goto('https://mentable.co/login',{waitUntil:'networkidle'});
await p.fill('input[type="email"]',process.argv[2]); await p.fill('input[type="password"]','QaFirstRun!2026');
await p.locator('button[type="submit"]').click(); await p.waitForTimeout(9000);
await p.goto('https://mentable.co/discover',{waitUntil:'networkidle'}); await p.waitForTimeout(4000);
await p.screenshot({path:D+'fr-discover.png', fullPage:true});
console.log('── DISCOVER ──', p.url().replace('https://mentable.co',''));
console.log('controls:', await p.evaluate(()=>[...document.querySelectorAll('input,select')].map(i=>i.type+':'+(i.placeholder||i.name||''))));
console.log('filters:', await p.evaluate(()=>[...new Set([...document.querySelectorAll('button')].map(b=>b.textContent.replace(/\s+/g,' ').trim()).filter(t=>t&&t.length<28))].slice(0,22)));
const cards = await p.evaluate(()=>{
  const links=[...document.querySelectorAll('a[href^="/mentor/"]')];
  return {n:links.length, sample:links.slice(0,4).map(a=>a.innerText.replace(/\n+/g,' | ').slice(0,150))};
});
console.log('mentor cards:', cards.n);
cards.sample.forEach(s=>console.log('   • '+s));
console.log('bad strings:', await p.evaluate(()=>['Unknown','Name unavailable','Former member','undefined'].filter(x=>document.body.innerText.includes(x))));
// landing-page mentors present?
const names = await p.evaluate(()=>[...document.querySelectorAll('a[href^="/mentor/"]')].map(a=>a.innerText.split('\n')[0].trim()));
console.log('names on discover:', names.join(' · '));
for (const n of ['Christopher Floyd','Peter Keane','Tiffany Lakey','Frank L. Van Buren','Will Alston','Travis Melvin']) {
  console.log('   landing mentor "'+n+'" in Discover:', names.some(x=>x.includes(n.split(' ')[0])&&x.includes(n.split(' ').pop()))?'YES':'no');
}
console.log('\nerrors:', [...new Set(errs.filter(e=>!/favicon/.test(e)))].slice(0,3));
await b.close();
