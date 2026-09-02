# Mentee — Pitch Q&A Preparation

> Internal document. Separate FACTS WE CAN PROVE TODAY from HYPOTHESES WE ARE TESTING.
> Never manufacture traction, revenue, users, retention, partnerships, or testimonials.

---

## Why isn't this just LinkedIn?

LinkedIn helps you find professionals. It is optimised for job seeking and credential signalling, not for building a sustained mentorship relationship. On LinkedIn you cold-message a stranger with no context, no shared structure, and no expectation of follow-through. Mentee creates a mutual commitment: the mentee sends a structured request explaining their goals; the mentor explicitly accepts; both parties then have a shared session history, goals, and action items. The relationship has architecture — LinkedIn does not.

**What we can prove today:** The full workflow exists — request → approval → messaging → scheduling → sessions → goals → reviews — and every step is structured rather than ad-hoc.

---

## Why would mentors join?

Three honest reasons. First, meaningful motivation: the mentors we recruited are people who already wanted to give back — they needed a system, not persuasion. Second, low friction: we handle scheduling, session notes, and goal tracking so the mentor does not. Third, social proof: being part of a curated founding mentor cohort is a signal in itself. Over time, mentor retention will depend on the satisfaction of watching mentees succeed — we plan to make that visible through the impact dashboard.

**What we can prove today:** The founding mentor cohort includes real professionals who agreed to participate. The impact dashboard tracks mentees helped, sessions conducted, and hours invested.

**Hypothesis we are testing:** Whether impact visibility and structured workflow are sufficient long-term retention drivers for mentors.

---

## Why would mentees use this instead of cold outreach on LinkedIn?

Two reasons. First, the barrier to entry: finding someone, crafting a cold message, following up, and handling rejection — most students do this badly or not at all. Mentee removes the ambiguity: the mentor has opted in, the request format is clear, and rejection is handled gracefully. Second, structure after the match: a LinkedIn connection produces a conversation thread. Mentee produces a recurring relationship with shared goals, scheduled sessions, and tracked progress.

**What we can prove today:** The onboarding funnel and request flow are live. The post-match workflow (sessions, goals, action items, reviews) is fully built.

---

## How do you solve the cold-start problem?

We don't launch with an empty marketplace. The founder has real relationships with real mentors who agreed to participate before the platform launched. We also seeded a near-peer network (students who can both give and receive mentorship) to populate the initial community. New users see real people, not placeholders.

**What we can prove today:** The founding mentor roster is live on the platform. The near-peer carousel on the landing page shows real people from the founder's network.

**Hypothesis we are testing:** Whether the founding cohort is dense enough that early signups find relevant matches without a larger inventory.

---

## How will Mentee make money?

The initial user-facing product is free. This is intentional — maximising early network growth matters more than early revenue. Likely monetisation paths, roughly in order of timeline:

1. **University/institutional partnerships.** Universities pay for structured mentorship infrastructure for their students and alumni. This is a B2B sale to administrators, not to students.
2. **Employer-sponsored programs.** Companies sponsor mentorship pipelines as recruiting, community, or early-career development initiatives.
3. **Professional organisations.** Finance clubs, diversity programs, and professional associations want private mentorship communities.
4. **Optional premium features.** Advanced analytics, priority scheduling, or mentor certification for power users.

See `docs/pitch-business-model.md` for the full financial framework.

---

## Who pays?

Initially nobody — this is a network-building phase. First paying customers are most likely institutions (universities, companies, organisations) rather than individual users. Individual monetisation, if it comes, is likely premium features after the free tier has proven value.

---

## What prevents users from leaving the platform after meeting?

The platform creates retention through structure, not lock-in. Goals, action items, session history, and progress tracking live inside Mentee. If a mentor and mentee go off-platform, they lose that infrastructure. We are not trying to prevent conversations from happening elsewhere — we are trying to be the system of record for the relationship.

**Hypothesis we are testing:** Whether the session/goal/review infrastructure is compelling enough to keep relationships on-platform.

---

## How do you retain mentors?

