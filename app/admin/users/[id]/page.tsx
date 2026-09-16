import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin, rows, row } from '@/lib/supabase/admin';
import { Panel, Empty, Tag, Th, Td } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

interface Profile {
  id: string; first_name: string | null; last_name: string | null;
  role: 'mentor' | 'mentee'; headline: string | null; university: string | null;
  location: string | null;
  linkedin_url: string | null; graduation_year: number | null;
  created_at: string; is_demo: boolean; is_admin: boolean;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-2.5 border-b border-halo-rule last:border-0">
      <dt className="text-[12px] font-medium text-halo-heather">{label}</dt>
      <dd className="text-[14px] text-halo-ink mt-0.5">{value || <span className="text-halo-mist-body">Not set</span>}</dd>
    </div>
  );
}

export default async function AdminUserDetail({ params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin();
  if (!gate.ok) return null;
  const { db } = gate;
  const { id } = await params;

  const p = await row<Profile>(
    db.from('profiles')
      .select('id, first_name, last_name, role, headline, university, location, linkedin_url, graduation_year, created_at, is_demo, is_admin')
      .eq('id', id).single()
  );
  if (!p) notFound();

  const isMentor = p.role === 'mentor';

  const [ext, mentorships, requests, reportsAgainst] = await Promise.all([
    row<Record<string, unknown>>(
      db.from(isMentor ? 'mentor_profiles' : 'mentee_profiles').select('*').eq('id', id).single()
    ),
    rows<{ id: string; status: string; started_at: string; sessions_count: number; mentor_id: string; mentee_id: string }>(
      db.from('mentorships').select('id, status, started_at, sessions_count, mentor_id, mentee_id')
        .or(`mentor_id.eq.${id},mentee_id.eq.${id}`).order('started_at', { ascending: false }).limit(25)
    ),
    rows<{ id: string; status: string; created_at: string }>(
      db.from('mentorship_requests').select('id, status, created_at')
        .or(`mentor_id.eq.${id},mentee_id.eq.${id}`).order('created_at', { ascending: false }).limit(25)
    ),
    rows<{ id: string; reason: string; created_at: string }>(
      db.from('user_reports').select('id, reason, created_at').eq('reported_id', id)
    ),
  ]);

  const tags = (ext?.expertise_tags ?? ext?.interest_tags) as string[] | undefined;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div>
        <Link href="/admin/users" className="text-[13px] text-halo-heather hover:text-halo-ink">← Users</Link>
        <h1 className="font-display font-normal text-[1.75rem] leading-tight text-halo-ink mt-2">
          {p.first_name} {p.last_name}
        </h1>
        <div className="flex flex-wrap gap-1.5 mt-2">
          <Tag tone={isMentor ? 'blue' : 'neutral'}>{p.role}</Tag>
          {p.is_admin && <Tag tone="red">Admin</Tag>}
          {p.is_demo && <Tag>Demo</Tag>}
          {reportsAgainst.length > 0 && <Tag tone="amber">{reportsAgainst.length} report(s)</Tag>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Panel title="Profile">
          <dl className="px-4 py-1">
            <Field label="Headline" value={p.headline} />
            <Field label="University" value={p.university} />
            <Field label="Graduation year" value={p.graduation_year} />
            <Field label="Location" value={p.location} />
            <Field label="LinkedIn" value={
              p.linkedin_url
                ? <a href={p.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-halo-purple-d underline">Profile</a>
                : null} />
            <Field label="Joined" value={new Date(p.created_at).toLocaleString('en-US', { dateStyle: 'medium' })} />
          </dl>
        </Panel>

        <Panel title={isMentor ? 'Mentor details' : 'Mentee details'}>
          {!ext ? (
            <Empty>No {isMentor ? 'mentor' : 'mentee'} profile row yet.</Empty>
          ) : (
            <dl className="px-4 py-1">
              <Field label="Profile complete" value={ext.profile_complete ? 'Yes' : 'No'} />
              <Field label="Bio" value={(ext.bio as string) || null} />
              {isMentor && <Field label="Company" value={(ext.company as string) || null} />}
              {isMentor && <Field label="Title" value={(ext.title as string) || null} />}
              <Field label="Timezone" value={(ext.timezone as string) || null} />
              {isMentor ? (
                <>
                  <Field label="Available" value={ext.is_available ? 'Yes' : 'No'} />
                  <Field label="Years experience" value={String(ext.years_experience ?? '')} />
                  <Field label="Weekly hours" value={String(ext.weekly_hours ?? '')} />
                  <Field label="Rating" value={ext.review_count ? `${ext.rating} (${ext.review_count} reviews)` : null} />
                </>
              ) : (
                <Field label="Experience level" value={(ext.experience_level as string) || null} />
              )}
              <Field label={isMentor ? 'Expertise' : 'Interests'} value={
                tags?.length ? <span className="flex flex-wrap gap-1 mt-1">{tags.map((t) => <Tag key={t}>{t}</Tag>)}</span> : null
              } />
            </dl>
          )}
        </Panel>
      </div>

      <Panel title={`Mentorships (${mentorships.length})`}>
        {mentorships.length === 0 ? <Empty>None yet.</Empty> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px]">
              <thead className="bg-halo-veil border-b border-halo-rule">
                <tr><Th>Counterpart role</Th><Th>Status</Th><Th>Sessions</Th><Th>Started</Th></tr>
              </thead>
              <tbody className="divide-y divide-halo-rule">
                {mentorships.map((m) => (
                  <tr key={m.id}>
                    <Td>{m.mentor_id === id ? 'They mentor' : 'They are mentored'}</Td>
                    <Td><Tag tone={m.status === 'active' ? 'green' : 'neutral'}>{m.status}</Tag></Td>
                    <Td className="tabular-nums">{m.sessions_count}</Td>
                    <Td className="text-halo-heather tabular-nums">{new Date(m.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title={`Requests (${requests.length})`}>
        {requests.length === 0 ? <Empty>None yet.</Empty> : (
          <ul className="divide-y divide-halo-rule">
            {requests.map((r) => (
              <li key={r.id} className="px-4 py-2.5 flex items-center gap-3 text-[14px]">
                <Tag tone={r.status === 'pending' ? 'amber' : r.status === 'approved' ? 'green' : 'neutral'}>{r.status}</Tag>
                <span className="ml-auto text-halo-heather tabular-nums text-[13px]">
                  {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
