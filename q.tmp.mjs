import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
const env=Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(l=>l.includes('=')&&!l.trim().startsWith('#')).map(l=>{const i=l.indexOf('=');return[l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^["']|["']$/g,'')];}));
const a=createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY||env.SUPABASE_SERVICE_KEY,{auth:{persistSession:false}});
const {data:profs}=await a.from('profiles').select('id,first_name,last_name,role,is_demo,email');
console.log('profiles by role/demo:');
const g={}; profs.forEach(p=>{const k=`${p.role} demo=${p.is_demo}`; g[k]=(g[k]||0)+1;});
Object.entries(g).forEach(([k,v])=>console.log('  ',k,v));
const {data:mp}=await a.from('mentor_profiles').select('id,company,title,rating,review_count,is_available,is_verified');
console.log('\nmentor_profiles:', mp.length);
const withRating = mp.filter(m=>Number(m.rating)>0);
console.log('  with rating>0:', withRating.length, '| with review_count>0:', mp.filter(m=>m.review_count>0).length);
const {count:reviews}=await a.from('reviews').select('id',{count:'exact',head:true});
console.log('  ACTUAL rows in reviews table:', reviews);
console.log('\nmentor roster (name · company · rating(reviews) · demo):');
for (const m of mp) {
  const pr=profs.find(x=>x.id===m.id);
  console.log(`  ${((pr?.first_name||'?')+' '+(pr?.last_name||'')).padEnd(22)} ${(m.company||'—').padEnd(22)} ${m.rating}(${m.review_count})  demo=${pr?.is_demo}`);
}
