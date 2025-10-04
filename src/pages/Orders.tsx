import { OrdersDashboard } from '@/components/orders/OrdersDashboard';
import { useGlobalFilters } from '@/hooks/useGlobalFilters';

export default function Orders() {
  const { filters } = useGlobalFilters();
  const selectedRestaurantId = filters.selectedRestaurants[0];

  return (
    <div className="container mx-auto p-8">
      <OrdersDashboard restaurantId={selectedRestaurantId || undefined} />
    </div>
  );
}
