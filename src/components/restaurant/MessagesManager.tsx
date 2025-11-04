import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { MessageSquare, Edit2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CustomMessage {
  id: string;
  message_type: string;
  message_text: string;
  is_active: boolean;
}

interface MessagesManagerProps {
  restaurantId: string;
}

const MESSAGE_TYPES = [
  {
    type: "greeting",
    label: "Saudação Inicial",
    description: "Primeira mensagem quando o cliente inicia o atendimento",
    default: "Olá! Bem-vindo ao nosso restaurante. Como posso ajudar você hoje?",
  },
  {
    type: "order_confirmation",
    label: "Confirmação de Pedido",
    description: "Mensagem após o pedido ser confirmado",
    default: "✅ Pedido confirmado! Já estamos preparando com carinho.",
  },
  {
    type: "thank_you",
    label: "Agradecimento Final",
    description: "Mensagem de despedida após finalizar o atendimento",
    default: "Obrigado pela preferência! Até a próxima! 😊",
  },
  {
    type: "closed",
    label: "Fora de Horário",
    description: "Mensagem quando o restaurante está fechado",
    default: "Desculpe, estamos fechados no momento. Voltamos amanhã!",
  },
  {
    type: "unavailable",
    label: "Indisponibilidade Temporária",
    description: "Mensagem para momentos de pausa nos atendimentos",
    default: "No momento estamos com alto volume de pedidos. Por favor, aguarde alguns minutos.",
  },
];

export function MessagesManager({ restaurantId }: MessagesManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingType, setEditingType] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["custom-messages", restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_messages")
        .select("*")
        .eq("restaurant_id", restaurantId);
      if (error) throw error;
      return data as CustomMessage[];
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async ({ type, text, active }: { type: string; text: string; active?: boolean }) => {
      const existing = messages.find((m) => m.message_type === type);
      
      if (existing) {
        const updateData: any = {};
        if (text !== undefined) updateData.message_text = text;
        if (active !== undefined) updateData.is_active = active;
        
        const { error } = await supabase
          .from("custom_messages")
          .update(updateData)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("custom_messages").insert({
          restaurant_id: restaurantId,
          message_type: type,
          message_text: text,
          is_active: active ?? true,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-messages", restaurantId] });
      toast({ title: "Mensagem atualizada!" });
      setEditingType(null);
      setEditText("");
    },
    onError: () => {
      toast({ title: "Erro ao atualizar mensagem", variant: "destructive" });
    },
  });

  const handleEdit = (type: string) => {
    const message = messages.find((m) => m.message_type === type);
    const defaultMsg = MESSAGE_TYPES.find((t) => t.type === type)?.default || "";
    setEditText(message?.message_text || defaultMsg);
    setEditingType(type);
  };

  const handleSave = (type: string) => {
    upsertMutation.mutate({ type, text: editText });
  };

  const handleToggle = (type: string, active: boolean) => {
    const message = messages.find((m) => m.message_type === type);
    const defaultMsg = MESSAGE_TYPES.find((t) => t.type === type)?.default || "";
    upsertMutation.mutate({
      type,
      text: message?.message_text || defaultMsg,
      active,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Mensagens Personalizadas da IA
        </CardTitle>
        <CardDescription>
          Customize as mensagens automáticas do seu agente
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground">Carregando...</p>
        ) : (
          <div className="space-y-4">
            {MESSAGE_TYPES.map(({ type, label, description, default: defaultMsg }) => {
              const message = messages.find((m) => m.message_type === type);
              const isEditing = editingType === type;
              const displayText = message?.message_text || defaultMsg;
              const isActive = message?.is_active ?? false;

              return (
                <div key={type} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Label className="text-base font-semibold">{label}</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={isActive}
                        onCheckedChange={(checked) => handleToggle(type, checked)}
                      />
                      {!isEditing ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(type)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSave(type)}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {isEditing ? (
                    <Textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={3}
                      placeholder={defaultMsg}
                      className="font-mono text-sm"
                    />
                  ) : (
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm font-mono whitespace-pre-wrap">
                        {displayText}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
