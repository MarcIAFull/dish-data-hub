import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MetadataViewerProps {
  chatId: number;
  metadata: any;
  onUpdate: () => void;
}

export function MetadataViewer({ chatId, metadata, onUpdate }: MetadataViewerProps) {
  const [editedMetadata, setEditedMetadata] = useState(JSON.stringify(metadata || {}, null, 2));
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(editedMetadata);
    toast({
      title: 'JSON copiado',
      description: 'Metadata copiada para a área de transferência'
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const parsed = JSON.parse(editedMetadata);
      
      const { error } = await supabase
        .from('chats')
        .update({ metadata: parsed })
        .eq('id', chatId);

      if (error) throw error;

      toast({
        title: 'Metadata atualizada',
        description: 'As alterações foram salvas com sucesso'
      });
      
      onUpdate();
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const renderStructuredView = () => {
    try {
      const data = JSON.parse(editedMetadata);
      
      return (
        <div className="space-y-6">
          {/* Dados do Cliente */}
          {(data.customer_name || data.delivery_address) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📝 Dados do Cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.customer_name && (
                  <div>
                    <span className="text-sm font-medium">Nome:</span>
                    <span className="ml-2 text-sm text-muted-foreground">{data.customer_name}</span>
                  </div>
                )}
                {data.delivery_address && (
                  <div>
                    <span className="text-sm font-medium">Endereço:</span>
                    <span className="ml-2 text-sm text-muted-foreground">{data.delivery_address}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Endereço */}
          {(data.validated_address_token || data.delivery_fee) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📍 Endereço e Entrega</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.validated_address_token && (
                  <div>
                    <span className="text-sm font-medium">Token:</span>
                    <Badge variant="outline" className="ml-2">
                      {data.validated_address_token}
                    </Badge>
                  </div>
                )}
                {data.delivery_fee !== undefined && (
                  <div>
                    <span className="text-sm font-medium">Taxa de entrega:</span>
                    <span className="ml-2 text-sm text-muted-foreground">
                      R$ {data.delivery_fee.toFixed(2)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Itens do Pedido */}
          {data.order_items && data.order_items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">🛒 Itens do Pedido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.order_items.map((item: any, index: number) => (
                    <div key={index} className="border-b pb-3 last:border-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-sm">
                            {item.quantity}x {item.product_name}
                          </div>
                          {item.modifiers && item.modifiers.length > 0 && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Modificadores: {item.modifiers.map((m: any) => m.name).join(', ')}
                            </div>
                          )}
                          {item.notes && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Obs: {item.notes}
                            </div>
                          )}
                        </div>
                        <div className="text-sm font-medium">
                          R$ {(item.unit_price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {data.order_total !== undefined && (
                    <div className="flex justify-between items-center pt-3 border-t-2">
                      <span className="font-bold">Total:</span>
                      <span className="font-bold text-lg">
                        R$ {data.order_total.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pagamento */}
          {data.payment_method && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">💳 Pagamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <span className="text-sm font-medium">Método:</span>
                  <Badge variant="outline" className="ml-2">
                    {data.payment_method}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      );
    } catch (error) {
      return (
        <div className="text-destructive text-sm">
          Erro ao renderizar: JSON inválido
        </div>
      );
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Metadata Viewer</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="h-4 w-4 mr-2" />
              Copiar JSON
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleSave}
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <div className="grid grid-cols-2 gap-4 h-full">
          {/* Visualização estruturada */}
          <ScrollArea className="h-full pr-4">
            <h3 className="font-semibold mb-4">Visualização Estruturada</h3>
            {renderStructuredView()}
          </ScrollArea>

          {/* Editor JSON */}
          <div className="h-full flex flex-col">
            <h3 className="font-semibold mb-4">Editor JSON</h3>
            <textarea
              value={editedMetadata}
              onChange={(e) => setEditedMetadata(e.target.value)}
              className="flex-1 font-mono text-xs p-4 border rounded-md bg-background resize-none"
              spellCheck={false}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
