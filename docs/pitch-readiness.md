# Mentee — Pitch Competition Readiness Dashboard

> Internal document. Scores are honest and self-critical.
> Audit Pass 1 = initial product build. Audit Pass 2 = Opportunity Fund extension.

---

## Rubric Audit Table

| Criterion | Pass 1 /10 | Pass 2 /10 | What changed (Pass 2) | Evidence in product | What still needs validation |
|---|---|---|---|---|---|
| 1. Target Audience + Problem | 8 | 9 | Opportunity Fund extends the problem statement from "who gets access to a mentor" to "who gets to act on the advice." Two-gap framing is sharper and more complete. | Landing page "Beyond Advice" section; /opportunities page; dashboard card for mentees | No external user research quantifying how often financial barriers prevent professional-development action |
| 2. Uniqueness + Competitive Advantage | 7 | 8 | No other mentorship platform is building toward funded opportunity removal. This makes Mentee structurally harder to replicate — it requires both mentor supply and capital partnerships. | Opportunity Fund product foundation; migration 0012; extensible fund/eligibility model | No comparable product to benchmark against; moat is architectural and operational, not yet proven |
| 3. Go-to-Market Strategy | 5 | 6 | Opportunity Fund creates a second, distinct GTM motion: sponsor/donor acquisition. Universities and employers who want to fund student access now have a product to point capital at. | pitch-business-model.md updated with restricted-capital vs. platform-revenue distinction | No sponsor conversations started; no capital committed |
| 4. Financial Model | 6 | 7 | Business model doc now distinguishes platform revenue from restricted Opportunity Fund capital. Sponsor/donor pipeline added as a separate funding motion with its own logic. | pitch-business-model.md — sponsor capital model, restricted vs. revenue distinction | Still no contracts; Opportunity Fund capital structure requires legal/accounting clarity |
| 5. Scalability | 7 | 7 | No change to scalability score — Opportunity Fund adds business complexity more than technical complexity. Financial governance and fraud controls will be the scaling challenge. | opportunity-fund-governance.md documents the operational complexity honestly | N/A for this pass |
| 6. Ethics + Social Impact | 6 | 8 | Report/block now built. Account deletion built. Opportunity Fund is designed with strict RLS — mentors cannot see financial need data. Privacy architecture documented explicitly. Governance doc written. | user_reports, user_blocks, DELETE /api/account/delete, RLS on financial_need_profiles | Terms of Service still needed; age gate still needed; Opportunity Fund eligibility verification process not yet defined |
| 7. Team Credibility / Why Us | 7 | 7 | No change — team credibility is unchanged by this pass. | — | Co-founder or advisor with financial/nonprofit experience would strengthen this criterion significantly |
| 8. Presentation Quality | 8 | 8 | Demo path updated to include Opportunity Fund. /opportunities page is fully demoable with honest pilot state. | Clean pilot state page; category cards; financial need profile form | Live demo with active fund would be stronger than the honest-empty-state demo |
| 9. Q&A Readiness | 8 | 9 | pitch-qa.md extended with 30+ Opportunity Fund Q&A covering fraud, eligibility, governance, financial structure, and common attack angles. | pitch-qa.md Opportunity Fund section | Practice delivery; external sceptical reader test |

---

## Score Summary

| | Pass 1 | Pass 2 |
|---|---|---|
| **Total** | **62/90** | **69/90** |
| **Average** | **6.9** | **7.7** |

The remaining gap (21 points) cannot be closed with code. It requires traction, capital, and business execution.

---

## The Two-Gap Story (New Framing for Pass 2)

Mentee now addresses two distinct access problems:

**Gap 1 — The Relationship Gap:** Finding the right person who has traveled the path you want to travel.
→ Solved by: intelligent matching, founding mentor network, structured relationship tools.

**Gap 2 — The Resource Gap:** Having the means to act on that person's guidance.
→ Addressed by: Opportunity Fund — targeted professional-development support for students with demonstrated financial need.

This framing makes Mentee harder to dismiss as "LinkedIn for students." The combination of mentorship infrastructure and opportunity funding creates a flywheel:

MENTORSHIP → DIRECTION → OPPORTUNITY → FUNDING → ACTION → OUTCOME → NEXT GENERATION OF MENTORS

