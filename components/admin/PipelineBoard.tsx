'use client';

import { useState, useTransition, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, ExternalLink } from 'lucide-react';
import { setStage, saveNotes, createMatch } from '@/app/admin/cohort/actions';
import { STAGE_LABEL, PRIMARY_STAGES, type PipelinePerson, type Stage, type Funnel } from '@/lib/cohort/stages';

/**
 * Assembling a cohort.
 *
 * THIS IS NOT A CRM AND NOT A KANBAN BOARD. Ten students and ten mentors do
 * not need swimlanes, drag targets or a card design. They need a list you
 * can read top to bottom, grouped by what has to happen next, with the
 * person's actual answers one tap away.
 *
 * THE OPERATOR SHOULD NEVER FEEL LIKE A DATABASE ADMINISTRATOR. Nothing on
 * screen says 'accepted', 'status' or 'mentorship row'. It says Selected,
 * Ready to match, and "Maya and Sarah are matched". Every action is a verb
 * in a button with a word in it.
 */

type View =
  | { kind: 'list' }
  | { kind: 'person'; id: string }
  | { kind: 'match'; studentId: string }
  | { kind: 'confirm'; studentId: string; mentorId: string };

export default function PipelineBoard({
  people, funnels, cohortId, cohortName,
}: {
  people: PipelinePerson[];
  funnels: { student: Funnel; mentor: Funnel };
  cohortId: string | null;
  cohortName: string;
}) {
  const [view, setView] = useState<View>({ kind: 'list' });
  const [flash, setFlash] = useState<string | null>(null);

  const byId = useMemo(() => new Map(people.map((p) => [p.applicationId, p])), [people]);
  const byProfile = useMemo(
    () => new Map(people.filter((p) => p.profileId).map((p) => [p.profileId as string, p])),
    [people],
  );

  if (view.kind === 'match' || view.kind === 'confirm') {
    const student = byId.get(view.studentId);
    if (!student) return null;
    return (
      <MatchFlow
        student={student}
        mentors={people.filter((p) => p.role === 'mentor' && (p.stage === 'matching' || p.stage === 'selected'))}
        cohortId={cohortId}
        preselectedMentorId={view.kind === 'confirm' ? view.mentorId : null}
        onBack={() => setView({ kind: 'person', id: view.studentId })}
        onDone={(msg) => { setFlash(msg); setView({ kind: 'list' }); }}
      />
    );
  }

  if (view.kind === 'person') {
    const p = byId.get(view.id);
    if (!p) return null;
    return (
      <PersonDetail
        p={p}
        partner={p.profileId ? byProfile.get(p.profileId) : undefined}
        onBack={() => setView({ kind: 'list' })}
        onFlash={(m) => setFlash(m)}
        onFindMatch={() => setView({ kind: 'match', studentId: p.applicationId })}
      />
    );
  }

  const groups = PRIMARY_STAGES.concat(['hold', 'declined'] as Stage[])
    .map((s) => ({ stage: s, rows: people.filter((p) => p.stage === s) }))
    .filter((g) => g.rows.length > 0);

  return (
    <>
      {flash && (
        <p role="status" className="mb-5 inline-flex items-center gap-2 rounded-xl bg-halo-veil border border-halo-rule px-4 py-2.5 text-[14px] text-halo-ink">
          <Check className="h-4 w-4 text-halo-brand-text" aria-hidden="true" />
          {flash}
        </p>
      )}

      <Funnels student={funnels.student} mentor={funnels.mentor} />

      {people.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-halo-rule px-6 py-8">
          <p className="font-display text-[1.25rem] text-halo-ink">No applications yet.</p>
          <p className="text-[14.5px] text-halo-heather leading-relaxed mt-2 max-w-md">
            {cohortName} fills up here. As people apply you&rsquo;ll read them, select ten,
            and pair each student with a mentor by hand.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((g) => (
            <section key={g.stage}>
              <h2 className="font-display text-[1.15rem] text-halo-ink mb-0.5">
                {STAGE_LABEL[g.stage]}
                <span className="text-halo-mist-body font-normal"> · {g.rows.length}</span>
              </h2>
              <ul className="mt-3 space-y-2">
                {g.rows.map((p) => (
                  <li key={p.applicationId}>
                    <button
                      onClick={() => setView({ kind: 'person', id: p.applicationId })}
                      className="w-full text-left rounded-2xl border border-halo-rule p-4 hover:bg-halo-veil transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple"
                    >
                      <span className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <span className="text-[15px] font-medium text-halo-ink">{p.fullName}</span>
                        <span className="font-ui text-[10px] font-semibold uppercase tracking-[0.12em] text-halo-mist-body">
                          {p.role === 'mentee' ? 'Student' : 'Mentor'}
                        </span>
                      </span>
                      <span className="block text-[13.5px] text-halo-heather mt-1">
                        {p.role === 'mentee'
                          ? [p.school, p.year, p.major].filter(Boolean).join(' · ') || 'No school given'
                          : [p.title, p.organization].filter(Boolean).join(' · ') || 'No role given'}
                      </span>
                      {p.waitingOn && (
                        <span className="block text-[13px] text-halo-brand-text mt-1.5">{p.waitingOn}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}

/* ── Funnel ──────────────────────────────────────────────────────────────── */

function Funnels({ student, mentor }: { student: Funnel; mentor: Funnel }) {
  const rows: [string, keyof Funnel][] = [
    ['Applied', 'applied'], ['Reviewed', 'reviewing'], ['Selected', 'selected'],
    ['Matched', 'matched'], ['Activated', 'activated'],
  ];
  if (student.applied === 0 && mentor.applied === 0) return null;

  return (
    <section className="mb-8 rounded-2xl border border-halo-rule p-4">
      <h2 className="font-display text-[1.15rem] text-halo-ink mb-0.5">Where people are</h2>
      <p className="text-[12.5px] text-halo-mist-body mb-4">
        Cumulative: everyone who reached at least that stage.
      </p>
      <div className="overflow-x-auto -mx-4 px-4">
        <table className="w-full text-[13.5px] min-w-[420px]">
          <thead>
            <tr className="text-left border-b border-halo-rule">
              <th className="font-ui text-[10px] font-semibold uppercase tracking-[0.12em] text-halo-mist-body pb-2 pr-4" />
              {rows.map(([label]) => (
                <th key={label} className="font-ui text-[10px] font-semibold uppercase tracking-[0.12em] text-halo-mist-body pb-2 pr-4">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[['Students', student], ['Mentors', mentor]].map(([name, f]) => (
              <tr key={name as string} className="border-b border-halo-rule last:border-0">
                <td className="py-2.5 pr-4 text-halo-ink font-medium">{name as string}</td>
                {rows.map(([, key]) => (
                  <td key={key} className="py-2.5 pr-4 tabular-nums text-halo-heather">
                    {(f as Funnel)[key] as number}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ── One person ──────────────────────────────────────────────────────────── */

function PersonDetail({
  p, onBack, onFlash, onFindMatch,
}: {
  p: PipelinePerson;
  partner?: PipelinePerson;
  onBack: () => void;
  onFlash: (m: string) => void;
  onFindMatch: () => void;
}) {
  const [notes, setNotes] = useState(p.operatorNotes ?? '');
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const act = (status: string) => {
    setError(null);
    start(async () => {
      const r = await setStage(p.applicationId, status);
      if (!r.ok) { setError(r.error); return; }
      const note =
        r.emailed === 'sent' ? ' Email sent.'
        : r.emailed === 'blocked' ? ' Email not sent — address is not on the allowlist.'
        : r.emailed === 'unconfigured' ? ' Email not sent — no provider configured.'
        : '';
      onFlash(r.message + note);
      onBack();
    });
  };

  const student = p.role === 'mentee';

  return (
    <div className="max-w-2xl">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-halo-heather hover:text-halo-ink transition-colors mb-5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Everyone
      </button>

      <header className="mb-6">
        <p className="font-ui text-[10px] font-semibold uppercase tracking-[0.12em] text-halo-mist-body">
          {student ? 'Student' : 'Mentor'} · {STAGE_LABEL[p.stage]}
        </p>
        <h1 className="font-display text-[1.75rem] leading-tight text-halo-ink mt-1">{p.fullName}</h1>
        <p className="text-[14px] text-halo-heather mt-1">
          {student
            ? [p.school, p.year, p.major].filter(Boolean).join(' · ')
            : [p.title, p.organization].filter(Boolean).join(' · ')}
        </p>
        <p className="text-[13px] text-halo-mist-body mt-1">
          Applied {new Date(p.appliedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
          {' · '}{p.email}
          {p.linkedinUrl && (
            <>
              {' · '}
              <a
                href={p.linkedinUrl.startsWith('http') ? p.linkedinUrl : `https://${p.linkedinUrl}`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-halo-brand-text underline underline-offset-2 hover:text-halo-ink"
              >
                LinkedIn <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            </>
          )}
        </p>
        {p.waitingOn && <p className="text-[14px] text-halo-ink mt-3 font-medium">{p.waitingOn}</p>}
      </header>

      <div className="space-y-5">
        {p.wants && (
          <Block label={student ? 'What they want help with' : 'Who they can help'}>{p.wants}</Block>
        )}
        {p.expertise && <Block label="Expertise">{p.expertise}</Block>}
        {p.context && (
          <Block label={student ? 'Where they are stuck' : 'Why they are mentoring'}>{p.context}</Block>
        )}
        {p.tried && (
          <Block label={student ? 'What they have already tried' : 'Prior involvement'}>{p.tried}</Block>
        )}
        {p.careerInterests.length > 0 && (
          <Block label="Career interests">{p.careerInterests.join(', ')}</Block>
        )}
        {p.accessSignals.length > 0 && (
          <Block label="Access signals, self-reported">
            {p.accessSignals.map((s) => s.replace(/_/g, ' ')).join(' · ')}
          </Block>
        )}
      </div>

      <div className="mt-7">
        <label htmlFor="op-notes" className="block text-[14px] font-medium text-halo-ink mb-2">
          Your notes
          <span className="font-normal text-halo-mist-body"> — only operators see this</span>
        </label>
        <textarea
          id="op-notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => { void saveNotes(p.applicationId, notes); }}
          className="w-full rounded-xl border border-halo-rule bg-white px-3.5 py-2.5 text-[14.5px] text-halo-ink leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-halo-purple"
        />
      </div>

      {error && <p role="alert" className="text-[13.5px] text-red-600 mt-4">{error}</p>}

      <div className="mt-6 flex flex-wrap gap-3">
        {p.stage === 'matching' && student && (
          <button
            onClick={onFindMatch}
            className="rounded-xl bg-halo-purple px-4 py-2.5 text-[14px] font-semibold text-white hover:bg-halo-purple-d transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple focus-visible:ring-offset-2"
          >
            Find a match
          </button>
        )}
        {p.mentorshipId && (
          <Link
            href={`/mentorship/${p.mentorshipId}`}
            className="rounded-xl border border-halo-rule px-4 py-2.5 text-[14px] font-medium text-halo-ink hover:bg-halo-veil transition-colors"
          >
            Open the mentorship
          </Link>
        )}
        {p.stage === 'applied' && (
          <Act label="Start reviewing" onClick={() => act('reviewing')} pending={pending} />
        )}
        {(p.stage === 'applied' || p.stage === 'reviewing' || p.stage === 'hold') && (
          <Act label="Select" primary onClick={() => act('accepted')} pending={pending} />
        )}
        {(p.stage === 'reviewing' || p.stage === 'applied') && (
          <Act label="Hold" onClick={() => act('hold')} pending={pending} />
        )}
        {p.stage !== 'declined' && !p.mentorshipId && (
          <Act label="Decline" onClick={() => act('declined')} pending={pending} />
        )}
      </div>
    </div>
  );
}

function Act({ label, onClick, pending, primary }: { label: string; onClick: () => void; pending: boolean; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={pending}
      className={`rounded-xl px-4 py-2.5 text-[14px] font-medium transition-colors disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple focus-visible:ring-offset-2 ${
        primary
          ? 'bg-halo-purple text-white font-semibold hover:bg-halo-purple-d'
          : 'border border-halo-rule text-halo-ink hover:bg-halo-veil'
      }`}
    >
      {label}
    </button>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-ui text-[10px] font-semibold uppercase tracking-[0.12em] text-halo-mist-body mb-1">{label}</p>
      <p className="text-[14.5px] text-halo-ink leading-relaxed whitespace-pre-line">{children}</p>
    </div>
  );
}

/* ── Matching ────────────────────────────────────────────────────────────── */

/**
 * Candidate comparison, then a rationale, then confirmation.
 *
 * NO SCORE AND NO RANKING BY A MODEL. The signals below are literal
 * overlaps between two sets of words the two people wrote themselves. If
 * there is no overlap the card says so rather than inventing a reason, and
 * the operator is free to pick that person anyway — they often should.
 */
function MatchFlow({
  student, mentors, cohortId, preselectedMentorId, onBack, onDone,
}: {
  student: PipelinePerson;
  mentors: PipelinePerson[];
  cohortId: string | null;
  preselectedMentorId: string | null;
  onBack: () => void;
  onDone: (msg: string) => void;
}) {
  const [chosen, setChosen] = useState<string | null>(preselectedMentorId);
  const [rationale, setRationale] = useState('');
  const [concerns, setConcerns] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const mentor = mentors.find((m) => m.applicationId === chosen) ?? null;

  const overlapsFor = (m: PipelinePerson) => {
    const want = [student.wants, student.context, student.careerInterests.join(' '), student.major]
      .filter(Boolean).join(' ').toLowerCase();
    const give = [m.expertise, m.wants, m.context, m.title, m.organization].filter(Boolean).join(' ').toLowerCase();
    const words = [...new Set(want.split(/[^a-z]+/).filter((w) => w.length > 4))];
    return words.filter((w) => give.includes(w));
  };

  const draft = (m: PipelinePerson) => {
    const hits = overlapsFor(m);
    const interest = student.careerInterests[0] ?? student.major ?? 'their goals';
    return `We paired ${student.fullName} with ${m.fullName} because ${student.fullName.split(' ')[0]} is pursuing ${interest}${
      student.wants ? ` and wants help with ${student.wants.replace(/\.$/, '').toLowerCase()}` : ''
    }. ${m.fullName.split(' ')[0]}'s experience${m.title ? ` as ${m.title}` : ''}${
      m.organization ? ` at ${m.organization}` : ''
    }${hits.length ? ` overlaps on ${hits.slice(0, 3).join(', ')}` : ''} and fits what they are trying to work out.`;
  };

  if (mentor && chosen) {
    return (
      <div className="max-w-2xl">
        <button onClick={() => setChosen(null)} className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-halo-heather hover:text-halo-ink transition-colors mb-5">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Other mentors
        </button>

        <h1 className="font-display text-[1.6rem] leading-tight text-halo-ink">
          {student.fullName} <span className="text-halo-mist-strong">+</span> {mentor.fullName}
        </h1>

        <dl className="mt-5 rounded-2xl bg-halo-veil border border-halo-rule p-4 space-y-2.5">
          <Pair k="Student" v={[student.school, student.year, student.major].filter(Boolean).join(' · ') || student.fullName} />
          <Pair k="Mentor" v={[mentor.title, mentor.organization].filter(Boolean).join(' · ') || mentor.fullName} />
          <Pair k="Mentor's current load" v="No other mentee in this cohort" />
        </dl>

        <div className="mt-6">
          <label htmlFor="rationale" className="block text-[14.5px] font-medium text-halo-ink mb-1.5">
            Why these two
          </label>
          <p className="text-[12.5px] text-halo-mist-body mb-2.5">
            Written now, read in May when we ask whether it worked. Edit freely.
          </p>
          <textarea
            id="rationale"
            rows={4}
            value={rationale || draft(mentor)}
            onChange={(e) => setRationale(e.target.value)}
            className="w-full rounded-xl border border-halo-rule bg-white px-3.5 py-2.5 text-[14.5px] text-halo-ink leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-halo-purple"
          />
        </div>

        <div className="mt-5">
          <label htmlFor="concerns" className="block text-[14.5px] font-medium text-halo-ink mb-1.5">
            What might not work
            <span className="font-normal text-halo-mist-body"> — optional, and worth a line</span>
          </label>
          <textarea
            id="concerns"
            rows={2}
            value={concerns}
            onChange={(e) => setConcerns(e.target.value)}
            placeholder="Different time zones. Mentor is senior and may pitch too high at first."
            className="w-full rounded-xl border border-halo-rule bg-white px-3.5 py-2.5 text-[14.5px] text-halo-ink leading-relaxed placeholder:text-halo-mist-strong resize-none focus:outline-none focus:ring-2 focus:ring-halo-purple"
          />
        </div>

        {error && <p role="alert" className="text-[13.5px] text-red-600 mt-4">{error}</p>}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            disabled={pending || !cohortId || !student.profileId || !mentor.profileId}
            onClick={() => {
              setError(null);
              if (!cohortId || !student.profileId || !mentor.profileId) {
                setError('Both people need an activated Mentable account before they can be matched.');
                return;
              }
              start(async () => {
                const r = await createMatch({
                  cohortId,
                  menteeProfileId: student.profileId!,
                  mentorProfileId: mentor.profileId!,
                  rationale: rationale || draft(mentor),
                  concerns,
                });
                if (!r.ok) { setError(r.error); return; }
                const note = r.emailed === 'sent' ? ' Introductions emailed.'
                  : r.emailed === 'blocked' ? ' Introductions not emailed — addresses not on the allowlist.'
                  : ' Introductions not emailed — no provider configured.';
                onDone(r.message + note);
              });
            }}
            className="rounded-xl bg-halo-purple px-5 py-2.5 text-[14.5px] font-semibold text-white disabled:opacity-40 hover:bg-halo-purple-d transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple focus-visible:ring-offset-2"
          >
            {pending ? 'Matching' : 'Confirm match'}
          </button>
          <button onClick={() => setChosen(null)} className="text-[13.5px] text-halo-heather hover:text-halo-ink transition-colors">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-halo-heather hover:text-halo-ink transition-colors mb-5">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {student.fullName}
      </button>

      <h1 className="font-display text-[1.6rem] leading-tight text-halo-ink">
        A mentor for {student.fullName}
      </h1>
      <p className="text-[14px] text-halo-heather mt-1.5 max-w-md">
        {student.wants ? `They want help with ${student.wants.replace(/\.$/, '').toLowerCase()}.` : 'No stated ask yet.'}
      </p>

      {mentors.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-halo-rule px-5 py-6">
          <p className="text-[15px] text-halo-ink">No mentor is ready yet.</p>
          <p className="text-[14px] text-halo-heather leading-relaxed mt-1.5 max-w-md">
            A mentor becomes matchable once they are selected and have accepted the
            commitment. Nobody has done both.
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {mentors.map((m) => {
            const hits = overlapsFor(m);
            return (
              <li key={m.applicationId} className="rounded-2xl border border-halo-rule p-4">
                <p className="text-[15px] font-medium text-halo-ink">{m.fullName}</p>
                <p className="text-[13.5px] text-halo-heather mt-0.5">
                  {[m.title, m.organization].filter(Boolean).join(' · ') || 'No role given'}
                </p>
                {m.wants && <p className="text-[13.5px] text-halo-heather leading-relaxed mt-2">{m.wants}</p>}

                <p className="font-ui text-[10px] font-semibold uppercase tracking-[0.12em] text-halo-mist-body mt-3 mb-1">
                  Why this could work
                </p>
                <p className="text-[13.5px] text-halo-ink leading-relaxed">
                  {hits.length > 0
                    ? `Both mention ${hits.slice(0, 3).join(', ')}.`
                    : 'Nothing in their answers overlaps directly. Your judgement, not the data.'}
                </p>

                <button
                  onClick={() => setChosen(m.applicationId)}
                  className="mt-4 rounded-xl border border-halo-rule px-4 py-2 text-[13.5px] font-medium text-halo-ink hover:bg-halo-veil transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple"
                >
                  Choose {m.fullName.split(' ')[0]}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Pair({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3">
      <dt className="font-ui text-[10px] font-semibold uppercase tracking-[0.12em] text-halo-mist-body w-32 flex-none">{k}</dt>
      <dd className="text-[14px] text-halo-ink flex-1 min-w-0">{v}</dd>
    </div>
  );
}
