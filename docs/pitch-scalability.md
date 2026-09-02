# Mentee — Scalability Analysis

> Internal document. Separates current state from hypotheses.
> No projections are included without empirical support.

---

## Technical Scalability

### Current Stack

| Layer | Technology | Scalability Characteristics |
|---|---|---|
| Frontend | Next.js 15 (App Router) + Vercel | Serverless; scales to zero; static pages served from CDN |
| Auth | Supabase Auth | Managed; scales with Supabase plan |
| Database | Supabase Postgres | Managed Postgres; scales vertically or to read replicas |
| Realtime | Supabase Realtime (messages only) | Channel-based; scales with plan |
| Storage | Supabase Storage | Avatar uploads; scales with plan |
| AI/Voice | OpenAI Whisper (server-side API) | Scales linearly with usage; costs per minute of audio |

### Architectural Decisions That Aid Scalability

**Row-Level Security enforced at database layer.** Application code cannot accidentally expose one user's data to another. Security does not degrade as the user base grows.

**Static pages for public content.** The landing page, people profiles, and all unauthenticated content is statically generated (SSG). These pages are served from Vercel's CDN edge at virtually no server cost regardless of traffic volume.

**Indexed database tables.** All foreign keys and high-cardinality query columns are indexed:
- `mentorship_requests`: mentor_id, mentee_id, status
- `mentorships`: mentor_id, mentee_id, status
- `sessions`: mentor_id, mentee_id, mentorship_id, status
- `messages`: mentorship_id
- `notifications`: user_id, (user_id, is_read) partial index
- `saved_mentors`: user_id, mentor_id

**No N+1 queries in hot paths.** The discover page fetches mentor profiles in a single join query. The dashboard uses `Promise.all` for parallel data loading.

**Mentor capacity is user-controlled.** Each mentor sets their maximum concurrent mentees. This is a natural rate limiter that prevents any single mentor from being overwhelmed — and creates supply-side scarcity that is healthy for a marketplace.

### Known Technical Scaling Risks

**Dashboard data loading.** The dashboard page currently runs sequential round-trips for session partner names (one query per session). This is acceptable at low user counts but would need batching as session volume grows. Recommended fix: a single joined query for upcoming sessions with partner names.

**Voice transcription costs.** OpenAI Whisper charges per minute of audio. If voice-enabled session notes become a heavily used feature, this cost grows linearly and needs a cap or a premium-tier wrapper.

**Supabase Realtime limitations.** The current messages implementation uses a Realtime channel per mentorship. At large scale (thousands of concurrent mentorships), channel count can become a constraint. Supabase's Realtime is designed for this pattern, but it is worth monitoring.

**No caching layer yet.** Discover page data is fetched on every page load. A short-lived cache (even Next.js route-level caching) would significantly reduce database load as mentor inventory grows.

---

## Business Model Scalability

### The Core Network Mechanic

```
Founder's personal network
         ↓
Founding mentors (manually sourced)
         ↓
Founding near-peers / early mentees (manually sourced)
         ↓
First successful mentorships
         ↓
Mentees invite peers facing similar challenges
Mentors invite other mentors they respect
         ↓
Network grows without proportional CAC increase
         ↓
Former mentees eventually become mentors
         ↓
Alumni loop compounds the supply side
```

This is the model. Whether it materialises is a hypothesis.

### Why the Unit Economics Could Scale

**One mentor serves multiple mentees.** A mentor with capacity for 3–5 active mentees provides value to 3–5 users with a fixed time investment. Each additional mentee added to the same mentor's roster does not require a proportional increase in mentor acquisition cost.

**Supply is relationship-driven, not paid.** If mentors are recruited through professional relationships (existing mentors referring others, employer programs, university partnerships), the cost per mentor acquired approaches zero. This is fundamentally different from a two-sided marketplace that must pay for both sides.

**Institutional deals are high-multiplier.** A single university partnership could bring hundreds of students into the platform in one contract. The sales effort is concentrated; the user acquisition is distributed.

### Customer Acquisition Cost Hypothesis

**Early stage (current):** CAC ≈ $0 — all users come from direct relationships.

