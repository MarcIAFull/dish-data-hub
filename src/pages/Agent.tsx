import { EnhancedAgentConfiguration } from '@/components/agent/EnhancedAgentConfiguration';
import { useGlobalFilters } from '@/hooks/useGlobalFilters';

export default function Agent() {
  const { filters } = useGlobalFilters();
  const selectedRestaurantId = filters.selectedRestaurants[0];

  if (!selectedRestaurantId) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Selecione um Restaurante</h2>
          <p className="text-muted-foreground">
            Selecione um restaurante no filtro acima para configurar o agente IA
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Configuração do Agente IA</h1>
        <p className="text-muted-foreground mt-2">
          Configure o comportamento e personalidade do seu assistente virtual
        </p>
      </div>
      <EnhancedAgentConfiguration restaurantId={selectedRestaurantId} />
    </div>
  );
}