Short answer: make them feel effective. The impact dashboard shows each mentor how many mentees they have helped, hours invested, sessions conducted, and ratings received. Mentors who can see their impact tend to stay. We also avoid over-burdening mentors — they control their capacity, availability, and can pause at any time.

**What we can prove today:** The mentor impact dashboard exists and is live.

**Hypothesis we are testing:** Whether impact visibility is sufficient, or whether we need additional incentives (recognition, community, etc.).

---

## How do you retain mentees?

Active mentorships create pull. A mentee with a scheduled session next week has a reason to return. Goal tracking creates accountability. Action items create a loop — complete an action, mark it done, discuss in the next session. The relationship itself is the retention mechanism.

---

## What is the moat?

Network density and relationship data. As more mentors and mentees build histories on Mentee, the platform becomes more valuable. A mentor's track record (sessions, ratings, mentee outcomes) is meaningful. A mentee's goal history provides context. These are not portable assets — they live inside Mentee.

Longer term: a curated mentor network with verified quality is hard to replicate. LinkedIn has quantity. Mentee bets on quality and structure.

**Honest assessment:** At this stage the moat is thin — we have a small founding network and a well-built product. The moat will grow with traction. This is a hypothesis, not a fact.

---

## What prevents LinkedIn from copying this?

LinkedIn could copy any individual feature. What they cannot easily do is change their fundamental product thesis — they are a professional graph optimised for opportunity signalling. Adding mentorship workflow would compete internally with their core recruiting and sales products. Niche products can move faster and focus more deeply than a platform serving 900 million users with conflicting objectives.

Additionally, trust matters. Mentors and mentees share real goals and personal struggles. That conversation happens more naturally on a purpose-built platform than on a professional networking site.

---

## How will you acquire your first 100 users?

Direct relationships. The founding mentor cohort is already identified. Their mentees — students they already know or have interacted with — are the natural first 100. No paid acquisition. No cold outreach to strangers.

**What we can prove today:** Founding mentors and near-peers are already sourced and visible on the platform.

---

## How will you acquire your first 1,000 users?

Expansion from the initial network. Mentees invite peers facing similar challenges. Mentors refer other mentors they respect. Campus clubs, diversity organisations, and finance/consulting student groups provide concentrated early audiences. Each successful mentorship relationship is evidence that can be shared.

**What we are NOT claiming:** We do not have a paid acquisition channel. We do not have a referral program with verified conversion rates. This is a relationship-first GTM model in its earliest stage.

---

## What is CAC?

Currently effectively zero — all users come from the founder's direct network. We do not have empirical CAC data from any paid or content channel. The hypothesis is that a relationship-driven GTM significantly reduces eventual CAC relative to platforms that rely on paid social.

**What still needs validation:** Whether network-driven growth compounds as hypothesised, or whether paid acquisition becomes necessary earlier than expected.

---

## What creates network effects?

One-sided network effect: more mentors on the platform make it more valuable for mentees (better match quality, more options). Two-sided effect: more active mentorships produce more reviews, ratings, and relationship data, which improve match quality for everyone. Long-term: mentees who succeed become mentors — the alumni loop.

---

## How does Mentee scale?

The product is built on Supabase (Postgres + Auth + Realtime) hosted on Vercel. The architecture scales horizontally with usage. One mentor can help multiple mentees; capacity is controlled by the mentor. The biggest scaling challenge is mentor supply — there is no algorithmic substitute for a human willing to invest time.

See `docs/pitch-scalability.md` for the full technical and business scalability analysis.

---

## How do you ensure mentor quality?

Current state: mentor quality is ensured through direct sourcing. Every mentor in the founding cohort is someone the founder knows or has vetted personally. This does not scale indefinitely but is appropriate for the founding phase.

Future: verified credentials (LinkedIn import, company email), mentee ratings and reviews after sessions, and a formal onboarding process. The review system is already built — it becomes meaningful as the platform generates session data.

**What we are NOT claiming:** We do not have a scalable vetting process. We have a manually curated founding cohort.

