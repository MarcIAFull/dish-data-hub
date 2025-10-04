import { ConversationsDashboard } from '@/components/conversations/ConversationsDashboard';
import { useGlobalFilters } from '@/hooks/useGlobalFilters';

export default function Conversations() {
  const { filters } = useGlobalFilters();
  const selectedRestaurantId = filters.selectedRestaurants[0];

  return (
    <div className="container mx-auto p-8">
      <ConversationsDashboard restaurantId={selectedRestaurantId || undefined} />
    </div>
  );
}
