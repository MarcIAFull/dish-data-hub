import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, Edit2, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PaymentMethod {
  id: string;
  method_name: string;
  display_name: string;
  requires_data: boolean;
  data_type: string | null;
  data_value: string | null;
  instructions: string | null;
  display_order: number;
  is_active: boolean;
}

interface PaymentMethodsManagerProps {
  restaurantId: string;
}

export function PaymentMethodsManager({ restaurantId }: PaymentMethodsManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [formData, setFormData] = useState({
    method_name: "",
    display_name: "",
    requires_data: false,
    data_type: "",
    data_value: "",
    instructions: "",
  });

  const { data: methods = [], isLoading } = useQuery({
    queryKey: ["payment-methods", restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("display_order");
      if (error) throw error;
      return data as PaymentMethod[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (method: Omit<PaymentMethod, "id" | "display_order">) => {
      const { error } = await supabase.from("payment_methods").insert({
        restaurant_id: restaurantId,
        ...method,
        display_order: methods.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods", restaurantId] });
      toast({ title: "Método de pagamento criado!" });
      resetForm();
    },
    onError: () => {
      toast({ title: "Erro ao criar método", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...method }: Partial<PaymentMethod> & { id: string }) => {
      const { error } = await supabase
        .from("payment_methods")
        .update(method)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods", restaurantId] });
      toast({ title: "Método atualizado!" });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payment_methods").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods", restaurantId] });
      toast({ title: "Método deletado!" });
    },
  });

  const resetForm = () => {
    setFormData({
      method_name: "",
      display_name: "",
      requires_data: false,
      data_type: "",
      data_value: "",
      instructions: "",
    });
    setEditingMethod(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const methodData = {
      method_name: formData.method_name,
      display_name: formData.display_name,
      requires_data: formData.requires_data,
      data_type: formData.requires_data ? formData.data_type : null,
      data_value: formData.requires_data ? formData.data_value : null,
      instructions: formData.instructions || null,
      is_active: true,
    };

    if (editingMethod) {
      updateMutation.mutate({ id: editingMethod.id, ...methodData });
    } else {
      createMutation.mutate(methodData);
    }
  };

  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method);
    setFormData({
      method_name: method.method_name,
      display_name: method.display_name,
      requires_data: method.requires_data,
      data_type: method.data_type || "",
      data_value: method.data_value || "",
      instructions: method.instructions || "",
    });
    setIsDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Formas de Pagamento
            </CardTitle>
            <CardDescription>
              Configure os métodos de pagamento aceitos
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Método
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingMethod ? "Editar Método" : "Novo Método de Pagamento"}
                  </DialogTitle>
                  <DialogDescription>
                    Configure como o método aparecerá para os clientes
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="method_name">Nome Interno</Label>
                    <Input
                      id="method_name"
                      value={formData.method_name}
                      onChange={(e) =>
                        setFormData({ ...formData, method_name: e.target.value })
                      }
                      placeholder="Ex: pix"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="display_name">Nome para Exibição</Label>
                    <Input
                      id="display_name"
                      value={formData.display_name}
                      onChange={(e) =>
                        setFormData({ ...formData, display_name: e.target.value })
                      }
                      placeholder="Ex: PIX"
                      required
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="requires_data"
                      checked={formData.requires_data}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, requires_data: checked })
                      }
                    />
                    <Label htmlFor="requires_data">Requer Dados Adicionais</Label>
                  </div>
                  {formData.requires_data && (
                    <>
                      <div className="grid gap-2">
                        <Label htmlFor="data_type">Tipo de Dado</Label>
                        <Select
                          value={formData.data_type}
                          onValueChange={(value) =>
                            setFormData({ ...formData, data_type: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pix_key">Chave PIX</SelectItem>
                            <SelectItem value="phone">Telefone</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="text">Texto Livre</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="data_value">Valor do Dado</Label>
                        <Input
                          id="data_value"
                          value={formData.data_value}
                          onChange={(e) =>
                            setFormData({ ...formData, data_value: e.target.value })
                          }
                          placeholder="Ex: 11999999999"
                        />
                      </div>
                    </>
                  )}
                  <div className="grid gap-2">
                    <Label htmlFor="instructions">Instruções (Opcional)</Label>
                    <Textarea
                      id="instructions"
                      value={formData.instructions}
                      onChange={(e) =>
                        setFormData({ ...formData, instructions: e.target.value })
                      }
                      placeholder="Ex: Pague via PIX e envie o comprovante"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">
                    {editingMethod ? "Atualizar" : "Criar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground">Carregando...</p>
        ) : methods.length === 0 ? (
          <p className="text-muted-foreground">
            Nenhum método configurado. Adicione o primeiro!
          </p>
        ) : (
          <div className="space-y-2">
            {methods.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium">{method.display_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {method.requires_data && `${method.data_type}: ${method.data_value}`}
                  </p>
                  {method.instructions && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {method.instructions}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={method.is_active}
                    onCheckedChange={(checked) =>
                      updateMutation.mutate({ id: method.id, is_active: checked })
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(method)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(method.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