---

## How do you protect users?

Current protections: all data is access-controlled via Row-Level Security at the database level. Mentorship relationships require mutual consent (mentee requests, mentor approves). Messaging is only available within established mentorship relationships. No stranger can message a user unprompted.

Gaps: no in-app reporting or blocking mechanism yet, no content moderation, no identity verification beyond email address.

See `docs/trust-safety-risk-analysis.md` for the full risk framework.

---

## How do you prevent harassment?

The gating mechanism is the mentorship approval workflow — strangers cannot message users unsolicited. But we do not yet have a report/block feature or a code-of-conduct enforcement mechanism. This is the highest-priority trust/safety gap to close before scaling beyond the founding cohort.

---

## How do you address bias in matching?

The current matching algorithm is transparent: it scores based on shared industry, expertise tags, goals, and university — and shows the user exactly why each mentor appears. We do not use opaque algorithmic ranking beyond these explicit signals. This reduces the risk of hidden bias but also means match quality is limited by how well users fill out their profiles.

**Hypothesis we are testing:** Whether transparent, structured matching produces better outcomes than algorithmic black-box matching.

---

## What happens if a mentor gives bad advice?

We make the mentor-mentee relationship explicit — the mentee knows who they are working with, can see the mentor's background, and can end the relationship at any time. We do not position Mentee as a credentialing authority or professional advice service. The platform creates access; users exercise judgment about whose advice to take. We plan to add a clear terms of service making this explicit.

---

## What evidence suggests people actually want this?

Honest answer at this stage: the founding mentor cohort agreed to participate, which signals demand from the supply side. The near-peer network shows students who want structured mentorship access. The product is live and functional.

What we do not have yet: retention data, session data, organic signups from outside the founder's network. These are the metrics that will answer this question definitively.

---

## What is your strongest evidence of traction TODAY?

- Real mentors from the founder's personal network agreed to participate before launch.
- A real near-peer network (current students at Georgetown, UNC, Duke, Columbia, UC Berkeley, University of Minnesota, University of New Hampshire) is already sourced.
- A functioning product is live on Vercel with the full relationship lifecycle implemented.

What we do NOT have: paid signups, organic signups at scale, session data, retention rates, or testimonials from people who have not been directly recruited by the founder.

---

## What is the biggest assumption that still needs validation?

That mentors will consistently invest time in recurring relationships with strangers outside their immediate personal network. Everything else — the product, the workflow, the matching — is secondary to this. If mentors churn after one or two sessions, the platform cannot function regardless of how good the technology is.

---

## What metrics will determine whether Mentee is working?

In order of importance:
1. **Mentor retention rate** — do mentors stay active after their first accepted request?
2. **Session completion rate** — do mentorships result in actual sessions?
3. **Repeat session rate** — do first sessions lead to second and third sessions?
4. **Mentee goal completion** — do mentees mark goals complete over the course of a mentorship?
5. **Net Promoter Score (informal)** — would mentors and mentees refer others?

The database already tracks all of these except NPS. The missing piece is sufficient users to generate meaningful statistics.

---

## Why are you the right founder to build this?

Because the product comes from direct experience, not market research. The founder has had mentors change the direction of their academic and professional trajectory — real people who showed up at pivotal moments. The question was not "is mentorship valuable" but "why is access to it so unequal." The founding mentor cohort are the real mentors who shaped that observation. The near-peer network is real students who are navigating the same challenges. This is not a product built by observing a problem from the outside.

---

## What does Mentee look like in five years?

If the core hypothesis holds:
- A dense, high-quality mentor network spanning multiple industries, institutions, and career stages.
- University and employer partnerships providing institutional revenue.
- Alumni mentorship loops where former mentees become mentors and bring their own networks.
- A track record of measurable outcomes (internships obtained, careers launched, decisions improved) that makes the value proposition provable.
- Opportunity Fund programs operating at multiple universities and employer cohorts, with outcome tracking showing what the capital enabled.

