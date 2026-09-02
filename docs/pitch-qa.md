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

What it does NOT look like: a horizontal professional network, a job board, or a LinkedIn competitor. The focus stays on the mentorship relationship — not on professional networking broadly.