---

## What Mentee Is Genuinely Strong On

1. **The product is real and fully functional.** The entire lifecycle from landing page through sessions, goals, and reviews is built and deployed. Most pitch competition products are mockups or partial builds.

2. **The founding network is authentic.** Every mentor on the platform is a real person the founder knows personally. The problem statement comes from lived experience, not market research.

3. **The architecture is solid.** RLS-enforced data access, proper indexing, SSG for public pages, and a clean component system mean the product is not a fragile demo — it is a working application.

4. **The mission is coherent.** "Access to mentorship should not depend on luck" is a clear, defensible thesis that is easy to understand and difficult to argue against.

5. **The Opportunity Fund vision is architecturally honest.** The product communicates pilot status truthfully. No fake money, no fake sponsors, no fake recipients. The infrastructure exists to support real funding when capital is committed. This is a stronger position than pretending funds exist.

---

## What Mentee Is Genuinely Weak On

1. **No traction data.** No organic signups, no session data, no retention metrics. Every claim about user value is a hypothesis.

2. **No revenue.** No institutional conversations, no paid users, no contracts. The business model is a framework, not a plan with evidence.

3. **Opportunity Fund has no capital.** The infrastructure exists. The legal/governance structure does not. The product is truthfully in pilot. Judges will ask when it launches.

4. **Trust/safety gaps remain.** Report/block and account deletion are now built. Terms of Service, age gate, and Opportunity Fund eligibility verification are still missing.

5. **One-person team.** No co-founder, no documented team. Judges will probe this. An advisor with nonprofit/fund experience would strengthen credibility for the Opportunity Fund thesis.

6. **GTM is unproven.** The relationship-driven acquisition model is coherent but untested beyond the founding cohort.

---

## Demo Path (2–3 Minutes)

**Recommended live demo sequence:**

1. **Landing page** (30 sec) — Hero: "Find the mentor who changes everything." Scroll to MentorSection, LifecycleSection, and pause on the "Beyond Advice / Opportunity Fund" section. This establishes the two-gap thesis without leading with money.

2. **Sign in to a demo account** (10 sec) — Pre-authenticated as a mentee. Land on the dashboard. Point to the Opportunity Fund card.

3. **Dashboard** (15 sec) — Show pending requests, active mentorships, goals stats, and the Opportunity Fund entry point.

4. **Discover page** (25 sec) — Show real mentor cards with match scores and explicit match reasons. Demonstrate filter panel.

5. **Mentorship Request** (15 sec) — Show the request modal — goals + message. Explain the structured commitment.

6. **Inside an active mentorship** (25 sec) — Messages (real-time), Goals (tracking an interview-prep goal).

7. **Opportunity Fund** (30 sec) — Navigate to /opportunities. Explain the pilot state honestly: "Here's what the system looks like before capital is committed. The student can express interest in Professional Attire support, link it to their IB interview goal, and tell us what's in the way. When a sponsor funds a cohort, this infrastructure is ready." Show the interest form briefly.

8. **Closing** (10 sec) — "We're not pitching a mockup. We're pitching a system that connects the person, the guidance, the goal, and eventually the resources. What we're solving is who gets access to all of it."

**Total: ~2:30**

---

## Top 10 Questions Most Likely to Expose Weakness

(See pitch-qa.md for full answers)

1. What is your evidence that mentors will stay active?
2. Where does the Opportunity Fund money come from?
3. Who verifies financial need? Can students lie?
4. Why can't a university or employer just do this themselves?
5. How do you prevent fraud in the grant process?
6. How do you verify that mentors are who they say they are?
7. Why can't LinkedIn just add this feature?
8. You have a small founding network — how does this scale to people you don't know?
9. Is sponsor money revenue or restricted capital? How does accounting work?
10. Why are you the right person to build this, and why now?

---

## Remaining Gaps by Type

### CAN FIX WITH CODE (before next pitch)
- [x] In-app report/block button on active mentorships — DONE
- [x] Account deletion in profile settings — DONE
- [ ] Age declaration checkbox at signup
- [ ] Terms of Service page (even if minimal)
- [ ] Dashboard N+1 query fix for session partner names
- [ ] Opportunity Fund admin review interface (requires admin role architecture first)

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
