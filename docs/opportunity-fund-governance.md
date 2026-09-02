# Mentee Opportunity Fund — Governance Framework

> Internal document. This identifies what code cannot solve.
> Distinguishes PRODUCT CONTROLS from BUSINESS POLICY from LEGAL/ACCOUNTING QUESTIONS.

---

## Status

The Opportunity Fund is in pilot. No capital has been committed. This document prepares for what must exist before real money moves.

---

## Product Controls (Built or Buildable in Code)

These exist or can exist within the Mentee codebase:

| Control | Status | Notes |
|---|---|---|
| Financial need profile is private (mentors cannot read it) | Built — RLS enforced | `financial_need_profiles` has no mentor-read policy |
| Users cannot self-set `verification_status` above `self_reported` | Built — RLS `WITH CHECK` constraint | Only service role can advance to `verified` |
| Opportunity interests are labeled as "not an application" | Built — UI copy | Form includes disclaimer in amber callout |
| Users cannot approve their own applications | Architecture exists | `opportunity_applications` state transitions require service role in current design |
| Fund balances cannot be directly modified by users | Built — no client `INSERT/UPDATE` policy on `opportunity_funds` | Only service role can create or update funds |
| Mentor endorsement is separated from financial approval | Architecture built | `mentor_endorsement_status` is distinct from `status` in the application model |
| Audit trail via `created_at` / `updated_at` on all tables | Built | Every table has timestamps |
| Account deletion cascades financial data | Built — `ON DELETE CASCADE` | If a mentee deletes their account, their financial need profile is deleted |

---

## Business Policy Decisions (Not Yet Made)

These are operational questions that require human decisions, not code:

### Eligibility

- **Who reviews self-reported Pell status?** Options: honor system only, university verification, FAFSA data match (requires partnership), manual admin review. Currently: honor system; `verification_status` = `self_reported`.
- **What if a student is financially needy but not Pell-eligible?** The product accepts other indicators (`need_based_aid`, `additional_context`). Policy on how these are weighted is undefined.
- **Is there an income ceiling below which everyone qualifies without documentation?** Undefined.
- **Does eligibility expire?** Undefined — a student's financial situation can change.

### Grant Amounts and Categories

- **Is there a maximum award per student per year?** Undefined.
- **Is there a maximum award per application?** Defined per fund (`max_request_amount` column exists) but no global policy.
- **Which expenses are categorically ineligible?** Not defined. Examples of likely exclusions: rent, food, general living expenses, luxury items, non-professional attire.
- **Can a student receive support from multiple funds?** Undefined.

### Review and Approval

- **Who reviews applications?** Currently no admin role exists. Must be defined before real applications can be received.
- **What is the review SLA?** Undefined.
- **Can the same person approve and have a conflict of interest?** Policy needed — e.g., a reviewer cannot approve grants for mentees of their personal acquaintances.
- **What happens when a reviewer disagrees with a mentor endorsement?** Undefined.

### Disbursement

- **Reimbursement or direct payment?** Reimbursement (student pays, submits receipt, gets paid back) vs. direct payment to vendor (requires vendor relationships). Reimbursement is simpler for MVP. Direct payment may be needed for large expenses.
- **Payment method?** Venmo, Zelle, ACH, check? None defined.
- **How long does disbursement take after approval?** Undefined.
- **What happens if a receipt is not submitted within X days of approval?** Undefined.
- **What happens if the opportunity is cancelled (interview cancelled, conference cancelled)?** Policy needed on refund vs. forfeit vs. rescheduling.

---

## Legal and Accounting Questions (Require Counsel)

These cannot be answered by code or internal policy alone:

### Entity Structure

- **Does Mentee need a separate 501(c)(3) to receive restricted grant capital?** Likely yes, or alternatively a fiscal sponsorship relationship with an existing nonprofit. Accepting donor-designated funds in a for-profit entity creates complications with donor intent and tax treatment.
- **Can a for-profit entity administer charitable grants?** In limited circumstances, yes — but this requires specific legal structures and likely creates reporting obligations.
- **Is a Donor Advised Fund (DAF) structure appropriate?** Could simplify donor administration. Requires a DAF sponsor.

