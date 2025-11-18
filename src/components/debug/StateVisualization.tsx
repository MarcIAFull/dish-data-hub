import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, ArrowRight, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface StateVisualizationProps {
  chatId: number;
  currentState: string;
  metadata: any;
}

const STATES = [
  { key: 'greeting', label: 'Saudação', icon: '👋' },
  { key: 'discovery', label: 'Descoberta', icon: '🔍' },
  { key: 'browsing_menu', label: 'Menu', icon: '📋' },
  { key: 'presentation', label: 'Apresentação', icon: '🎁' },
  { key: 'upsell', label: 'Upsell', icon: '⬆️' },
  { key: 'logistics', label: 'Logística', icon: '📦' },
  { key: 'address', label: 'Endereço', icon: '📍' },
  { key: 'payment', label: 'Pagamento', icon: '💳' },
  { key: 'summary', label: 'Resumo', icon: '📝' },
  { key: 'confirmed', label: 'Confirmado', icon: '✅' },
  { key: 'completed', label: 'Completo', icon: '🎉' }
];

export function StateVisualization({ chatId, currentState, metadata }: StateVisualizationProps) {
  const [stateHistory, setStateHistory] = useState<any[]>([]);

  useEffect(() => {
    if (metadata?.state_history) {
      setStateHistory(metadata.state_history);
    }
  }, [metadata]);

  const getStateColor = (state: string) => {
    const colors: Record<string, string> = {
      greeting: 'bg-blue-100 text-blue-800 border-blue-400 dark:bg-blue-950 dark:text-blue-300',
      discovery: 'bg-purple-100 text-purple-800 border-purple-400 dark:bg-purple-950 dark:text-purple-300',
      browsing_menu: 'bg-yellow-100 text-yellow-800 border-yellow-400 dark:bg-yellow-950 dark:text-yellow-300',
      presentation: 'bg-orange-100 text-orange-800 border-orange-400 dark:bg-orange-950 dark:text-orange-300',
      upsell: 'bg-pink-100 text-pink-800 border-pink-400 dark:bg-pink-950 dark:text-pink-300',
      logistics: 'bg-cyan-100 text-cyan-800 border-cyan-400 dark:bg-cyan-950 dark:text-cyan-300',
      address: 'bg-teal-100 text-teal-800 border-teal-400 dark:bg-teal-950 dark:text-teal-300',
      payment: 'bg-green-100 text-green-800 border-green-400 dark:bg-green-950 dark:text-green-300',
      summary: 'bg-indigo-100 text-indigo-800 border-indigo-400 dark:bg-indigo-950 dark:text-indigo-300',
      confirmed: 'bg-emerald-100 text-emerald-800 border-emerald-400 dark:bg-emerald-950 dark:text-emerald-300',
      completed: 'bg-green-200 text-green-900 border-green-600 dark:bg-green-900 dark:text-green-100'
    };
    return colors[state] || 'bg-gray-100 text-gray-800 border-gray-400 dark:bg-gray-950 dark:text-gray-300';
  };

  const getStateStatus = (stateKey: string) => {
    const currentIndex = STATES.findIndex(s => s.key === currentState);
    const stateIndex = STATES.findIndex(s => s.key === stateKey);
    
    if (stateIndex < currentIndex) return 'completed';
    if (stateIndex === currentIndex) return 'current';
    return 'future';
  };

  const getTimeInState = (stateKey: string) => {
    const transition = stateHistory?.find((h: any) => h.to === stateKey);
    if (!transition) return null;

    const nextTransition = stateHistory?.find((h: any) => h.from === stateKey);
    if (!nextTransition) {
      // Estado atual
      const duration = Date.now() - new Date(transition.changed_at).getTime();
      return Math.floor(duration / 1000);
    }

    const duration = new Date(nextTransition.changed_at).getTime() - new Date(transition.changed_at).getTime();
    return Math.floor(duration / 1000);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Fluxo de Estados</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {/* Diagrama de fluxo horizontal */}
        <div className="flex items-center gap-2 mb-8 pb-4">
          {STATES.map((state, index) => {
            const status = getStateStatus(state.key);
            const timeInState = getTimeInState(state.key);

            return (
              <div key={state.key} className="flex items-center">
                <Card
                  className={`
                    min-w-[140px] border-2 transition-all
                    ${getStateColor(state.key)}
                    ${status === 'current' ? 'ring-4 ring-primary animate-pulse scale-110' : ''}
                    ${status === 'completed' ? 'opacity-60' : ''}
                    ${status === 'future' ? 'opacity-30' : ''}
                  `}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center text-center">
                      <div className="text-2xl mb-2">{state.icon}</div>
                      <div className="font-semibold text-sm mb-1">{state.label}</div>
                      {status === 'completed' && (
                        <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                      )}
                      {timeInState !== null && (
                        <div className="flex items-center gap-1 text-xs mt-2 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {timeInState}s
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                {index < STATES.length - 1 && (
                  <ArrowRight className="h-6 w-6 text-muted-foreground mx-2" />
                )}
              </div>
            );
          })}
        </div>

        {/* Histórico de transições */}
        {stateHistory && stateHistory.length > 0 && (
          <div className="mt-8">
            <h3 className="font-semibold mb-4">Histórico de Transições</h3>
            <div className="space-y-2">
              {stateHistory.map((transition: any, index: number) => (
                <Card key={index}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge className={getStateColor(transition.from || 'unknown')}>
                          {transition.from || 'início'}
                        </Badge>
                        <ArrowRight className="h-4 w-4" />
                        <Badge className={getStateColor(transition.to)}>
                          {transition.to}
                        </Badge>
                        {transition.changed_by && (
                          <span className="text-xs text-muted-foreground">
                            por {transition.changed_by}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {transition.changed_at && format(
                          new Date(transition.changed_at),
                          "dd/MM/yyyy 'às' HH:mm:ss",
                          { locale: ptBR }
                        )}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {(!stateHistory || stateHistory.length === 0) && (
          <div className="text-center py-8 text-muted-foreground">
            Sem histórico de transições disponível
          </div>
        )}
      </CardContent>
    </Card>
  );
}