**Mid stage (target):** Institutional deals bring users at a blended CAC well below a direct-to-consumer channel, because one sale produces many users.

**Risk:** If the relationship-driven model does not compound, and paid acquisition becomes necessary, CAC could increase significantly. Consumer mentorship platforms that rely on content marketing or paid social face CAC that is difficult to justify without subscription revenue.

### Retention Mechanisms

**For mentors:**
- Impact visibility (dashboard shows mentees helped, hours invested, sessions completed)
- Capacity control (mentors can pause without leaving permanently)
- Founding Mentor recognition (status badge on profile and dashboard)
- Low administrative burden (scheduling, session notes, and goal tracking are platform-managed)

**For mentees:**
- Active relationship pull (upcoming session creates a reason to return)
- Goal and action item accountability loop
- Session history and progress record (switching platforms means losing this context)
- Network permanence (completed mentorships and reviews remain on the platform)

### What Still Needs Empirical Validation

| Assumption | Status |
|---|---|
| Mentors stay active after first accepted request | Untested — no retention data yet |
| Mentees refer peers organically | Untested — no referral data yet |
| Successful mentees become mentors | Untested — platform is too early |
| Institutional buyers will pay for this | Hypothesis — no contracts yet |
| Network density crosses a self-sustaining threshold | Untested — no data on what that threshold is |

---

## Mobile and Future Client Scalability

The current architecture is intentionally mobile-compatible:

- **Supabase SDK** has official iOS and Android clients; the same tables, RLS policies, and API are accessible from native apps without schema changes.
- **Auth** (Supabase Auth with JWTs) is compatible with mobile OAuth flows.
- **API** (all data access via Supabase JS SDK directly) means no custom API layer that would need to be duplicated for mobile.
- **Responsive design** ensures the current web app is functional on mobile screens today.

No architectural changes are required to build a native mobile app on top of the current backend.

---

## Opportunity Fund: Scalability Considerations

The Opportunity Fund adds business complexity more than technical complexity. The technical infrastructure scales the same way as the core platform. What doesn't scale automatically:

### Technical Scaling Challenges Specific to the Fund

**Concurrency control on fund balances.** Multiple simultaneous approvals could theoretically exceed an available fund balance. This requires `SELECT FOR UPDATE` or serializable transaction isolation before real disbursement. Not yet implemented — not needed until real funds exist.

**Document storage.** Receipt uploads require a private Supabase Storage bucket with signed URL access. Storage scales with Supabase plan. Not yet implemented.

**Application volume.** If many students apply simultaneously, the review queue becomes a bottleneck. This is an operations problem (reviewer capacity) more than a technical problem.

### Business Scaling Challenges

**Reviewer capacity.** Every grant application requires human review. This does not scale automatically — it scales with staff or volunteer reviewer capacity. This is the primary non-technical scalability constraint.

**Capital supply.** The Opportunity Fund scales only as fast as capital can be raised. Sponsor relationships compound slowly. A university partnership might fund 20 students; it does not automatically fund 2,000.

**Eligibility verification at scale.** Honor-system self-attestation works for a small cohort with tight community norms. At large scale, verification processes become necessary — and they require institutional partnerships or verification APIs that don't currently exist.

### The Compounding Moat

At scale, the Opportunity Fund creates a compounding advantage that is harder for a new entrant to replicate:
- Alumni mentors who benefited from funding are more likely to mentor and contribute capital back
- Outcome data accumulated over years becomes evidence no new entrant can replicate quickly
- Institutional partnerships deepen with each funded cohort's outcome report
- Sponsor trust compounds: a sponsor who saw 10 students succeed is more likely to fund 50

---

## What Mentee Is NOT Doing in the Name of Scalability

- No premature infrastructure migration (Postgres is sufficient for millions of rows; migrating away early would be waste)
- No custom video infrastructure (would add enormous cost and complexity; a partner integration is sufficient)
- No proprietary ML matching (rule-based scoring is transparent, maintainable, and adequate at current scale)
- No microservices (monolithic Next.js app on Vercel is faster to iterate and sufficient for this stage)
- No fake grant capital to demonstrate the Opportunity Fund (honest empty state is more defensible than manufactured traction)
