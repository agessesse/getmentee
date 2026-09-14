import { chromium, devices } from 'playwright';
const D='/private/tmp/claude-501/-Users-abelgessesse/25b64ad0-2074-47af-9793-f5fe3a0e0e49/scratchpad/';
const pass=[],fail=[]; const ok=(c,m)=>(c?pass:fail).push(m);
const b=await chromium.launch();
async function journey(opts,label,shot){
  const p=await b.newPage(opts);
  const errs=[]; p.on('console',m=>m.type()==='error'&&errs.push(m.text())); p.on('pageerror',e=>errs.push('ERR '+e.message));
  await p.goto('https://mentable.co/login',{waitUntil:'networkidle'});
  ok(!(await p.textContent('body')).includes('Demo1234'), `${label}: no demo credentials on login`);
  await p.fill('input[type="email"]',process.argv[2]); await p.fill('input[type="password"]','QaFirstRun!2026');
  await p.locator('button[type="submit"]').click(); await p.waitForTimeout(9000);
  // dashboard
  await p.goto('https://mentable.co/dashboard',{waitUntil:'networkidle'}); await p.waitForTimeout(5000);
  const dash=await p.evaluate(()=>document.body.innerText);
  ok(!/Complete your profile/.test(dash), `${label}: dashboard no longer asks for a finished profile`);
  // discover
  await p.goto('https://mentable.co/discover',{waitUntil:'networkidle'}); await p.waitForTimeout(4500);
  if(shot) await p.screenshot({path:D+'after-discover.png',fullPage:true});
  const disc=await p.evaluate(()=>document.body.innerText);
  ok(!/% match/.test(disc), `${label}: no empty percentage badge (was "10% match" on all 30)`);
  ok(!/\d\.\d \(\d+\)/.test(disc), `${label}: no unsupported star ratings on cards`);
  ok(/Invited mentors/.test(disc), `${label}: real invited mentors present in Discover`);
  ok(!/Unknown|Name unavailable|Former member/.test(disc), `${label}: no broken identities`);
  const over=await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  ok(over<=1, `${label}: Discover no horizontal overflow (${over}px)`);
  // mentor profile
  await p.locator('a:has-text("View profile")').nth(5).click(); await p.waitForTimeout(4000);
  if(shot) await p.screenshot({path:D+'after-profile.png',fullPage:true});
  const prof=await p.evaluate(()=>document.body.innerText);
  ok(/No reviews yet/.test(prof) && !/Reviews\(\d+\)/.test(prof) && !/\b4\.\d\b/.test(prof), `${label}: profile states "No reviews yet" and claims no count`);
  // request
  await p.getByRole('button',{name:/Request Mentorship/i}).first().click(); await p.waitForTimeout(2200);
  const send=p.getByRole('button',{name:/Send Request/i});
  ok(await send.isDisabled(), `${label}: empty request cannot be sent`);
  const ta=p.locator('#request-why');
  ok(await ta.count()===1, `${label}: request field has a programmatic label`);
  await ta.fill('I saw your background in M&A and I am trying to understand what the analyst years actually look like before I commit.');
  await p.waitForTimeout(600);
  ok(!(await send.isDisabled()), `${label}: a specific request can be sent`);
  if(shot) await p.screenshot({path:D+'after-request.png'});
  await send.click(); await p.waitForTimeout(5000);
  const after=await p.evaluate(()=>document.body.innerText);
  ok(/pending|sent|request/i.test(after), `${label}: submission gives feedback`);
  if(shot) await p.screenshot({path:D+'after-sent.png',fullPage:true});
  const real=errs.filter(e=>!/favicon|404|Download the React/i.test(e));
  ok(real.length===0, `${label}: no console errors`+(real.length?' — '+real[0].slice(0,60):''));
  await p.close();
}
await journey({viewport:{width:1440,height:900}},'desktop',true);
await journey({...devices['iPhone 13']},'mobile',false);
// /people while authenticated
const p2=await b.newPage({viewport:{width:1440,height:900}});
await p2.goto('https://mentable.co/login',{waitUntil:'networkidle'});
await p2.fill('input[type="email"]',process.argv[2]); await p2.fill('input[type="password"]','QaFirstRun!2026');
await p2.locator('button[type="submit"]').click(); await p2.waitForTimeout(9000);
await p2.goto('https://mentable.co/people/christopher-floyd',{waitUntil:'networkidle'}); await p2.waitForTimeout(3000);
ok(/Christopher Floyd/.test(await p2.evaluate(()=>document.body.innerText)) && !/login/.test(p2.url()), 'authenticated user can still read /people/<slug>');
await b.close();
console.log('PASS ('+pass.length+')'); pass.forEach(x=>console.log('  ✓ '+x));
if(fail.length){console.log('FAIL ('+fail.length+')'); fail.forEach(x=>console.log('  ✗ '+x));}
