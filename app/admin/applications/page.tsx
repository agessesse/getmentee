import { requireAdmin, rows } from '@/lib/supabase/admin';
import { Panel, Empty, Tag } from '@/components/admin/ui';
import { writingSignal } from '@/lib/cohort/writing-signal';
import ApproveApplicant from '@/components/admin/ApproveApplicant';

export const dynamic = 'force-dynamic';

/**
 * Founding cohort applications, for a human to read.
 *
 * Reached through the admin layout's requireAdmin() gate and read with the
 * service-role client, which is the only thing that can see this table at all:
 * cohort_applications has RLS on with no policies and no privileges for anon
 * or authenticated, so there is no browser-side path to these rows.
 *
 * The writing signal on each card is one observation for the reviewer, not a
 * verdict. It does not sort, filter, hide or rank anything, and no application
 * is ever treated differently because of it. See lib/cohort/writing-signal.ts
 * for why it measures specificity rather than pretending to detect authorship.
 */

interface Application {
  id: string;
  role: 'mentee' | 'mentor';
  full_name: string;
  email: string;
  school: string | null;
  year: string | null;
  title: string | null;
  organization: string | null;
  linkedin_url: string | null;
  expertise: string | null;
  who_help: string | null;
  why_mentoring: string | null;
  good_relationship: string | null;
  involvement: string | null;
  timely: string | null;
  good_mentee: string | null;
  user_id: string | null;
  learning: string | null;      // what they are working toward
  why_mentor: string | null;    // what they want help thinking through
  tried: string | null;         // what they have already done
  status: string;
  created_at: string;
}

/* One list per role, matching what each application actually asked. */
const MENTEE_Q: { key: keyof Application; label: string }[] = [
  { key: 'learning', label: 'What are you working toward right now?' },
  { key: 'why_mentor', label: 'What would you want a mentor’s help with?' },
  { key: 'timely', label: 'Why is mentorship useful to you right now?' },
  { key: 'tried', label: 'What have you already done on your own?' },
  { key: 'good_mentee', label: 'What would make you good to mentor?' },
];

const MENTOR_Q: { key: keyof Application; label: string }[] = [
  { key: 'why_mentor', label: 'What could you genuinely help someone with?' },
  { key: 'who_help', label: 'Who are you most interested in helping?' },
  { key: 'why_mentoring', label: 'Why are you interested in mentoring?' },
  { key: 'good_relationship', label: 'What does a useful mentoring relationship look like?' },
];

const SIGNAL_TONE = { low: 'green', unclear: 'neutral', elevated: 'amber' } as const;
const SIGNAL_LABEL = { low: 'Low', unclear: 'Unclear', elevated: 'Elevated' } as const;

export default async function AdminApplications() {
  const gate = await requireAdmin();
  if (!gate.ok) return null;
  const { db } = gate;

  const apps = await rows<Application>(
    db
      .from('cohort_applications')
      .select('id, role, full_name, email, school, year, title, organization, linkedin_url, expertise, learning, why_mentor, tried, timely, good_mentee, who_help, why_mentoring, good_relationship, involvement, status, user_id, created_at')
      .order('created_at', { ascending: false }),
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display font-normal text-2xl leading-tight text-halo-ink">
          Founding cohort applications
        </h1>
        <p className="text-[14px] text-halo-heather mt-1">
          {apps.length === 0
            ? 'No applications yet.'
            : `${apps.length} ${apps.length === 1 ? 'application' : 'applications'}, newest first.`}
        </p>
      </div>

      {apps.length === 0 ? (
        <Panel title="Nothing to review">
          <Empty>Applications submitted at /founding-cohort will appear here.</Empty>
        </Panel>
      ) : (
        apps.map((a) => {
          const mentor = a.role === 'mentor';
          const questions = mentor ? MENTOR_Q : MENTEE_Q;
          const signal = writingSignal(questions.map((q) => a[q.key] as string | null));
          return (
            <Panel
              key={a.id}
              title={a.full_name}
              action={
                <span className="text-[12px] text-halo-mist-body">
                  {new Date(a.created_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })}
                </span>
              }
            >
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-halo-heather">
                  <a href={`mailto:${a.email}`} className="text-halo-purple-d hover:text-halo-ink">
                    {a.email}
                  </a>
                  {a.school && <span>{a.school}</span>}
                  {a.year && <span>{a.year}</span>}
                  {a.title && <span>{a.title}</span>}
                  {a.organization && <span>{a.organization}</span>}
                  {a.linkedin_url && (
                    <a href={a.linkedin_url.startsWith('http') ? a.linkedin_url : `https://${a.linkedin_url}`}
                       target="_blank" rel="noopener noreferrer"
                       className="text-halo-purple-d hover:text-halo-ink">LinkedIn</a>
                  )}
                  <Tag tone={mentor ? 'amber' : 'green'}>{a.role}</Tag>
                  <Tag tone="neutral">{a.status}</Tag>
                </div>

                {mentor && a.expertise && (
                  <div>
                    <p className="font-ui text-[10.5px] font-semibold uppercase tracking-[0.14em] text-halo-mist-body mb-1">
                      Areas of experience
                    </p>
                    <p className="text-[14px] text-halo-ink leading-relaxed">{a.expertise}</p>
                  </div>
                )}
                {mentor && a.involvement && (
                  <div>
                    <p className="font-ui text-[10.5px] font-semibold uppercase tracking-[0.14em] text-halo-mist-body mb-1">
                      Involvement that feels realistic
                    </p>
                    <p className="text-[14px] text-halo-ink leading-relaxed">{a.involvement}</p>
                  </div>
                )}

                {questions.map((q) => (
                  <div key={q.key as string}>
                    <p className="font-ui text-[10.5px] font-semibold uppercase tracking-[0.14em] text-halo-mist-body mb-1">
                      {q.label}
                    </p>
                    <p className="text-[14px] text-halo-ink leading-relaxed whitespace-pre-line">
                      {(a[q.key] as string | null) ?? <span className="text-halo-mist-body">No answer.</span>}
                    </p>
                  </div>
                ))}

                {/*
                  Deliberately last, under the answers, and visibly hedged. A
                  reviewer should form a view from the writing and then see
                  this, not the other way round.
                */}
                <div className="border-t border-halo-rule pt-4">
                  <ApproveApplicant
                    applicationId={a.id}
                    status={a.status}
                    activated={Boolean(a.user_id)}
                  />
                </div>

                <div className="border-t border-halo-rule pt-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-ui text-[10.5px] font-semibold uppercase tracking-[0.14em] text-halo-mist-body">
                      Writing signal
                    </span>
                    <Tag tone={SIGNAL_TONE[signal.level]}>{SIGNAL_LABEL[signal.level]}</Tag>
                  </div>
                  <p className="text-[13px] text-halo-heather leading-relaxed">{signal.summary}</p>
                  {signal.notes.length > 0 && (
                    <ul className="mt-1.5 space-y-0.5">
                      {signal.notes.map((n) => (
                        <li key={n} className="text-[12.5px] text-halo-mist-body leading-relaxed">
                          {n}
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="text-[12px] text-halo-mist-body leading-relaxed mt-2">
                    This looks at whether the answers name anything specific. It is not an AI
                    detector and cannot tell you who or what wrote something. Plenty of
                    honest writing looks plain, and careful writing by someone working in a
                    second language is often misread by tools that claim otherwise.
                  </p>
                </div>
              </div>
            </Panel>
          );
        })
      )}
    </div>
  );
}
