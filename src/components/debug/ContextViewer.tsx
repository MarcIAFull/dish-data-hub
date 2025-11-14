import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, FileText } from "lucide-react";

interface Message {
  role: string;
  content: string;
}

interface Summary {
  session_id?: string;
  summary?: string;
  items_ordered?: any[];
  order_total?: number;
}

interface ContextViewerProps {
  history?: Message[];
  summaries?: Summary[];
}

export function ContextViewer({ history, summaries }: ContextViewerProps) {
  return (
    <div className="space-y-4">
      {summaries && summaries.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Resumos de Sessões Anteriores ({summaries.length})
          </h4>
          <div className="space-y-2">
            {summaries.map((summary, idx) => (
              <Card key={idx}>
                <CardHeader className="py-2">
                  <CardTitle className="text-xs font-medium">
                    {summary.session_id || `Sessão ${idx + 1}`}
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <p className="text-xs text-muted-foreground">{summary.summary}</p>
                  {summary.order_total && (
                    <Badge variant="outline" className="mt-2">
                      Total: €{summary.order_total}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {history && history.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Histórico da Sessão Atual ({history.length} mensagens)
          </h4>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {history.map((msg, idx) => (
              <Card key={idx} className={msg.role === 'user' ? 'bg-muted/50' : ''}>
                <CardHeader className="py-2">
                  <CardTitle className="text-xs font-medium">
                    {msg.role === 'user' ? '👤 Usuário' : '🤖 Assistente'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <p className="text-xs whitespace-pre-wrap">{msg.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {(!history || history.length === 0) && (!summaries || summaries.length === 0) && (
        <p className="text-sm text-muted-foreground">Nenhum contexto carregado</p>
      )}
    </div>
  );
}
