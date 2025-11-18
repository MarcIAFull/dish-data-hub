import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, ChevronUp, Check, X, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ToolCall {
  id: string;
  function_name: string;
  arguments: any;
  result: any;
  timestamp: string;
  execution_time_ms?: number;
  success: boolean;
  error?: string;
}

interface ToolCallsInspectorProps {
  chatId: number;
}

export function ToolCallsInspector({ chatId }: ToolCallsInspectorProps) {
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'time' | 'name'>('time');

  useEffect(() => {
    loadToolCalls();
  }, [chatId]);

  const loadToolCalls = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ai_processing_logs')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Extrair tool calls dos logs
      const calls: ToolCall[] = [];
      data?.forEach((log: any) => {
        if (log.tools_executed && Array.isArray(log.tools_executed)) {
          log.tools_executed.forEach((tool: any, index: number) => {
            calls.push({
              id: `${log.id}-${index}`,
              function_name: tool.function?.name || tool.name || 'unknown',
              arguments: tool.function?.arguments || tool.arguments || {},
              result: tool.result,
              timestamp: log.created_at,
              execution_time_ms: log.processing_time_ms,
              success: !tool.error,
              error: tool.error
            });
          });
        }
      });

      setToolCalls(calls);
    } catch (error) {
      console.error('Erro ao carregar tool calls:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredAndSortedCalls = toolCalls
    .filter(call => {
      if (filterType !== 'all' && call.function_name !== filterType) return false;
      if (filterStatus === 'success' && !call.success) return false;
      if (filterStatus === 'error' && call.success) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'time') {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
      return a.function_name.localeCompare(b.function_name);
    });

  const uniqueFunctions = Array.from(new Set(toolCalls.map(c => c.function_name)));

  if (loading) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent>
          <p className="text-muted-foreground">Carregando tool calls...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Tool Calls Inspector</CardTitle>
          <div className="flex gap-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as ferramentas</SelectItem>
                {uniqueFunctions.map(fn => (
                  <SelectItem key={fn} value={fn}>{fn}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="success">Sucesso</SelectItem>
                <SelectItem value="error">Erro</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'time' | 'name')}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="time">Tempo</SelectItem>
                <SelectItem value="name">Nome</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]"></TableHead>
                <TableHead>Função</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Tempo</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedCalls.map((call) => {
                const isExpanded = expandedRows.has(call.id);
                
                return (
                  <>
                    <TableRow key={call.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell onClick={() => toggleExpanded(call.id)}>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </TableCell>
                      <TableCell onClick={() => toggleExpanded(call.id)}>
                        <code className="text-sm font-mono">{call.function_name}</code>
                      </TableCell>
                      <TableCell className="text-center" onClick={() => toggleExpanded(call.id)}>
                        {call.success ? (
                          <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">
                            <Check className="h-3 w-3 mr-1" />
                            Success
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                            <X className="h-3 w-3 mr-1" />
                            Error
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center" onClick={() => toggleExpanded(call.id)}>
                        {call.execution_time_ms && (
                          <div className="flex items-center justify-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span className="text-sm">{call.execution_time_ms}ms</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell onClick={() => toggleExpanded(call.id)}>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(call.timestamp), 'dd/MM HH:mm:ss', { locale: ptBR })}
                        </span>
                      </TableCell>
                    </TableRow>
                    
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={5} className="bg-muted/30">
                          <div className="p-4 space-y-4">
                            {/* Arguments */}
                            <div>
                              <h4 className="font-semibold mb-2">Arguments:</h4>
                              <pre className="bg-background p-3 rounded-md overflow-x-auto text-xs">
                                {JSON.stringify(call.arguments, null, 2)}
                              </pre>
                            </div>

                            {/* Result */}
                            {call.result && (
                              <div>
                                <h4 className="font-semibold mb-2">Result:</h4>
                                <pre className="bg-background p-3 rounded-md overflow-x-auto text-xs">
                                  {JSON.stringify(call.result, null, 2)}
                                </pre>
                              </div>
                            )}

                            {/* Error */}
                            {call.error && (
                              <div>
                                <h4 className="font-semibold mb-2 text-destructive">Error:</h4>
                                <pre className="bg-destructive/10 p-3 rounded-md overflow-x-auto text-xs text-destructive">
                                  {call.error}
                                </pre>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {filteredAndSortedCalls.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Nenhuma tool call encontrada
          </div>
        )}
      </CardContent>
    </Card>
  );
}