What it does NOT look like: a horizontal professional network, a job board, or a LinkedIn competitor. The focus stays on the mentorship relationship — and on removing the barriers that prevent students from acting on it.

---

---

# Opportunity Fund — Q&A

---

## Why are you adding financial support? Isn't mentorship enough?

Mentorship gives you direction. It does not automatically give you the resources to move. A mentor can tell a student to buy a suit for their interview, attend a conference, travel to an office visit, or meet someone for coffee. For a student with significant financial need, a relatively small expense — $150 for a suit, $30 for a train ticket — can be the actual barrier to acting on that advice. Mentorship closes the relationship gap. The Opportunity Fund is designed to close the resource gap. Together they form a complete pathway from ambition to outcome.

**What we can prove today:** This is a real and documented phenomenon. First-generation and Pell-eligible students consistently report financial barriers to professional-development opportunities in academic literature.

**What we cannot prove yet:** Whether our specific implementation reduces this barrier for our specific users. That requires real grants and outcome tracking.

---

## Are you becoming a scholarship platform?

No. A scholarship platform covers tuition, living expenses, or academic costs. The Opportunity Fund is specifically scoped to targeted professional-development expenses that arise in the context of a mentored career-development pathway. We are not trying to cover rent, food, or academic costs. We are trying to remove the specific, identifiable barriers between a mentor's advice and a mentee's action.

Internal principle: "A mentor can help you identify the door. Mentee wants to make sure financial barriers don't prevent you from walking through it."

---

## Where does the grant money come from?

It does not currently exist. The Opportunity Fund is in its pilot phase. No capital has been committed. When funding is raised, it will come from employers, universities, alumni, foundations, or other mission-aligned sponsors — not from Mentee's operating revenue.

**Important distinction:** Opportunity Fund capital is restricted capital designated for student support. It is not Mentee operating revenue. A judge treating it as revenue or as something Mentee already has would be incorrect.

---

## Who determines eligibility?

Eligibility for the Opportunity Fund is designed to be based on demonstrated financial need. In the current design, this is self-attested by the mentee — they report their Pell status, first-generation status, and whether they receive need-based aid. This is clearly labeled as self-reported in the product.

The platform does not currently verify Pell status automatically. Verification mechanisms — if and when required — will be introduced when specific funded programs launch and will depend on the program design.

**What we deliberately avoided:** FAFSA login, Social Security number collection, or any intrusive data collection that is disproportionate to the information needed.

---

## Why use Pell eligibility?

Pell eligibility is a well-established federal indicator of financial need. It avoids requiring subjective income disclosure and is broadly understood in the university context. However, Pell eligibility is not the only path — the system also accepts other need-based indicators (institutional aid, need-based scholarships) and "prefer not to say." Pell is a convenient anchor, not a gate.

---

## What about financially needy students who are not Pell recipients?

The system explicitly accommodates them. The financial need profile includes:
1. Pell status (yes / no / prefer not to say)
2. First-generation status (yes / no / prefer not to say)
3. Whether they receive need-based aid (yes / no / prefer not to say)
4. Free-text context for other designations (QuestBridge, Gates, institutional aid, etc.)

Eligibility rules will vary by funded program and are designed to be extensible, not binary.

---

## How do you verify financial need?

Currently: self-attestation. The product marks it as "self-reported" with no verification checkmark. This is intentional honesty — we do not pretend to verify something we cannot verify.

Future verification pathways may include:
- Manual review of institutional aid letters
- University financial aid office attestation (requires partnership)
- Approval pathway where applications are reviewed before awards

None of these pathways exist yet. We are building the infrastructure that will support them, not claiming they exist.

---

## How do you prevent fraud?

This is a serious design question and we take it seriously. Current controls:
- RLS prevents users from accessing other users' financial data
- Users cannot approve their own applications or modify fund balances
- All actions are timestamped for audit purposes
- Mentor endorsement is separated from financial approval

Controls that must exist before real money moves (and do not yet exist):
- Admin review workflow with conflict-of-interest controls
- Duplicate receipt detection
- Fund balance concurrency control (prevents concurrent approvals from overspending)
- Document validation
- Identity verification

