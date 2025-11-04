import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Clock } from "lucide-react";

interface WorkingHoursEditorProps {
  workingHours: any;
  onChange: (hours: any) => void;
}

const DAYS = [
  { key: "monday", label: "Segunda-feira" },
  { key: "tuesday", label: "Terça-feira" },
  { key: "wednesday", label: "Quarta-feira" },
  { key: "thursday", label: "Quinta-feira" },
  { key: "friday", label: "Sexta-feira" },
  { key: "saturday", label: "Sábado" },
  { key: "sunday", label: "Domingo" },
];

export function WorkingHoursEditor({ workingHours, onChange }: WorkingHoursEditorProps) {
  const handleDayChange = (day: string, field: string, value: any) => {
    onChange({
      ...workingHours,
      [day]: {
        ...workingHours[day],
        [field]: value,
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Horários de Funcionamento
        </CardTitle>
        <CardDescription>
          Configure os horários de abertura e fechamento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {DAYS.map(({ key, label }) => {
          const dayData = workingHours[key] || { open: "10:00", close: "22:00", enabled: true };
          
          return (
            <div key={key} className="flex items-center gap-4 p-3 border rounded-lg">
              <div className="flex items-center gap-2 w-40">
                <Switch
                  checked={dayData.enabled}
                  onCheckedChange={(checked) =>
                    handleDayChange(key, "enabled", checked)
                  }
                />
                <Label className="text-sm">{label}</Label>
              </div>
              {dayData.enabled && (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    type="time"
                    value={dayData.open}
                    onChange={(e) => handleDayChange(key, "open", e.target.value)}
                    className="w-32"
                  />
                  <span className="text-muted-foreground">até</span>
                  <Input
                    type="time"
                    value={dayData.close}
                    onChange={(e) => handleDayChange(key, "close", e.target.value)}
                    className="w-32"
                  />
                </div>
              )}
              {!dayData.enabled && (
                <span className="text-sm text-muted-foreground">Fechado</span>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
