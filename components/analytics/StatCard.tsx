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
      <div className="p-2.5 bg-navy-50 rounded-lg">
        <Icon className="h-6 w-6 text-navy-600" />
      </div>
      <div>
        <p className="text-2xl font-bold text-navy-900">{value}</p>
        <p className="text-sm text-gray-600">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </Card>
  );
}
