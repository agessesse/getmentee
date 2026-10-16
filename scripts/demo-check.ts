import { DEMO_MATCHES } from '../lib/marketing/demo-match';
for (const m of DEMO_MATCHES) {
  console.log(`\n── ${m.community}`);
  console.log(`   ${m.seeker.name} (${m.seeker.label})  ↔  ${m.candidate.name} (${m.candidate.label})`);
  for (const r of m.reasons) console.log(`     - ${r}`);
  console.log(`     opener: ${m.opener}`);
}