### Tax Treatment

- **Are student grants taxable income?** Generally, grants for tuition are tax-exempt. Grants for non-educational professional expenses may be taxable as ordinary income. This depends on IRS rules and the nature of the expense. **This must be reviewed by a tax attorney before any grants are issued.**
- **Does Mentee have any 1099 reporting obligations to grant recipients?** Possibly, depending on amounts and categories.
- **How are employer/sponsor contributions treated for their tax purposes?** If treated as charitable contributions, requires Mentee to have charitable status. If treated as business expenses, different treatment applies.

### Discrimination and Fair Lending

- **Can a sponsor restrict funding to a specific demographic?** Race-based restrictions are generally prohibited even in charitable contexts. Restrictions based on financial need, first-gen status, institution, or geography are generally permissible. **Legal review required for any sponsor with demographic restrictions.**
- **Is there a disparate impact concern in the eligibility criteria?** If Pell eligibility is a proxy that disproportionately excludes a protected class, there may be fairness issues. Design should be needs-based, not demographic.

### Privacy

- **Does the collection of financial need information trigger state-level consumer protection laws?** Depends on jurisdiction. California (CCPA) and other states have specific rules around financial data.
- **How long should financial need profiles be retained?** After account deletion, currently cascades. But if grants were issued, records may need to be retained for audit purposes even after account deletion.

---

## Fraud Prevention Architecture (Built and Planned)

### Currently built
- Each mentee can only submit their own financial need profile (RLS)
- Unique constraints prevent duplicate submissions for the same category/period
- All actions timestamped with `created_at` and `updated_at`
- Service role required for state transitions (approval, verification)

### Must be built before real grants
- Duplicate receipt detection (same receipt submitted by multiple users)
- Fund balance concurrency control (prevent approvals that exceed available balance — use SELECT FOR UPDATE or serializable transactions)
- Application event log (immutable audit trail of every status change with actor and timestamp)
- Receipt document validation (file type, size limits, potentially OCR to catch duplicates)

### Cannot be solved by code alone
- Identity verification (is this actually the student they claim to be?)
- Fabricated receipts (code can detect duplicates; it cannot detect photoshopped documents)
- Conflict of interest detection (requires human review policy)
- Coordinated fraud (multiple accounts submitting related applications)

---

## Minimum Requirements Before Real Money Moves

### CODE
- [ ] Admin role and review interface (cannot use email-based admin authorization)
- [ ] Application submission flow (blocked until at least one active fund exists)
- [ ] Document upload (private Supabase Storage bucket, signed URLs, MIME validation)
- [ ] Fund balance concurrency control
- [ ] Application event log / audit trail
- [ ] Disbursement tracking (record payment sent, method, amount, date)

### BUSINESS OPERATIONS
- [ ] Review team (at minimum one reviewer who is not the founder)
- [ ] Conflict of interest policy
- [ ] Eligibility review process documented
- [ ] Maximum award amounts defined
- [ ] Ineligible expense list defined
- [ ] Disbursement timeline and method defined
- [ ] Receipt submission deadline defined
- [ ] Cancelled opportunity policy defined

### LEGAL
- [ ] Counsel review of entity structure for restricted-capital administration
- [ ] Tax treatment of grants to students reviewed
- [ ] Donor agreement template reviewed
- [ ] Privacy policy updated to cover financial need data collection
- [ ] Terms of Service updated to cover Opportunity Fund participation

### ACCOUNTING
- [ ] Chart of accounts separates Opportunity Fund from operating funds
- [ ] Restricted capital accounting policy defined
- [ ] Donor reporting template created
- [ ] Grant disbursement reconciliation process defined

### FUNDRAISING
- [ ] First sponsor conversation initiated
- [ ] Sponsor deck / fund prospectus created
- [ ] Minimum fund size for first cohort determined

### PARTNERSHIPS
- [ ] At least one university, employer, or foundation in discussions
- [ ] Fiscal sponsor identified (if Mentee does not establish nonprofit entity)
