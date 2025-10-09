import { useState, useMemo } from 'react';
import { Conversation } from './useConversationsCompat';
import { DateRange } from 'react-day-picker';
import { isWithinInterval } from 'date-fns';

export interface ConversationFilters {
  searchTerm: string;
  statuses: string[];
  dateRange?: DateRange;
}

export function useConversationFilters(conversations: Conversation[]) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const filteredConversations = useMemo(() => {
    return conversations.filter((conv) => {
      // Filtro de busca (telefone)
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesPhone = conv.phone?.toLowerCase().includes(search);
        if (!matchesPhone) return false;
      }

      // Filtro de status
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(conv.status)) {
        return false;
      }

      // Filtro de período
      if (dateRange?.from) {
        const convDate = new Date(conv.created_at);
        const from = dateRange.from;
        const to = dateRange.to || new Date();
        
        if (!isWithinInterval(convDate, { start: from, end: to })) {
          return false;
        }
      }

      return true;
    });
  }, [conversations, searchTerm, selectedStatuses, dateRange]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedStatuses([]);
    setDateRange(undefined);
  };

  const hasActiveFilters = !!(searchTerm || selectedStatuses.length > 0 || dateRange?.from);

  return {
    searchTerm,
    setSearchTerm,
    selectedStatuses,
    setSelectedStatuses,
    dateRange,
    setDateRange,
    filteredConversations,
    clearFilters,
    hasActiveFilters
  };
}
