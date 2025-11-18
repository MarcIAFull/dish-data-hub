import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send, Trash2, Save, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MessageTesterProps {
  chatId: number;
  phone: string;
  agentId?: string;
}

interface TestResult {
  status: 'success' | 'error';
  response?: string;
  toolCalls?: any[];
  executionTime?: number;
  error?: string;
}

const FAVORITE_MESSAGES = [
  'Quero fazer um pedido',
  'Qual é o cardápio?',
  'Quanto custa a entrega?',
  'Confirmo o pedido',
  'Não quero mais',
  'Cancelar pedido'
];

export function MessageTester({ chatId, phone, agentId }: MessageTesterProps) {
  const [message, setMessage] = useState('');
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const { toast } = useToast();

  const handleSendTest = async () => {
    if (!message.trim()) {
      toast({
        title: 'Mensagem vazia',
        description: 'Digite uma mensagem para testar',
        variant: 'destructive'
      });
      return;
    }

    try {
      setTesting(true);
      setResult(null);
      
      const startTime = Date.now();

      // Simular envio de mensagem para o webhook
      // Na prática, você chamaria a função send-whatsapp-message aqui
      const response = await fetch('/api/webhook-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId,
          phone,
          message,
          agentId
        })
      });

      const data = await response.json();
      const executionTime = Date.now() - startTime;

      setResult({
        status: response.ok ? 'success' : 'error',
        response: data.response,
        toolCalls: data.toolCalls,
        executionTime,
        error: data.error
      });

      if (response.ok) {
        toast({
          title: 'Teste enviado',
          description: 'Mensagem processada com sucesso'
        });
      }
    } catch (error: any) {
      setResult({
        status: 'error',
        error: error.message
      });
      toast({
        title: 'Erro ao enviar teste',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleClear = () => {
    setMessage('');
    setResult(null);
  };

  const handleUseFavorite = (fav: string) => {
    setMessage(fav);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>🧪 Testador de Mensagens</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Informações do chat */}
        <Card className="bg-muted/50">
          <CardContent className="p-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-medium">Chat ID:</span>
                <span className="ml-2 text-muted-foreground">{chatId}</span>
              </div>
              <div>
                <span className="font-medium">Telefone:</span>
                <span className="ml-2 text-muted-foreground">{phone}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mensagens favoritas */}
        <div>
          <label className="text-sm font-medium mb-2 block">Mensagens Rápidas:</label>
          <div className="flex flex-wrap gap-2">
            {FAVORITE_MESSAGES.map((fav) => (
              <Button
                key={fav}
                variant="outline"
                size="sm"
                onClick={() => handleUseFavorite(fav)}
              >
                {fav}
              </Button>
            ))}
          </div>
        </div>

        {/* Input da mensagem */}
        <div>
          <label className="text-sm font-medium mb-2 block">Mensagem:</label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Digite a mensagem de teste..."
            className="min-h-[120px]"
          />
        </div>

        {/* Botões de ação */}
        <div className="flex gap-2">
          <Button
            onClick={handleSendTest}
            disabled={testing || !message.trim()}
            className="flex-1"
          >
            <Send className="h-4 w-4 mr-2" />
            {testing ? 'Enviando...' : 'Enviar Teste'}
          </Button>
          <Button
            variant="outline"
            onClick={handleClear}
            disabled={testing}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Limpar
          </Button>
        </div>

        {/* Resultado */}
        {result && (
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Resultado do Teste</CardTitle>
                <div className="flex items-center gap-3">
                  {result.executionTime && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {result.executionTime}ms
                    </div>
                  )}
                  <Badge
                    variant={result.status === 'success' ? 'default' : 'destructive'}
                  >
                    {result.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.response && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Resposta da IA:</h4>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm">{result.response}</p>
                  </div>
                </div>
              )}

              {result.toolCalls && result.toolCalls.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">
                    Tool Calls: {result.toolCalls.length}
                  </h4>
                  <div className="space-y-2">
                    {result.toolCalls.map((tool, index) => (
                      <div key={index} className="p-2 bg-muted rounded-md">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-xs">
                            {tool.function?.name || tool.name}
                          </Badge>
                          {tool.success && (
                            <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">
                              Success
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.error && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-destructive">Erro:</h4>
                  <pre className="p-3 bg-destructive/10 rounded-md text-xs text-destructive overflow-x-auto">
                    {result.error}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Aviso */}
        <Card className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
          <CardContent className="p-3">
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              ⚠️ <strong>Atenção:</strong> O teste envia mensagens reais para o sistema de IA.
              Use com cuidado para não criar pedidos duplicados ou confusões no atendimento.
            </p>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
