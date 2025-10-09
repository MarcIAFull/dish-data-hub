import { useMemo } from 'react';
import { Conversation } from './useConversationsCompat';
import { isToday, differenceInMinutes } from 'date-fns';

export interface ConversationStats {
  activeCount: number;
  endedTodayCount: number;
  averageResponseTime: number; // em minutos
  humanHandoffRate: number; // porcentagem
  totalCount: number;
}

export function useConversationStats(conversations: Conversation[]): ConversationStats {
  return useMemo(() => {
    const activeCount = conversations.filter(c => c.status === 'active').length;
    
    const endedTodayCount = conversations.filter(c => {
      return c.status === 'ended' && isToday(new Date(c.updated_at || c.created_at));
    }).length;

    // Calcular tempo médio de resposta (simplified - baseado em tempo de criação até atualização)
    const conversationsWithDuration = conversations
      .filter(c => c.updated_at && c.status !== 'active')
      .map(c => {
        const start = new Date(c.created_at);
        const end = new Date(c.updated_at!);
        return differenceInMinutes(end, start);
      });

    const averageResponseTime = conversationsWithDuration.length > 0
      ? Math.round(
          conversationsWithDuration.reduce((sum, time) => sum + time, 0) / 
          conversationsWithDuration.length
        )
      : 0;

    // Taxa de transferência para humano
    const handoffCount = conversations.filter(c => c.status === 'human_handoff').length;
    const humanHandoffRate = conversations.length > 0
      ? Math.round((handoffCount / conversations.length) * 100)
      : 0;

    return {
      activeCount,
      endedTodayCount,
      averageResponseTime,
      humanHandoffRate,
      totalCount: conversations.length
    };
  }, [conversations]);
}