**Honest answer:** The code provides a foundation. Fraud prevention at scale requires legal, operational, and technical controls that are not yet fully built. We would not disburse real grants today without those controls in place.

---

## Who approves grants?

Currently, no one — because there are no grants to approve. When programs launch, approval authority will rest with designated reviewers on the Mentee team, not mentors and not sponsors. This separates the mentorship relationship from the financial decision to prevent conflicts of interest.

**What we deliberately designed out:** Mentors do not approve grants. Sponsors do not browse individual student applications. Students cannot approve their own requests.

---

## Can mentors approve money for their own mentees?

No. The design explicitly separates mentor endorsement (which confirms developmental relevance) from grant approval (which is reserved for designated reviewers). A mentor can say "this expense aligns with what we're working toward" but cannot approve money. Approval authority is held by the platform.

---

## What prevents favoritism?

Three things in the design:
1. Mentors do not have approval authority
2. Sponsors do not have approval authority over individual applications
3. All grant decisions are made centrally by designated reviewers with conflict-of-interest policies (to be written before real funds launch)

This does not eliminate favoritism risk entirely — it depends on the integrity of the reviewer team. Human review of any grant program carries this risk; mitigating it requires clear policy and audit trails.

---

## Does the mentor see a student's financial information?

No. The RLS policy on `financial_need_profiles` allows only the owning mentee to read their own record. Mentors have zero access to any financial need data. The only thing a mentor may eventually see is that a student has requested an endorsement, described as something like "Abel has requested support for professional attire for an upcoming interview" — no financial detail.

---

## How do sponsors know their money had impact?

Aggregate impact reporting, not individual student records. A sponsor would receive something like: "In Q1, the Charlotte Career Access Fund supported 12 students. 8 purchased professional attire. 10 completed the opportunity the support was intended for. 4 reported a positive professional outcome (interview, offer, conference connection)." Individual student financial records are never shared with sponsors.

---

## How does Mentee make money if students are free and grant capital goes to students?

Platform revenue and Opportunity Fund capital are completely separate:

**Platform revenue** comes from institutional contracts (universities, employers, professional organisations) who pay for mentorship infrastructure, analytics, and cohort management. This is Mentee's operating income.

**Opportunity Fund capital** is restricted donor/sponsor money designated for student support. Mentee administers it but does not earn it. This is categorically not revenue.

Whether Mentee charges a program administration fee on Opportunity Fund capital — a common nonprofit practice — is a business and legal policy question that has not yet been decided.

---

## Is sponsor money revenue?

No. Restricted charitable contributions are not revenue. If a sponsor designates $50,000 for a student opportunity fund, that $50,000 must go to students, not to Mentee's operations. The accounting treatment and legal structure required to administer this correctly are outlined in opportunity-fund-governance.md and require counsel review.

---

## Why wouldn't a university just do this itself?

Universities operate many financial aid programs but often with high administrative overhead, long processing times, rigid eligibility categories, and poor integration with the actual mentorship relationships that identify the need. A student's financial aid office does not know that their mentor told them they need a suit for a superday next Thursday.

Mentee sits at the point of identified need — the mentor relationship — and can route targeted, time-sensitive support more efficiently than a financial aid office that processes applications over weeks. The value proposition is contextual, not just financial.

**Hypothesis we are testing:** Universities will see Mentee as complementary infrastructure, not competitive. This has not been validated.

---

## How does this improve Mentee's moat?

Combining mentorship infrastructure with opportunity funding creates network effects that are harder to replicate than either alone:

- A mentor who has seen their mentees actually act on advice (because the financial barrier was removed) is more likely to stay and recruit other mentors
- A student who received support is more likely to become a mentor and fund future students
- A university or employer who sees measured outcomes from funded mentees is more likely to commit recurring capital
- The outcome data Mentee accumulates becomes evidence that no new entrant can replicate quickly

The combination of people, guidance, goals, funding, and outcomes makes Mentee structurally different from a matching marketplace.

