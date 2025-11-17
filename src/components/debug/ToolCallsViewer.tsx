// 🔍 Enhanced Tool Calls Viewer - FASE 3
// Visualização detalhada de ferramentas executadas

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Wrench, ArrowRight, Clock, AlertCircle, CheckCircle2, XCircle } from "lucide-react";

interface ToolCallsViewerProps {
  toolsExecuted: any[];
}

export function ToolCallsViewer({ toolsExecuted }: ToolCallsViewerProps) {
  if (!toolsExecuted || toolsExecuted.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <p>Nenhuma ferramenta foi executada neste processamento</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Wrench className="h-4 w-4" />
          Ferramentas Executadas ({toolsExecuted.length})
        </h3>
      </div>

      <ScrollArea className="h-[500px] pr-4">
        <div className="space-y-4">
          {toolsExecuted.map((toolExecution, idx) => {
            const isSuccess = toolExecution.result?.success !== false;
            const isIntelligent = toolExecution.result?.context_used !== undefined;
            const executionTime = toolExecution.execution_time_ms || toolExecution.result?.execution_time_ms || 0;

            return (
              <Card key={idx} className={isSuccess ? '' : 'border-red-200'}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isSuccess ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <code className="font-mono">{toolExecution.tool}</code>
                      {isIntelligent && (
                        <Badge variant="outline" className="text-xs">
                          🧠 Inteligente
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {executionTime}ms
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Input Arguments */}
                  {toolExecution.arguments && Object.keys(toolExecution.arguments).length > 0 && (
                    <div>
                      <p className="text-xs font-medium mb-1 flex items-center gap-1">
                        <ArrowRight className="h-3 w-3 text-blue-500" />
                        Entrada (Args)
                      </p>
                      <div className="bg-muted/50 p-2 rounded text-xs font-mono">
                        <pre className="whitespace-pre-wrap">
                          {JSON.stringify(toolExecution.arguments, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Output Result */}
                  <div>
                    <p className="text-xs font-medium mb-1 flex items-center gap-1">
                      <ArrowRight className="h-3 w-3 text-green-500" />
                      Saída (Result)
                    </p>
                    <div className={`p-2 rounded text-xs ${
                      isSuccess ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                    }`}>
                      <pre className="whitespace-pre-wrap font-mono">
                        {JSON.stringify(toolExecution.result, null, 2)}
                      </pre>
                    </div>
                  </div>

                  {/* Context Used (for intelligent tools) */}
                  {isIntelligent && toolExecution.result.context_used && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-xs font-medium mb-1 flex items-center gap-1">
                          <span className="text-purple-500">🔍</span>
                          Contexto Utilizado
                        </p>
                        <div className="bg-purple-50 border border-purple-200 p-2 rounded text-xs">
                          <pre className="whitespace-pre-wrap font-mono">
                            {JSON.stringify(toolExecution.result.context_used, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Error Details */}
                  {!isSuccess && toolExecution.result.error && (
                    <>
                      <Separator />
                      <div className="bg-red-50 border border-red-200 p-2 rounded">
                        <p className="text-xs font-semibold text-red-700 mb-1">
                          ⚠️ Erro
                        </p>
                        <p className="text-xs text-red-600">
                          {toolExecution.result.error}
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
