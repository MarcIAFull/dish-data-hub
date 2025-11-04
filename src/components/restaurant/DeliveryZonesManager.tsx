import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, Edit2, MapPin } from "lucide-react";
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

interface DeliveryZone {
  id: string;
  min_distance: number;
  max_distance: number;
  fee: number;
  is_active: boolean;
}

interface DeliveryZonesManagerProps {
  restaurantId: string;
}

export function DeliveryZonesManager({ restaurantId }: DeliveryZonesManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  const [formData, setFormData] = useState({
    min_distance: "",
    max_distance: "",
    fee: "",
  });

  const { data: zones = [], isLoading } = useQuery({
    queryKey: ["delivery-zones", restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delivery_zones")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("min_distance");
      if (error) throw error;
      return data as DeliveryZone[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (zone: Omit<DeliveryZone, "id">) => {
      const { error } = await supabase.from("delivery_zones").insert({
        restaurant_id: restaurantId,
        ...zone,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-zones", restaurantId] });
      toast({ title: "Zona criada com sucesso!" });
      resetForm();
    },
    onError: () => {
      toast({ title: "Erro ao criar zona", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...zone }: Partial<DeliveryZone> & { id: string }) => {
      const { error } = await supabase
        .from("delivery_zones")
        .update(zone)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-zones", restaurantId] });
      toast({ title: "Zona atualizada!" });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("delivery_zones").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-zones", restaurantId] });
      toast({ title: "Zona deletada!" });
    },
  });

  const resetForm = () => {
    setFormData({ min_distance: "", max_distance: "", fee: "" });
    setEditingZone(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const zoneData = {
      min_distance: parseFloat(formData.min_distance),
      max_distance: parseFloat(formData.max_distance),
      fee: parseFloat(formData.fee),
      is_active: true,
    };

    if (editingZone) {
      updateMutation.mutate({ id: editingZone.id, ...zoneData });
    } else {
      createMutation.mutate(zoneData);
    }
  };

  const handleEdit = (zone: DeliveryZone) => {
    setEditingZone(zone);
    setFormData({
      min_distance: zone.min_distance.toString(),
      max_distance: zone.max_distance.toString(),
      fee: zone.fee.toString(),
    });
    setIsDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Zonas de Entrega
            </CardTitle>
            <CardDescription>
              Configure as taxas de entrega por distância
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Zona
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingZone ? "Editar Zona" : "Nova Zona de Entrega"}
                  </DialogTitle>
                  <DialogDescription>
                    Defina a faixa de distância e a taxa de entrega
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="min_distance">Distância Mínima (km)</Label>
                    <Input
                      id="min_distance"
                      type="number"
                      step="0.1"
                      value={formData.min_distance}
                      onChange={(e) =>
                        setFormData({ ...formData, min_distance: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="max_distance">Distância Máxima (km)</Label>
                    <Input
                      id="max_distance"
                      type="number"
                      step="0.1"
                      value={formData.max_distance}
                      onChange={(e) =>
                        setFormData({ ...formData, max_distance: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="fee">Taxa de Entrega (R$)</Label>
                    <Input
                      id="fee"
                      type="number"
                      step="0.01"
                      value={formData.fee}
                      onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">
                    {editingZone ? "Atualizar" : "Criar"}
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
        ) : zones.length === 0 ? (
          <p className="text-muted-foreground">
            Nenhuma zona configurada. Adicione a primeira!
          </p>
        ) : (
          <div className="space-y-2">
            {zones.map((zone) => (
              <div
                key={zone.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium">
                    {zone.min_distance}km - {zone.max_distance}km
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Taxa: R$ {zone.fee.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={zone.is_active}
                    onCheckedChange={(checked) =>
                      updateMutation.mutate({ id: zone.id, is_active: checked })
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(zone)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(zone.id)}
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
