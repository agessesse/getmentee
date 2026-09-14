import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
const env=Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(l=>l.includes('=')&&!l.trim().startsWith('#')).map(l=>{const i=l.indexOf('=');return[l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^["']|["']$/g,'')];}));
const a=createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY||env.SUPABASE_SERVICE_KEY,{auth:{persistSession:false}});
const cmd=process.argv[2];
if(cmd==='create'){const email=`qa.pilot.${Date.now()}@example.com`;
 const {data,error}=await a.auth.admin.createUser({email,password:'QaPilot!2026',email_confirm:true,user_metadata:{first_name:'Jordan',last_name:'Reyes',role:'mentee'}});
 if(error){console.error(error.message);process.exit(1);} console.log('CREATED',email);}
else if(cmd==='cleanup'){const {data}=await a.auth.admin.listUsers({perPage:200});
 for(const u of data.users.filter(u=>/^qa\.pilot\./.test(u.email||''))){await a.auth.admin.deleteUser(u.id);console.log('deleted',u.email);}
 const {count}=await a.from('profiles').select('id',{count:'exact',head:true});console.log('profiles:',count);}
