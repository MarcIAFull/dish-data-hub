import { useState } from 'react';
import { useGlobalFilters } from '@/hooks/useGlobalFilters';
import { useInfiniteConversations } from '@/hooks/useInfiniteConversations';
import { useConversationFilters } from '@/hooks/useConversationFilters';
import { ConversationsList } from '@/components/conversations/ConversationsList';
import { ConversationsLayout } from '@/components/conversations/ConversationsLayout';
import { ChatWindow } from '@/components/conversations/ChatWindow';
import { markAsRead } from '@/hooks/useConversationsCompat';
import type { Conversation } from '@/hooks/useConversationsCompat';

type FilterMode = 'all' | 'ai' | 'human' | 'ended';

export default function Conversations() {
  const { filters, restaurants } = useGlobalFilters();
  const selectedRestaurantId = filters.selectedRestaurants[0];
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [selectedRestaurantFilter, setSelectedRestaurantFilter] = useState<string | null>(null);

  const handleSelectConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    await markAsRead(conversation.id);
  };

  const { 
    conversations, 
    loading, 
    updateStatus,
    refresh
  } = useInfiniteConversations(selectedRestaurantId, handleSelectConversation);

  const {
    searchTerm,
    setSearchTerm,
    filteredConversations
  } = useConversationFilters(conversations);

  // Aplicar filtro por restaurante
  const restaurantFilteredConversations = selectedRestaurantFilter
    ? filteredConversations.filter(c => c.restaurant?.id === selectedRestaurantFilter)
    : filteredConversations;

  return (
    <ConversationsLayout
      sidebar={
        <ConversationsList
          conversations={restaurantFilteredConversations}
          selectedId={selectedConversation?.id}
          onSelect={handleSelectConversation}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterMode={filterMode}
          onFilterChange={setFilterMode}
          restaurants={restaurants}
          selectedRestaurantFilter={selectedRestaurantFilter}
          onRestaurantFilterChange={setSelectedRestaurantFilter}
        />
      }
      chatWindow={
        <ChatWindow
          conversation={selectedConversation}
          onStatusChange={updateStatus}
          onRefresh={refresh}
        />
      }
    />
  );
}
