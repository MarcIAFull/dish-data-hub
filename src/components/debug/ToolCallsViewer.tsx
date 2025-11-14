import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wrench, CheckCircle2, XCircle } from "lucide-react";

interface ToolCall {
  name: string;
  arguments?: any;
  result?: any;
  success?: boolean;
}

interface ToolCallsViewerProps {
  tools: ToolCall[];
}

export function ToolCallsViewer({ tools }: ToolCallsViewerProps) {
  if (!tools || tools.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma ferramenta executada</p>;
  }

  return (
    <div className="space-y-3">
      {tools.map((tool, idx) => (
        <Card key={idx}>
          <CardHeader className="py-3">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                {tool.name}
                {tool.success !== undefined && (
                  tool.success ? (
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                  ) : (
                    <XCircle className="h-3 w-3 text-red-500" />
                  )
                )}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 py-2">
            {tool.arguments && (
              <div>
                <p className="text-xs font-semibold mb-1">Arguments:</p>
                <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-24">
                  {JSON.stringify(tool.arguments, null, 2)}
                </pre>
              </div>
            )}
            {tool.result && (
              <div>
                <p className="text-xs font-semibold mb-1">Result:</p>
                <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-24">
                  {JSON.stringify(tool.result, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
