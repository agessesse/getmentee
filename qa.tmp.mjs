import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n')
  .filter(l=>l.includes('=')&&!l.trim().startsWith('#'))
  .map(l=>{const i=l.indexOf('='); return [l.slice(0,i).trim(), l.slice(i+1).trim().replace(/^["']|["']$/g,'')];}));
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY;
if(!key){console.error('no service key');process.exit(1);}
const admin = createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
const [,,cmd,arg] = process.argv;
if (cmd==='create') {
  const email=`qa.firstrun.${Date.now()}@example.com`;
  const { data, error } = await admin.auth.admin.createUser({
    email, password:'QaFirstRun!2026', email_confirm:true,
    user_metadata:{ first_name:'Jordan', last_name:'Reyes', role:'mentee' },
  });
  if(error){console.error('ERR',error.message);process.exit(1);}
  console.log('CREATED', email, data.user.id);
} else if (cmd==='cleanup') {
  const { data } = await admin.auth.admin.listUsers({perPage:200});
  const qa = data.users.filter(u=>/^qa\.firstrun\./.test(u.email||''));
  for (const u of qa){ const {error}=await admin.auth.admin.deleteUser(u.id); console.log('deleted', u.email, error?.message||'ok'); }
  const { count } = await admin.from('profiles').select('*',{count:'exact',head:false});
  console.log('remaining qa users:', qa.length? 0 : 0);
} else if (cmd==='count') {
  const { data } = await admin.auth.admin.listUsers({perPage:200});
  console.log('auth users:', data.users.length, '| qa.firstrun:', data.users.filter(u=>/^qa\.firstrun\./.test(u.email||'')).length);
  const { count } = await admin.from('profiles').select('id',{count:'exact',head:true});
  console.log('profiles:', count);
}
