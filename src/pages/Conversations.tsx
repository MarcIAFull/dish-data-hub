import { useState } from 'react';
import { useGlobalFilters } from '@/hooks/useGlobalFilters';
import { useInfiniteConversations } from '@/hooks/useInfiniteConversations';
import { useConversationFilters } from '@/hooks/useConversationFilters';
import { ConversationsList } from '@/components/conversations/ConversationsList';
import { ChatWindow } from '@/components/conversations/ChatWindow';
import { markAsRead } from '@/hooks/useConversationsCompat';
import type { Conversation } from '@/hooks/useConversationsCompat';

type FilterMode = 'all' | 'ai' | 'human' | 'ended';

export default function Conversations() {
  const { filters } = useGlobalFilters();
  const selectedRestaurantId = filters.selectedRestaurants[0];
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');

  const handleSelectConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    await markAsRead(conversation.id);
  };

  const { 
    conversations, 
    loading, 
    updateStatus 
  } = useInfiniteConversations(selectedRestaurantId, handleSelectConversation);

  const {
    searchTerm,
    setSearchTerm,
    filteredConversations
  } = useConversationFilters(conversations);

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Sidebar de conversas */}
      <div className="w-[400px] flex-shrink-0">
        <ConversationsList
          conversations={filteredConversations}
          selectedId={selectedConversation?.id}
          onSelect={handleSelectConversation}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterMode={filterMode}
          onFilterChange={setFilterMode}
        />
      </div>

      {/* Área de chat */}
      <ChatWindow
        conversation={selectedConversation}
        onStatusChange={updateStatus}
      />
    </div>
  );
}
