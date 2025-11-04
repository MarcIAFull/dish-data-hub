import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, MapPin, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { WorkingHoursEditor } from "./WorkingHoursEditor";

interface OperationSettingsProps {
  restaurantId: string;
  initialData: {
    estimated_prep_time?: number;
    estimated_delivery_time?: number;
    max_delivery_distance?: number;
    packaging_fee?: number;
    working_hours?: any;
  };
}

export function OperationSettings({ restaurantId, initialData }: OperationSettingsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    estimated_prep_time: initialData.estimated_prep_time?.toString() || "30",
    estimated_delivery_time: initialData.estimated_delivery_time?.toString() || "40",
    max_delivery_distance: initialData.max_delivery_distance?.toString() || "15",
    packaging_fee: initialData.packaging_fee?.toString() || "0.34",
  });
  const [workingHours, setWorkingHours] = useState(initialData.working_hours || {});

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from("restaurants")
        .update(data)
        .eq("id", restaurantId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurant", restaurantId] });
      toast({ title: "Configurações atualizadas!" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      estimated_prep_time: parseInt(formData.estimated_prep_time),
      estimated_delivery_time: parseInt(formData.estimated_delivery_time),
      max_delivery_distance: parseFloat(formData.max_delivery_distance),
      packaging_fee: parseFloat(formData.packaging_fee),
      working_hours: workingHours,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Tempos de Operação
          </CardTitle>
          <CardDescription>
            Configure os tempos estimados de preparo e entrega
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="prep_time">Tempo de Preparo (minutos)</Label>
            <Input
              id="prep_time"
              type="number"
              value={formData.estimated_prep_time}
              onChange={(e) =>
                setFormData({ ...formData, estimated_prep_time: e.target.value })
              }
              required
            />
            <p className="text-xs text-muted-foreground">
              Tempo médio para preparar um pedido
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="delivery_time">Tempo de Entrega (minutos)</Label>
            <Input
              id="delivery_time"
              type="number"
              value={formData.estimated_delivery_time}
              onChange={(e) =>
                setFormData({ ...formData, estimated_delivery_time: e.target.value })
              }
              required
            />
            <p className="text-xs text-muted-foreground">
              Tempo médio de deslocamento até o cliente
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Área de Cobertura
          </CardTitle>
          <CardDescription>
            Defina o raio máximo de atendimento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            <Label htmlFor="max_distance">Distância Máxima (km)</Label>
            <Input
              id="max_distance"
              type="number"
              step="0.1"
              value={formData.max_delivery_distance}
              onChange={(e) =>
                setFormData({ ...formData, max_delivery_distance: e.target.value })
              }
              required
            />
            <p className="text-xs text-muted-foreground">
              Pedidos além desta distância serão rejeitados automaticamente
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Taxa de Embalagem
          </CardTitle>
          <CardDescription>
            Configure a taxa fixa de embalagem
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            <Label htmlFor="packaging_fee">Taxa de Embalagem (R$)</Label>
            <Input
              id="packaging_fee"
              type="number"
              step="0.01"
              value={formData.packaging_fee}
              onChange={(e) =>
                setFormData({ ...formData, packaging_fee: e.target.value })
              }
              required
            />
            <p className="text-xs text-muted-foreground">
              Valor cobrado por pedido para embalagens
            </p>
          </div>
        </CardContent>
      </Card>

      <WorkingHoursEditor
        workingHours={workingHours}
        onChange={setWorkingHours}
      />

      <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
        {updateMutation.isPending ? "Salvando..." : "Salvar Configurações"}
      </Button>
    </form>
  );
}
