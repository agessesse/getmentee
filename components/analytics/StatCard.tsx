import Card from '@/components/ui/Card';

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  value: string | number;
  label: string;
  sub?: string;
}

export default function StatCard({ icon: Icon, value, label, sub }: StatCardProps) {
  return (
    <Card className="flex items-start gap-4">
      <div className="p-2.5 bg-halo-veil rounded-lg">
        <Icon className="h-6 w-6 text-halo-purple-d" />
      </div>
      <div>
        <p className="font-display text-[2rem] leading-none text-halo-ink tabular-nums">{value}</p>
        <p className="text-sm text-halo-heather">{label}</p>
        {sub && <p className="text-xs text-halo-mist-body mt-0.5">{sub}</p>}
      </div>
    </Card>
  );
}
