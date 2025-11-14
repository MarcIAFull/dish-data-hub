import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, ArrowRight } from "lucide-react";

interface AgentCall {
  agent: string;
  action: string;
  input?: any;
  output?: any;
}

interface AgentFlowViewerProps {
  agents: AgentCall[];
}

export function AgentFlowViewer({ agents }: AgentFlowViewerProps) {
  if (!agents || agents.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum agente chamado</p>;
  }

  const getAgentBadgeVariant = (agent: string) => {
    const variants: Record<string, any> = {
      SALES: "default",
      CHECKOUT: "secondary",
      MENU: "outline",
      SUPPORT: "destructive",
      LOGISTICS_HANDLER: "secondary",
    };
    return variants[agent] || "outline";
  };

  return (
    <div className="space-y-3">
      {agents.map((agentCall, idx) => (
        <Card key={idx} className="border-l-4 border-l-primary">
          <CardHeader className="py-3">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Badge variant={getAgentBadgeVariant(agentCall.agent)}>
                  {agentCall.agent}
                </Badge>
                <ArrowRight className="h-3 w-3" />
                <span className="text-muted-foreground">{agentCall.action}</span>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 py-2">
            {agentCall.input && (
              <div>
                <p className="text-xs font-semibold mb-1">Input:</p>
                <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-24">
                  {JSON.stringify(agentCall.input, null, 2)}
                </pre>
              </div>
            )}
            {agentCall.output && (
              <div>
                <p className="text-xs font-semibold mb-1">Output:</p>
                <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-24">
                  {JSON.stringify(agentCall.output, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