---

## Does financial assistance actually improve career outcomes?

There is academic evidence that financial barriers prevent professional-development participation for lower-income students. There is not yet Mentee-specific evidence that our specific implementation improves outcomes. That is honest.

The causal claim we will eventually be able to make is narrow: "Mentee-funded support enabled this specific professional-development action." We will not claim that $200 "created a Goldman Sachs offer." We can claim that $200 supported professional attire for an interview process that the student could not have attended otherwise.

---

## What happens when the Opportunity Fund runs out?

If a funded program is exhausted, new applications are not accepted until new capital is committed. The product is designed to show funding status honestly — "Active," "Pilot," or "Closed" — so students are never misled about whether funding is available.

---

## What expenses will you refuse to fund?

The categories are intentionally narrow: professional attire, networking, travel to professional opportunities, career development resources, and approved conferences. Categorical exclusions will include rent, food, general living expenses, personal purchases unrelated to professional development, alcohol, and luxury items. The specific exclusion list will be defined in program terms when programs launch.

---

## Are grants taxable?

This is a legal and tax question that requires attorney review before any grants are issued. In general, grants for tuition and educational expenses may be tax-exempt; grants for professional development expenses may be taxable as ordinary income. We will not disburse grants without legal clarity on this question.

---

## Does Mentee need nonprofit status?

Possibly, for the Opportunity Fund component. A for-profit entity can administer charitable programs in limited circumstances, but the legal and tax structure requires counsel review. Options include establishing a separate 501(c)(3), partnering with a fiscal sponsor, or structuring sponsor contributions as business expenses rather than charitable contributions. See opportunity-fund-governance.md.

---

## Could a corporation restrict funding to certain students?

Sponsor restrictions based on financial need, institution, career path, or geography are generally permissible. Restrictions based on race, religion, national origin, sex, or other protected characteristics are generally prohibited even in charitable contexts. Any sponsor agreement must be reviewed by counsel before implementation. The eligibility-rules design in the database schema is extensible to accommodate permissible restrictions.

---

## How do you prevent discriminatory sponsor criteria?

Mentee retains the right to decline any sponsor whose eligibility criteria are discriminatory or inconsistent with our values. Sponsor agreements will include language prohibiting impermissible discrimination. This requires legal review.

---

## What happens if someone lies about an expense?

If a student submits a fraudulent receipt or misrepresents an expense, they would be in violation of program terms, subject to account termination, and potentially required to repay the award. Depending on the amount, this could constitute fraud. The deterrent is the audit trail, the review process, and the social cost of being banned from the platform.

We cannot prevent all fraud with code. We can make it difficult, audit it, and have clear consequences.

---

## What happens if an approved opportunity is cancelled?

This is an open policy question. Options include: rescheduling support to a future opportunity, requiring return of unspent funds, or case-by-case review. This must be defined before programs launch.

---

## Do you reimburse students or pay vendors directly?

For the MVP, reimbursement (student pays, submits receipt, gets repaid). Direct vendor payment is operationally simpler for students but requires vendor relationships and may be impractical for small purchases like attire. Direct payment may make sense for specific categories (conference registration) in future programs.

---

## What is your 60-second pitch?

The old way: a student with ambition depends entirely on luck and network to find the right mentor. Even if they find one, the advice they receive — "you need a suit," "you should attend this conference," "you should meet this person" — can require resources they don't have. The guidance exists. The action doesn't happen.

Mentee closes both gaps.

We connect students with real professionals who have already traveled the path — not cold outreach, not a directory, but a structured relationship with shared goals, sessions, and accountability. And for students with demonstrated financial need, we're building an Opportunity Fund to help remove specific, identifiable barriers that prevent them from acting on that guidance.

Mentorship plus targeted opportunity funding is what it takes to turn ambition into outcome. We're building the infrastructure for that — from the match to the mentor conversation to the interview suit to the job offer.

The product is live. The mentor network is real. The Opportunity Fund is in pilot. What we're building is the infrastructure for a more equitable path to professional success.
