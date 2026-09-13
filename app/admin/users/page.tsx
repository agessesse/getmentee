import Link from 'next/link';
import { requireAdmin, rows } from '@/lib/supabase/admin';
import { Panel, Empty, Tag, Th, Td } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;

interface Row {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: 'mentor' | 'mentee';
  university: string | null;
  company: string | null;
  headline: string | null;
  created_at: string;
  is_demo: boolean;
  is_admin: boolean;
}

export default async function AdminUsers({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; q?: string; page?: string; status?: string }>;
}) {
  const gate = await requireAdmin();
  if (!gate.ok) return null;
  const { db } = gate;

  const sp = await searchParams;
  const role = sp.role === 'mentor' || sp.role === 'mentee' ? sp.role : undefined;
  const q = (sp.q ?? '').trim();
  const status = sp.status === 'complete' || sp.status === 'incomplete' ? sp.status : undefined;
  const page = Math.max(1, Number(sp.page) || 1);
  const from = (page - 1) * PAGE_SIZE;

  let query = db
    .from('profiles')
    .select('id, first_name, last_name, role, university, company, headline, created_at, is_demo, is_admin',
            { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (role) query = query.or(`role.eq.${role}`);
  if (q) {
    // Escape commas and parentheses: PostgREST `or` uses them as syntax.
    const safe = q.replace(/[,()]/g, ' ');
    query = query.or(
      `first_name.ilike.%${safe}%,last_name.ilike.%${safe}%,university.ilike.%${safe}%,company.ilike.%${safe}%`
    );
  }

  const { count } = await db
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  const users = await rows<Row>(query);

  // Profile completion lives on the role-specific tables, so resolve it in one
  // extra pair of queries rather than per row.
  const ids = users.map((u) => u.id);
  const [mentorDone, menteeDone] = ids.length
    ? await Promise.all([
        rows<{ id: string }>(db.from('mentor_profiles').select('id').in('id', ids).eq('profile_complete', true)),
        rows<{ id: string }>(db.from('mentee_profiles').select('id').in('id', ids).eq('profile_complete', true)),
      ])
    : [[], []];
  const complete = new Set([...mentorDone, ...menteeDone].map((r) => r.id));

  const visible = status
    ? users.filter((u) => (status === 'complete' ? complete.has(u.id) : !complete.has(u.id)))
    : users;

  const qs = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { role, q: q || undefined, status, page: String(page), ...patch };
    for (const [k, v] of Object.entries(merged)) if (v && v !== '1') p.set(k, v);
    const s = p.toString();
    return s ? `/admin/users?${s}` : '/admin/users';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div>
        <h1 className="text-[20px] font-semibold text-navy-900">Users</h1>
        <p className="text-[14px] text-gray-600 mt-1">
          {count ?? 0} total. Email is deliberately not shown here; migration 0018
          revoked read access to it to keep addresses out of the app surface.
        </p>
      </div>

      <form method="GET" action="/admin/users" className="flex flex-wrap gap-2 items-end">
        <div>
          <label htmlFor="q" className="block text-[12px] font-medium text-gray-700 mb-1">Search</label>
          <input
            id="q" name="q" defaultValue={q} placeholder="Name, school, or company"
            className="h-9 w-64 max-w-full rounded-md border border-gray-300 px-3 text-[14px] text-navy-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-navy-500"
          />
        </div>
        <div>
          <label htmlFor="role" className="block text-[12px] font-medium text-gray-700 mb-1">Role</label>
          <select id="role" name="role" defaultValue={role ?? ''}
            className="h-9 rounded-md border border-gray-300 px-2 text-[14px] text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-500">
            <option value="">All</option>
            <option value="mentor">Mentor</option>
            <option value="mentee">Mentee</option>
          </select>
        </div>
        <div>
          <label htmlFor="status" className="block text-[12px] font-medium text-gray-700 mb-1">Profile</label>
          <select id="status" name="status" defaultValue={status ?? ''}
            className="h-9 rounded-md border border-gray-300 px-2 text-[14px] text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-500">
            <option value="">Any</option>
            <option value="complete">Complete</option>
            <option value="incomplete">Incomplete</option>
          </select>
        </div>
        <button type="submit"
          className="h-9 px-4 rounded-md bg-navy-900 text-white text-[14px] font-medium hover:bg-navy-800 focus:outline-none focus:ring-2 focus:ring-navy-500">
          Apply
        </button>
        {(q || role || status) && (
          <Link href="/admin/users" className="h-9 inline-flex items-center px-3 text-[14px] text-gray-700 hover:text-navy-900">
            Clear
          </Link>
        )}
      </form>

      <Panel title={`Showing ${visible.length}`}>
        {visible.length === 0 ? (
          <Empty>No users match these filters.</Empty>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <Th>Name</Th><Th>Role</Th><Th>Affiliation</Th><Th>Profile</Th><Th>Flags</Th><Th>Joined</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {visible.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <Td>
                        <Link href={`/admin/users/${u.id}`} className="font-medium hover:underline">
                          {u.first_name} {u.last_name}
                        </Link>
                        {u.headline && <div className="text-[12px] text-gray-600 mt-0.5 truncate max-w-[220px]">{u.headline}</div>}
                      </Td>
                      <Td><Tag tone={u.role === 'mentor' ? 'blue' : 'neutral'}>{u.role}</Tag></Td>
                      <Td className="text-gray-700">{u.university || u.company || 'Not set'}</Td>
                      <Td>{complete.has(u.id)
                        ? <Tag tone="green">Complete</Tag>
                        : <Tag tone="amber">Incomplete</Tag>}</Td>
                      <Td>
                        <span className="flex gap-1">
                          {u.is_admin && <Tag tone="red">Admin</Tag>}
                          {u.is_demo && <Tag>Demo</Tag>}
                          {!u.is_admin && !u.is_demo && <span className="text-gray-500 text-[13px]">None</span>}
                        </span>
                      </Td>
                      <Td className="text-gray-700 tabular-nums whitespace-nowrap">
                        {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile list: a 6-column table is unreadable under 768px */}
            <ul className="md:hidden divide-y divide-gray-100">
              {visible.map((u) => (
                <li key={u.id} className="p-4">
                  <Link href={`/admin/users/${u.id}`} className="font-medium text-[15px] hover:underline">
                    {u.first_name} {u.last_name}
                  </Link>
                  <p className="text-[13px] text-gray-700 mt-1">{u.university || u.company || 'Not set'}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <Tag tone={u.role === 'mentor' ? 'blue' : 'neutral'}>{u.role}</Tag>
                    {complete.has(u.id) ? <Tag tone="green">Complete</Tag> : <Tag tone="amber">Incomplete</Tag>}
                    {u.is_admin && <Tag tone="red">Admin</Tag>}
                    {u.is_demo && <Tag>Demo</Tag>}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </Panel>

      <div className="flex items-center gap-3">
        {page > 1 && (
          <Link href={qs({ page: String(page - 1) })}
            className="h-9 inline-flex items-center px-3 rounded-md border border-gray-300 bg-white text-[14px] hover:border-navy-300">
            Previous
          </Link>
        )}
        {users.length === PAGE_SIZE && (
          <Link href={qs({ page: String(page + 1) })}
            className="h-9 inline-flex items-center px-3 rounded-md border border-gray-300 bg-white text-[14px] hover:border-navy-300">
            Next
          </Link>
        )}
        <span className="text-[13px] text-gray-600">Page {page}</span>
      </div>
    </div>
  );
}
