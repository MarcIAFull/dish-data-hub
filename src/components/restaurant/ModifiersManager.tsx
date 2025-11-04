import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, Edit2, Pizza } from "lucide-react";
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

interface ProductModifier {
  id: string;
  name: string;
  modifier_type: string;
  price: number;
  description: string | null;
  max_quantity: number;
  display_order: number;
  is_active: boolean;
}

interface ModifiersManagerProps {
  restaurantId: string;
}

export function ModifiersManager({ restaurantId }: ModifiersManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingModifier, setEditingModifier] = useState<ProductModifier | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    modifier_type: "",
    price: "",
    description: "",
    max_quantity: "1",
  });

  const { data: modifiers = [], isLoading } = useQuery({
    queryKey: ["product-modifiers", restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_modifiers")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("modifier_type")
        .order("display_order");
      if (error) throw error;
      return data as ProductModifier[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (modifier: Omit<ProductModifier, "id" | "display_order">) => {
      const { error } = await supabase.from("product_modifiers").insert({
        restaurant_id: restaurantId,
        ...modifier,
        display_order: modifiers.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-modifiers", restaurantId] });
      toast({ title: "Complemento criado!" });
      resetForm();
    },
    onError: () => {
      toast({ title: "Erro ao criar complemento", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...modifier }: Partial<ProductModifier> & { id: string }) => {
      const { error } = await supabase
        .from("product_modifiers")
        .update(modifier)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-modifiers", restaurantId] });
      toast({ title: "Complemento atualizado!" });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("product_modifiers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-modifiers", restaurantId] });
      toast({ title: "Complemento deletado!" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      modifier_type: "",
      price: "",
      description: "",
      max_quantity: "1",
    });
    setEditingModifier(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const modifierData = {
      name: formData.name,
      modifier_type: formData.modifier_type,
      price: parseFloat(formData.price),
      description: formData.description || null,
      max_quantity: parseInt(formData.max_quantity),
      is_active: true,
    };

    if (editingModifier) {
      updateMutation.mutate({ id: editingModifier.id, ...modifierData });
    } else {
      createMutation.mutate(modifierData);
    }
  };

  const handleEdit = (modifier: ProductModifier) => {
    setEditingModifier(modifier);
    setFormData({
      name: modifier.name,
      modifier_type: modifier.modifier_type,
      price: modifier.price.toString(),
      description: modifier.description || "",
      max_quantity: modifier.max_quantity.toString(),
    });
    setIsDialogOpen(true);
  };

  const groupedModifiers = modifiers.reduce((acc, mod) => {
    if (!acc[mod.modifier_type]) {
      acc[mod.modifier_type] = [];
    }
    acc[mod.modifier_type].push(mod);
    return acc;
  }, {} as Record<string, ProductModifier[]>);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Pizza className="h-5 w-5" />
              Complementos de Produtos
            </CardTitle>
            <CardDescription>
              Configure bordas, adicionais e modificadores
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Complemento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingModifier ? "Editar Complemento" : "Novo Complemento"}
                  </DialogTitle>
                  <DialogDescription>
                    Adicione bordas, adicionais ou modificadores
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Ex: Borda de Catupiry"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="modifier_type">Tipo</Label>
                    <Select
                      value={formData.modifier_type}
                      onValueChange={(value) =>
                        setFormData({ ...formData, modifier_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="borda">Borda</SelectItem>
                        <SelectItem value="adicional">Adicional</SelectItem>
                        <SelectItem value="molho">Molho</SelectItem>
                        <SelectItem value="bebida">Bebida</SelectItem>
                        <SelectItem value="tamanho">Tamanho</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="price">Preço (R$)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="max_quantity">Quantidade Máxima</Label>
                    <Input
                      id="max_quantity"
                      type="number"
                      value={formData.max_quantity}
                      onChange={(e) =>
                        setFormData({ ...formData, max_quantity: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Descrição (Opcional)</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      placeholder="Ex: Deliciosa borda recheada"
                      rows={2}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">
                    {editingModifier ? "Atualizar" : "Criar"}
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
        ) : modifiers.length === 0 ? (
          <p className="text-muted-foreground">
            Nenhum complemento configurado. Adicione o primeiro!
          </p>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedModifiers).map(([type, items]) => (
              <div key={type}>
                <h3 className="font-semibold mb-2 capitalize">{type}</h3>
                <div className="space-y-2">
                  {items.map((modifier) => (
                    <div
                      key={modifier.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{modifier.name}</p>
                        <p className="text-sm text-muted-foreground">
                          R$ {modifier.price.toFixed(2)} • Max: {modifier.max_quantity}x
                        </p>
                        {modifier.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {modifier.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={modifier.is_active}
                          onCheckedChange={(checked) =>
                            updateMutation.mutate({
                              id: modifier.id,
                              is_active: checked,
                            })
                          }
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(modifier)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(modifier.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
