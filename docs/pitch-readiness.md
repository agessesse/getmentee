# Mentee — Pitch Competition Readiness Dashboard

> Internal document. Scores are honest and self-critical.
> Before scores = state before this audit. After scores = state after this audit pass.

---

## Rubric Audit Table

| Criterion | Before /10 | After /10 | What changed | Evidence in product | What still needs validation |
|---|---|---|---|---|---|
| 1. Target Audience + Problem | 7 | 8 | Hero copy is clear; MentorSection philosophy articulates the access problem; MenteeCarousel shows real users; fabricated "500+ mentors" claim removed from dashboard | Landing page hero, LifecycleSection, FEATURED_MENTORS with mission context, SOURCED_NEAR_PEERS carousel | No external user research validating that the target audience recognises this as their problem |
| 2. Uniqueness + Competitive Advantage | 6 | 7 | LifecycleSection makes the workflow differentiation visible; MatchPreview shows transparent scoring; full relationship lifecycle (request → sessions → goals → reviews) built | MatchPreview, LifecycleSection 5-step diagram, goals + action items, mentor impact dashboard | No comparative user study showing Mentee produces better outcomes than LinkedIn cold outreach |
| 3. Go-to-Market Strategy | 4 | 5 | "Invite a mentor" CTA added to landing page; GTM story now visible (real founding network + invite loop); pitch-qa.md documents the relationship-driven GTM | Real mentors in founding cohort, near-peer carousel, invite CTA on landing page | No referral conversion data; no evidence the network compounds beyond the founding cohort |
| 4. Financial Model | 2 | 6 | pitch-business-model.md created with realistic revenue paths, cost structure, and honest caveats | pitch-business-model.md — institutional partnerships, employer programs, premium features | No contracts, no revenue, no validated willingness-to-pay |
| 5. Scalability | 5 | 7 | pitch-scalability.md documents technical architecture + business network effects; dashboard false claim removed | Indexed DB, RLS, SSG landing page, mentor capacity controls, impact tracking | No load testing; no empirical CAC data; network effects unproven |
| 6. Ethics + Social Impact | 3 | 6 | trust-safety-risk-analysis.md documents 15 risks with honest current vs. recommended mitigations; prioritised action list | Supabase RLS, request/approval gating, no cold messaging possible, docs/SECURITY.md | Report/block not built; Terms of Service not written; no age gate |
| 7. Team Credibility / Why Us | 6 | 7 | Founder story communicated through real mentors (not fabricated); MentorSection philosophy is compelling; all mentors personally known to founder | FEATURED_MENTORS (real people), MentorSection "Before Mentee was a platform, it was a pattern", mission statement | No external validation of founder background by judges; no co-founder or team beyond founder |
| 8. Presentation Quality | 7 | 8 | False copy removed from dashboard; demo path documented below; clean responsive design throughout; no placeholder copy in core paths | Live Vercel deployment, full relationship lifecycle demo-able end to end | Demo requires a pre-seeded account; live Q&A response to unexpected flows |
| 9. Q&A Readiness | 2 | 8 | pitch-qa.md created with honest answers to 30+ judge questions, separating facts from hypotheses | pitch-qa.md | Practice delivery; stress-test with a sceptical external reader |

---

## Score Summary

| | Before | After |
|---|---|---|
| **Total** | **42/90** | **62/90** |
| **Average** | **4.7** | **6.9** |

The remaining gap (28 points) cannot be closed with code. It requires traction, contracts, and business execution.

---

## What Mentee Is Genuinely Strong On

1. **The product is real and fully functional.** The entire lifecycle from landing page through sessions, goals, and reviews is built and deployed. Most pitch competition products are mockups or partial builds.

2. **The founding network is authentic.** Every mentor on the platform is a real person the founder knows personally. The problem statement comes from lived experience, not market research.

3. **The architecture is solid.** RLS-enforced data access, proper indexing, SSG for public pages, and a clean component system mean the product is not a fragile demo — it is a working application.

4. **The mission is coherent.** "Access to mentorship should not depend on luck" is a clear, defensible thesis that is easy to understand and difficult to argue against.

---

## What Mentee Is Genuinely Weak On

1. **No traction data.** No organic signups, no session data, no retention metrics. Every claim about user value is a hypothesis.

2. **No revenue.** No institutional conversations, no paid users, no contracts. The business model is a framework, not a plan with evidence.

3. **Trust/safety gaps.** No report/block, no Terms of Service, no age verification. Acceptable for a founding cohort of personally vetted people; not acceptable at scale.

4. **One-person team.** No co-founder, no documented team. Judges will probe this.

5. **GTM is unproven.** The relationship-driven acquisition model is coherent but untested beyond the founding cohort.

---

## Demo Path (2–3 Minutes)

**Recommended live demo sequence:**

1. **Landing page** (30 sec) — Hero: "Find the mentor who changes everything." Scroll to MentorSection to show real mentors and the "before it was a platform, it was a pattern" origin story. Scroll to LifecycleSection to show the 5-step workflow.

2. **Sign in to a demo account** (10 sec) — Pre-authenticated as a mentee. Land on the dashboard.

3. **Dashboard** (20 sec) — Show pending requests, active mentorships, upcoming sessions, and goals stats. Quick CTA to Discover.

4. **Discover page** (30 sec) — Show real mentor cards with match scores and explicit match reasons. Demonstrate the filter panel (by industry or expertise). Click into a mentor card to show the full profile.

5. **Mentorship Request** (20 sec) — Click "Request Mentorship". Show the modal — personal message + goals fields + Voice Input button. Explain that the mentor will explicitly approve or decline.

6. **Inside an active mentorship** (30 sec) — Switch to a demo account that already has an active mentorship. Show: Messages (real-time), Schedule (upcoming sessions with structured session view), Goals (active goals with completion tracking).

7. **Closing** (10 sec) — "The full lifecycle is built. We're not pitching a mockup — we're pitching a working system. What we're solving is who gets access to this."

**Total: ~2:30**

---

## Top 10 Questions Most Likely to Expose Weakness

(See pitch-qa.md for full answers)

1. What is your evidence that mentors will stay active?
2. How do you prevent users from taking conversations off-platform?
3. What is your CAC and how did you calculate it?
4. Who pays, and when?
5. How do you verify that mentors are who they say they are?
6. Why can't LinkedIn just add this feature?
7. How do you protect users from inappropriate mentor behaviour?
8. You have a small founding network — how does this scale to people you don't know?
9. What do you do when a mentor gives bad advice that harms a mentee's career?
10. Why are you the right person to build this, and why now?

---

## Remaining Gaps by Type

### CAN FIX WITH CODE (before next pitch)
- [ ] In-app report/block button on active mentorships
- [ ] Account deletion in profile settings
- [ ] Age declaration checkbox at signup
- [ ] Terms of Service page (even if minimal)
- [ ] Dashboard N+1 query fix for session partner names

### CAN ONLY FIX WITH TRACTION / VALIDATION
- [ ] Mentor retention rate data
- [ ] Session completion rate data
- [ ] Organic signup data (outside founder's network)
- [ ] Mentee referral rate data
- [ ] NPS or satisfaction signal

### CAN ONLY FIX WITH BUSINESS EXECUTION
- [ ] First institutional partnership conversation
- [ ] First paid contract
- [ ] Co-founder or team member
- [ ] Formal Terms of Service reviewed by counsel
- [ ] Verified mentor credentials (beyond manual vetting)
