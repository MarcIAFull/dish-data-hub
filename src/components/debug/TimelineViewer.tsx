import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, AlertCircle, Zap } from "lucide-react";

interface TimelineEvent {
  timestamp: number;
  type: "intent" | "agent" | "tool" | "response";
  title: string;
  description?: string;
  status?: "success" | "error" | "pending";
  duration?: number;
}

interface TimelineViewerProps {
  events: TimelineEvent[];
  totalTime?: number;
}

export function TimelineViewer({ events, totalTime }: TimelineViewerProps) {
  if (!events || events.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-muted-foreground">Nenhum evento registrado</p>
        </CardContent>
      </Card>
    );
  }

  const getEventIcon = (type: string, status?: string) => {
    if (status === "error") return <AlertCircle className="h-4 w-4 text-destructive" />;
    if (status === "success") return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    
    const icons: Record<string, React.ReactNode> = {
      intent: <Zap className="h-4 w-4 text-yellow-500" />,
      agent: <CheckCircle2 className="h-4 w-4 text-blue-500" />,
      tool: <CheckCircle2 className="h-4 w-4 text-purple-500" />,
      response: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    };
    return icons[type] || <Clock className="h-4 w-4" />;
  };

  const getEventColor = (type: string) => {
    const colors: Record<string, string> = {
      intent: "border-l-yellow-500",
      agent: "border-l-blue-500",
      tool: "border-l-purple-500",
      response: "border-l-green-500",
    };
    return colors[type] || "border-l-gray-500";
  };

  return (
    <div className="space-y-4">
      {totalTime && (
        <Card className="bg-muted/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Tempo Total</span>
            </div>
            <Badge variant="outline" className="text-sm">
              {totalTime}ms
            </Badge>
          </CardContent>
        </Card>
      )}

      <div className="relative space-y-4">
        {/* Linha vertical conectando eventos */}
        <div className="absolute left-4 top-6 bottom-6 w-px bg-border" />

        {events.map((event, idx) => (
          <div key={idx} className="relative pl-12">
            {/* Ícone do evento */}
            <div className="absolute left-0 top-1 flex items-center justify-center w-8 h-8 rounded-full bg-background border-2 border-border">
              {getEventIcon(event.type, event.status)}
            </div>

            {/* Card do evento */}
            <Card className={`border-l-4 ${getEventColor(event.type)}`}>
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {event.type.toUpperCase()}
                      </Badge>
                      <span className="text-sm font-medium truncate">{event.title}</span>
                    </div>
                    {event.description && (
                      <p className="text-xs text-muted-foreground mt-1">{event.description}</p>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {event.timestamp > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        +{event.timestamp}ms
                      </Badge>
                    )}
                    {event.duration && (
                      <Badge variant="outline" className="text-xs">
                        ⏱ {event.duration}ms
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
