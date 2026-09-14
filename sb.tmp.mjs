import { readFileSync } from 'node:fs';
const env=Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(l=>l.includes('=')&&!l.trim().startsWith('#')).map(l=>{const i=l.indexOf('=');return[l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^["']|["']$/g,'')];}));
const ref = env.NEXT_PUBLIC_SUPABASE_URL.match(/https:\/\/([a-z0-9]+)\./)[1];
console.log('project ref:', ref);
// Settings endpoint is public and shows what the client is told about auth
const r = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {headers:{apikey:env.NEXT_PUBLIC_SUPABASE_ANON_KEY}});
const j = await r.json();
console.log('\n── auth settings (public endpoint) ──');
console.log('  email signup enabled :', j.external?.email);
console.log('  autoconfirm (no email required):', j.mailer_autoconfirm);
console.log('  phone autoconfirm    :', j.phone_autoconfirm);
console.log('  signup disabled      :', j.disable_signup);
console.log('  providers enabled    :', Object.entries(j.external||{}).filter(([,v])=>v).map(([k])=>k).join(', '));
