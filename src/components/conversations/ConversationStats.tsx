import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  UserX 
} from 'lucide-react';
import { ConversationStats as StatsType } from '@/hooks/useConversationStats';

interface ConversationStatsProps {
  stats: StatsType;
  loading?: boolean;
}

export function ConversationStats({ stats, loading }: ConversationStatsProps) {
  const statCards = [
    {
      title: 'Conversas Ativas',
      value: stats.activeCount,
      icon: MessageSquare,
      description: 'Em andamento',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Encerradas Hoje',
      value: stats.endedTodayCount,
      icon: CheckCircle2,
      description: 'Finalizadas',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Tempo Médio',
      value: stats.averageResponseTime > 0 
        ? `${stats.averageResponseTime}min` 
        : '-',
      icon: Clock,
      description: 'De resposta',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Taxa de Transferência',
      value: `${stats.humanHandoffRate}%`,
      icon: UserX,
      description: 'Para humano',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
