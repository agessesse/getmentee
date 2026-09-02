# Mentee — Business Model Framework

> Internal document. This is a framework for thinking, not a financial projection.
> No revenue numbers are included because none have been validated.
> Every section that makes a forward-looking claim is labelled as a hypothesis.

---

## Current Stage

Pre-revenue. The product is live. The initial mentor and near-peer network has been sourced. No users have paid. No contracts exist. The Opportunity Fund is in pilot — infrastructure built, no capital committed. The focus is on validating core product-market fit before monetising.

---

## Critical Distinction: Platform Revenue vs. Restricted Opportunity Fund Capital

These are two fundamentally different financial streams and must never be conflated.

**Platform Revenue:** Money that flows to Mentee as operating income — from institutional contracts, employer partnerships, or premium features. Mentee earns this and can deploy it for operations, salaries, and product development.

**Restricted Opportunity Fund Capital:** Donor or sponsor contributions that are designated for student professional-development support. This capital belongs to the fund, not to Mentee's operations. Mentee administers the disbursement but does not "earn" it as revenue. Accounting, legal, and tax treatment is entirely different from platform revenue.

This distinction matters for:
- Investor conversations (grant capital should not inflate revenue numbers)
- Legal structure (restricted funds may require nonprofit status, a DAF, or a fiscal sponsor)
- Donor relations (sponsors fund students, not the company's runway)
- Impact reporting (grant outcomes are reported separately from platform metrics)

---

## Revenue Streams (in order of likely timeline)

### 1. Institutional Partnerships — Universities

**Model:** Annual SaaS contract with a university, alumni office, or academic department.
**Value proposition to buyer:** Scalable mentorship infrastructure for students and alumni at a fraction of the cost of building it internally. Measurable engagement and outcome data for accreditation and reporting purposes.
**Why this first:** Universities have demonstrated willingness to pay for student success platforms. The buyer (administrator) is not the user (student), which is a clean B2B sale. Contracts can be multi-year and predictable.

**Hypothesis:** Universities will pay for a mentorship platform that demonstrates measurable student outcomes.
**What needs to be proven:** At least one pilot with a university student/alumni office with documented engagement data.

---

### 2. Employer Partnerships

**Model:** Companies sponsor mentorship programs — either for their employees, for recruiting pipeline development, or for community-building initiatives.
**Value proposition to buyer:** Access to motivated early-career candidates; community goodwill; a structured way to give back that is more efficient than individual employee time.
**Why this makes sense:** Finance, consulting, and technology firms already spend on employer branding. A mentorship partnership is a differentiated version of that spending.

**Hypothesis:** Companies at which current mentors work (Wells Fargo, Goldman Sachs, J.P. Morgan, etc.) will see value in a structured early-career mentorship pipeline.
**What needs to be proven:** At least one employer willing to sponsor a cohort or pay for access.

---

### 3. Professional Organisations and Nonprofits

**Model:** Organisations (finance clubs, diversity nonprofits, professional associations) pay for a private Mentee community for their members.
**Value proposition:** Mentorship infrastructure at scale without building their own platform.

**Hypothesis:** Organisations that currently run mentorship programs informally will pay to systematise them.

---

### 4. Premium User Features (Long-Term)

**Model:** Free tier for all users; optional premium tier for power users.
**Potential premium features:** Priority matching, advanced goal analytics, mentor certification, calendar integrations, video session hosting.
**Important:** This should not be introduced until the free network has meaningful density. Premature monetisation of individual users would suppress early growth.

**Hypothesis:** After the free network proves value, a portion of users will pay for enhanced functionality.

---

## Cost Structure

### Major Cost Drivers

**Infrastructure (current — very low):**
- Vercel hosting: scales with usage; free tier covers early stage
- Supabase: scales with rows, requests, and storage; free tier covers early stage
- Expected cost at 1,000 active users: < $100/month at current architecture

**Infrastructure (later):**
- Supabase grows with users and data volume
- If voice transcription (OpenAI Whisper) is used at scale, API costs grow linearly with session usage
- Video hosting (if added) would be the largest infrastructure cost

**People (dominant early cost):**
- Founder time
- First engineering hire (when growth demands faster iteration)
- First sales hire (when institutional GTM begins)

**Acquisition (hypothesis: low early):**
- Relationship-driven GTM means early CAC is effectively zero
- If paid acquisition becomes necessary, this becomes a significant cost

### Cost Advantages of the Current Architecture

- Supabase provides auth, database, realtime, and storage in one bill
- Vercel serverless eliminates infrastructure management overhead
- No proprietary ML models — matching is rule-based and transparent
- Static pages (Next.js SSG) reduce server load for public-facing content

---

## Unit Economics Framework

(Framework only — no validated numbers)

**Key metrics to track before making projections:**

| Metric | Why it matters |
|---|---|
| Mentor activation rate | % of invited mentors who complete a profile and accept ≥1 request |
| Mentee activation rate | % of signups who send ≥1 mentorship request |
| Request acceptance rate | % of requests accepted by mentors |
| Session completion rate | % of accepted mentorships that result in ≥1 session |
| Repeat session rate | % of first sessions that lead to ≥2 sessions |
| Mentee referral rate | % of mentees who invite ≥1 peer |
| Mentor referral rate | % of mentors who invite ≥1 other mentor |
| Institutional contract value (ACV) | When first B2B sales occur |
| Payback period | Ratio of sales cost to ACV |

**No unit economics can be calculated until these metrics exist.**

---

## Assumptions That Still Require Validation

1. **Mentor supply scales.** We currently have a manually curated founding cohort. Scaling mentor supply beyond the founder's direct network is the central unsolved problem.

2. **Universities will pay.** We believe they will, based on analogous products in adjacent spaces. We have not closed a contract.

3. **Employer partnerships are accessible.** Current mentors work at target employers, which provides warm intros. But employer procurement cycles can be long and unpredictable.

4. **The free model builds sufficient density before monetisation pressure.** If institutional revenue becomes necessary early, it could compromise network openness.

5. **Matching quality is sufficient without AI ranking.** Current matching is rule-based. If users churn because they feel unmatched, we may need more sophisticated ranking — which has cost implications.

---

## Opportunity Fund Capital Sources (Separate from Platform Revenue)

These are potential sources of restricted capital for the Opportunity Fund — not Mentee operating revenue.

**Employers:** Companies whose employees mentor on Mentee could sponsor cohorts for students targeting their industry. Example: a financial services firm sponsors a "Charlotte Career Access Fund" for students pursuing finance internships.

**Universities:** An alumni office or student success fund could designate Mentee as a disbursement channel for professional-development support. Reduces their administrative burden while adding product infrastructure.

**Alumni networks:** Individual alumni donors fund specific categories (e.g., "Professional Attire for IB Recruiting") with clear eligibility criteria and outcome reporting.

**Foundations:** Mission-aligned foundations funding workforce development, first-generation student support, or professional equity programs.

**Important:** Raising Opportunity Fund capital is not the same as raising operating capital. These require different legal structures, different conversations, and may require Mentee to establish or partner with a 501(c)(3) nonprofit entity. See opportunity-fund-governance.md.

---

## What Mentee Deliberately Does NOT Plan to Do

- Charge individual users for basic access (suppresses early network growth)
- Introduce a marketplace take-rate on sessions (positions Mentee as a gig platform, not a relationship platform)
- Sell user data (incompatible with the trust model the product depends on)
- Build video infrastructure from scratch (partner with existing providers if needed)
- Treat Opportunity Fund capital as company revenue (would be misleading and potentially legally problematic)

---

## Near-Term Financial Milestones (in order, not dated)

1. First ten active users (mentors + mentees with completed sessions) — validates core product
2. First institutional warm conversation (university or employer) — validates B2B hypothesis
3. First paid pilot (any institution) — validates willingness to pay
4. First renewal — validates retention of institutional customer
5. Infrastructure cost exceeds $500/month — milestone to plan paid tier or institutional revenue
