import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
const env={}; for (const l of readFileSync('.env.local','utf8').split('\n')){const m=l.match(/^([A-Z0-9_]+)=(.*)$/); if(m)env[m[1]]=m[2].replace(/^["']|["']$/g,'');}
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY||env.SUPABASE_SERVICE_KEY,{auth:{persistSession:false}});
await db.from('sessions').delete().gte('created_at', new Date(Date.now()-30*60_000).toISOString()).is('external_event_id', null);
const { data: me } = await db.from('profiles').select('id').eq('email','mentee@demo.mentee.app').single();
await db.from('calendar_connections').update({ revoked_at: null, expires_at: new Date(Date.now()+3600_000).toISOString() })
  .eq('profile_id', me.id).eq('provider','google');
const { count } = await db.from('sessions').select('*',{count:'exact',head:true});
console.log('sessions reset to:', count, '| connection re-armed');
