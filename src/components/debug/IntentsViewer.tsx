import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Intent {
  type: string;
  confidence: number;
  priority?: number;
  extracted_data?: any;
}

interface IntentsViewerProps {
  intents: Intent[];
}

export function IntentsViewer({ intents }: IntentsViewerProps) {
  if (!intents || intents.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum intent detectado</p>;
  }

  const getIntentColor = (confidence: number) => {
    if (confidence >= 0.8) return "default";
    if (confidence >= 0.6) return "secondary";
    return "outline";
  };

  return (
    <div className="space-y-2">
      {intents.map((intent, idx) => (
        <Card key={idx}>
          <CardHeader className="py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                {intent.type}
              </CardTitle>
              <Badge variant={getIntentColor(intent.confidence)}>
                {(intent.confidence * 100).toFixed(0)}% confiança
              </Badge>
            </div>
          </CardHeader>
          {intent.extracted_data && (
            <CardContent className="py-2">
              <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                {JSON.stringify(intent.extracted_data, null, 2)}
              </pre>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
