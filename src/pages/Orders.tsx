import { OrdersKanban } from '@/components/orders/OrdersKanban';
import { useGlobalFilters } from '@/hooks/useGlobalFilters';

export default function Orders() {
  const { filters } = useGlobalFilters();
  const selectedRestaurantId = filters.selectedRestaurants[0];

  if (!selectedRestaurantId) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Selecione um Restaurante</h2>
          <p className="text-muted-foreground">
            Selecione um restaurante no filtro acima para visualizar os pedidos
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <OrdersKanban restaurantId={selectedRestaurantId} />
    </div>
  );
}
