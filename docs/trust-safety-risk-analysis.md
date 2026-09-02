# Mentee — Trust, Safety & Risk Analysis

> Internal document. Honest assessment of current state and gaps.
> Do not represent planned mitigations as existing ones.

---

## Why This Matters

Mentee facilitates sustained 1:1 relationships between adults, including between experienced professionals and students who may be significantly younger or in a vulnerable position (uncertain career, high stakes decisions, information asymmetry). The trust model is foundational — if users don't trust the platform, the core product fails.

---

## Risk Table

| # | Risk | Probability | Severity | Current Mitigation | Recommended Next Mitigation | Future Mitigation |
|---|---|---|---|---|---|---|
| 1 | Mentor/mentee harassment via messaging | Medium | High | Messaging gated behind approved mentorship request; no cold messaging | In-app report/block button; terms of service with clear conduct policy | Content moderation tooling; automated flag on message patterns |
| 2 | Impersonation (fake credentials, fake employer) | Medium | High | Founding cohort manually vetted by founder | LinkedIn URL on profiles; company email verification at onboarding | Third-party credential verification integration |
| 3 | Inappropriate relationship (mentor in authority position exploiting mentee) | Low-Medium | Very High | Mutual consent via request/approval flow; either party can exit | Clear terms of service defining acceptable conduct; easy relationship exit | Periodic check-ins; anonymous feedback mechanism |
| 4 | Off-platform contact leading to unsafe situations | Medium | High | None currently — platform cannot prevent users exchanging contact info | Terms of service strongly recommending on-platform sessions; platform-native video | Education materials in onboarding about safe mentorship |
| 5 | Underage users | Low | High | No explicit age gate beyond email-based signup | Age declaration at signup; block under-18 or require guardian consent | ID verification for minors |
| 6 | Fraudulent credentials / fake professionals | Medium | High | Founder-vetted founding cohort only | LinkedIn URL required; employer email verification | Background check integration for institutional partners |
| 7 | Data exposure (one user seeing another's private data) | Low | Very High | Row-Level Security enforced at Postgres level for all tables | Regular RLS policy audit | Penetration testing; automated RLS regression testing |
| 8 | Spam / unsolicited messages | Low-Medium | Medium | Messaging only within approved mentorships; no cold messaging | Rate limiting on message sends | Content filters |
| 9 | Bias in mentor matching | Medium | Medium | Matching is transparent and rule-based (visible criteria, no hidden weighting) | Diversity audit of matching outcomes | Third-party fairness audit when dataset is large enough |
| 10 | Bad advice causing harm | Low-Medium | Medium | Platform makes no warranty of mentor expertise; user exercises judgment | Clear disclaimer in onboarding and terms of service | Reviewed by counsel before institutional partnerships |
| 11 | Account takeover | Medium | High | Supabase Auth with bcrypt password hashing; secure JWT sessions | Password reset flow via email; login alert via email | 2FA option; suspicious login detection |
| 12 | Account deletion / right to erasure | Low | High | No current account deletion UI | Self-service account deletion in profile settings | GDPR-compliant data deletion pipeline |
| 13 | Mentor burnout / capacity overload | Medium | Medium | Mentor-controlled capacity limit (max_mentees) | Dashboard alerts when mentor is near capacity | Auto-pause option when sessions/week threshold exceeded |
| 14 | Reputational risk from a bad actor in founding cohort | Low | Very High | Founding mentors personally known to founder | Written conduct agreement before onboarding any mentor | Community standards document; graduated consequence system |
| 15 | Session notes / conversation data breaches | Low | High | Supabase storage encrypted at rest; TLS in transit | Data retention policy; clear user-facing privacy policy | Encryption at application layer for particularly sensitive notes |

---

## Highest-Priority Actions Before Scaling Beyond Founding Cohort

These are the gaps that must be closed before the platform opens to users outside the founder's direct network. Ordered by risk-adjusted priority:

### Priority 1 — Report and Block (Technical, ~1 week)

Add an in-app "Report this user" button accessible from any active mentorship or message thread. A block action should prevent future contact. Reports should go to a founder-monitored inbox until a formal moderation system exists.

**Why first:** Without this, a harassed user has no recourse within the platform. They must go to email or legal channels, which is both a user experience failure and a reputational risk.

### Priority 2 — Terms of Service and Conduct Policy (Legal/Content, ~1 week)

A publicly accessible Terms of Service and Community Standards document that defines:
- Acceptable and unacceptable mentor/mentee conduct
- The platform's role (facilitator, not guarantor of advice quality)
- Consequences for violations
- How to report concerns

**Why second:** Currently there is no explicit contract between the platform and its users. This creates legal exposure and sets unclear expectations.

### Priority 3 — Account Deletion (Technical, ~3 days)

A self-service way for users to delete their account and have their personal data removed from the platform. This is a basic user right and a legal requirement in several jurisdictions (GDPR, CCPA).

**Why third:** Mentorship involves sharing personal goals and vulnerabilities. Users who want to leave should be able to delete their history cleanly.

### Priority 4 — Age Declaration (Technical, ~1 day)

A clear age declaration (18+) at signup with a checkbox. Currently there is no age gate.

### Priority 5 — LinkedIn URL Verification Signal (Product, ~2 days)

Currently LinkedIn URLs on profiles are optional strings. Adding a clear signal that a mentor's LinkedIn has been visited and is consistent with their stated credentials (even if just a manual admin check) reduces impersonation risk during the founding phase.

---

## What the Platform Does NOT Currently Claim to Do

- Mentee does not verify professional credentials.
- Mentee does not conduct background checks.
- Mentee does not monitor conversation content for harmful patterns.
- Mentee does not guarantee the quality or safety of advice given by any mentor.
- Mentee does not provide legal, financial, medical, or psychological advice through any mentor.

These limitations must be clearly stated in the Terms of Service before scaling.

---

## Data Privacy Architecture

**What data Mentee holds:**
- Email address and name (from Supabase Auth and profiles table)
- Profile information (bio, goals, expertise, school, etc.)
- Mentorship request messages
- Chat messages (within approved mentorships only)
- Session notes (text, not audio)
- Voice transcriptions (server-side via OpenAI Whisper; not stored in Supabase)
- Goal and action item records
- Review text and ratings

**What Mentee does NOT hold:**
- Passwords (Supabase Auth handles hashing)
- Payment data (no payments implemented)
- Audio recordings (voice is transcribed and discarded server-side)
- Government ID or identity documents

**Access controls:**
- Users can only read and write their own data except where explicitly granted (e.g., mentors can read their mentees' profiles within an active mentorship)
- All access enforced by Row-Level Security at the database layer, not application layer

---

## Long-Term Safety Roadmap

1. **Pre-launch of first institutional partner:** Complete Priority 1–5 above; formal Terms of Service.
2. **At 500 users:** Formal community standards document; designated trust & safety point of contact.
3. **At 2,000 users:** Semi-automated message flagging for high-risk patterns; counselled privacy policy; GDPR compliance audit.
4. **At 10,000 users:** Dedicated trust & safety role or contractor; possible third-party safety audit.
