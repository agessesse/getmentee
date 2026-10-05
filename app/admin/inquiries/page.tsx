import { requireAdmin, rows } from '@/lib/supabase/admin';
import { Panel, Empty, Tag } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

/**
 * Organization inquiries from /organizations.
 *
 * Platform-admin surface: these are inbound notes to Mentable itself, not to
 * any one organisation, so they belong here and not in /organization.
 */

interface Inquiry {
  id: string;
  full_name: string;
  email: string;
  organization: string;
  title: string | null;
  community: string | null;
  participants: string | null;
  goal: string | null;
  status: string;
  created_at: string;
}

export default async function AdminInquiries() {
  const gate = await requireAdmin();
  if (!gate.ok) return null;

  const items = await rows<Inquiry>(
    gate.db
      .from('organization_inquiries')
      .select('id, full_name, email, organization, title, community, participants, goal, status, created_at')
      .order('created_at', { ascending: false }),
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display font-normal text-2xl leading-tight text-halo-ink">Organization inquiries</h1>
        <p className="text-[14px] text-halo-heather mt-1">
          {items.length === 0 ? 'Nothing yet.' : `${items.length} ${items.length === 1 ? 'inquiry' : 'inquiries'}, newest first.`}
        </p>
      </div>

      {items.length === 0 ? (
        <Panel title="Nothing to read">
          <Empty>Submissions from /organizations appear here.</Empty>
        </Panel>
      ) : (
        items.map((q) => (
          <Panel
            key={q.id}
            title={q.organization}
            action={
              <span className="text-[12px] text-halo-mist-body">
                {new Date(q.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            }
          >
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-halo-heather">
                <span className="text-halo-ink font-medium">{q.full_name}</span>
                <a href={`mailto:${q.email}`} className="text-halo-purple-d hover:text-halo-ink">{q.email}</a>
                {q.title && <span>{q.title}</span>}
                {q.participants && <span>{q.participants}</span>}
                <Tag tone="neutral">{q.status}</Tag>
              </div>
              {q.community && (
                <p className="text-[14px] text-halo-ink leading-relaxed">
                  <span className="text-halo-mist-body">Connecting: </span>{q.community}
                </p>
              )}
              {q.goal && (
                <div>
                  <p className="font-ui text-[10.5px] font-semibold uppercase tracking-[0.14em] text-halo-mist-body mb-1">
                    What they want to accomplish
                  </p>
                  <p className="text-[14px] text-halo-ink leading-relaxed whitespace-pre-line">{q.goal}</p>
                </div>
              )}
            </div>
          </Panel>
        ))
      )}
    </div>
  );
}
