import { chromium, devices } from 'playwright';
const D='/private/tmp/claude-501/-Users-abelgessesse/25b64ad0-2074-47af-9793-f5fe3a0e0e49/scratchpad/';
const pass=[],fail=[]; const ok=(c,m)=>(c?pass:fail).push(m);
const b=await chromium.launch();
async function run(opts,label,shot){
  const p=await b.newPage(opts);
  const errs=[]; p.on('console',m=>m.type()==='error'&&errs.push(m.text())); p.on('pageerror',e=>errs.push('ERR '+e.message));
  const ga=[]; p.on('request',r=>{const u=r.url(); if(/google-analytics\.com|analytics\.google\.com|googletagmanager\.com\/g\/collect/.test(u)) ga.push(u);});
  let clicks=0; const t0=Date.now(); const el=()=>((Date.now()-t0)/1000).toFixed(0);
  await p.goto('https://mentable.co/',{waitUntil:'networkidle'}); await p.waitForTimeout(3000);
  ok(await p.evaluate(()=>document.querySelectorAll('script[src*="gtag/js"]').length)===1, `${label}: exactly one GA tag on landing`);
  await p.locator('section[aria-labelledby="hero-heading"] a[href*="role=mentee"]').first().click(); clicks++;
  await p.waitForURL('**/signup*'); await p.waitForTimeout(2500);
  ok(!(await p.textContent('body')).includes('Are you looking for guidance'), `${label}: signup skips the chooser`);
  await p.goto('https://mentable.co/login',{waitUntil:'networkidle'});
  await p.fill('input[type="email"]',process.argv[2]); await p.fill('input[type="password"]','QaPilot!2026');
  await p.locator('button[type="submit"]').click(); clicks++; await p.waitForTimeout(9000);
  ok(!(await p.textContent('body')).includes('Danger zone'), `${label}: no Delete account during onboarding`);
  for(let i=0;i<2;i++){ await p.locator('button:has-text("Continue")').click(); clicks++; await p.waitForTimeout(1300); }
  await p.locator('button:has-text("Investment Banking")').first().click(); clicks++; await p.waitForTimeout(300);
  await p.locator('button:has-text("Complete Profile")').click(); clicks++; await p.waitForTimeout(7000);
  const dash=await p.evaluate(()=>document.body.innerText);
  ok(!/Complete your profile/.test(dash), `${label}: dashboard does not re-ask for the profile`);
  ok(!/Upcoming Sessions|Recent Messages/.test(dash), `${label}: empty session/message cards hidden pre-request`);
  if(shot) await p.screenshot({path:D+'m-p-dash.png',fullPage:true});
  await p.goto('https://mentable.co/discover',{waitUntil:'networkidle'}); clicks++; await p.waitForTimeout(4500);
  if(shot) await p.screenshot({path:D+'m-p-discover.png',fullPage:true});
  const disc=await p.evaluate(()=>document.body.innerText);
  for(const fake of ['Sarah Chen','Marcus Johnson','Priya Sharma','Alex Rivera','David Park'])
    ok(!disc.includes(fake), `${label}: fixture "${fake}" not shown`);
  ok(disc.includes('No mentors have joined yet'), `${label}: pilot roster explained honestly`);
  for(const real of ['Christopher Floyd','Peter Keane','Travis Melvin'])
    ok(disc.includes(real), `${label}: real invited mentor "${real}" present`);
  ok(disc.includes('Not yet on Mentable'), `${label}: invited mentors marked non-requestable`);
  ok(!/Request\b/.test(disc.replace(/Requests/g,'')), `${label}: no Request button for anyone`);
  ok(!/Unknown|Name unavailable|Former member/.test(disc), `${label}: no broken identities`);
  ok(await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)<=1, `${label}: no overflow`);
  // fixture profile unreachable by URL
  await p.goto('https://mentable.co/mentor/c1054ef9-7fb0-483d-b716-6676a6ead6b3',{waitUntil:'networkidle'}); await p.waitForTimeout(4000);
  ok(/discover/.test(p.url()), `${label}: fixture profile URL redirects to Discover (${p.url().split('.co')[1]})`);
  const real2=errs.filter(e=>!/favicon|404|Download the React/i.test(e));
  ok(real2.length===0, `${label}: no console errors`+(real2.length?' — '+real2[0].slice(0,70):''));
  // GA payload PII check
  const joined=ga.join('\n');
  ok(!/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(joined), `${label}: no UUID in GA payloads`);
  ok(!/%40|@/.test(joined.replace(/https?:\/\/[^\s]*?\//g,'')), `${label}: no email in GA payloads`);
  const evs=[...joined.matchAll(/[?&]en=([a-z_]+)/g)].map(m=>m[1]);
  console.log(`${label}: ${clicks} clicks, +${el()}s | GA events: ${[...new Set(evs)].join(', ')||'(none captured)'}`);
  await p.close();
}
await run({...devices['iPhone 13']},'mobile',true);
console.log('PASS ('+pass.length+')'); pass.forEach(x=>console.log('  ✓ '+x));
if(fail.length){console.log('FAIL ('+fail.length+')'); fail.forEach(x=>console.log('  ✗ '+x));}
await b.close();
