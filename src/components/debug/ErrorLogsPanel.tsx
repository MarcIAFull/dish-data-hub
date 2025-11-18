import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronDown, ChevronUp, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ErrorLog {
  id: number | string;
  error_type: string;
  error_message: string;
  error_stack?: string;
  context?: any;
  created_at: string;
  request_id: string;
}

interface ErrorLogsPanelProps {
  chatId?: number;
}

export function ErrorLogsPanel({ chatId }: ErrorLogsPanelProps) {
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchRequestId, setSearchRequestId] = useState('');

  useEffect(() => {
    loadErrors();
  }, [chatId, filterSeverity, filterType, searchRequestId]);

  const loadErrors = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('error_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (chatId) {
        // Se temos chatId, filtrar por request_id relacionado ao chat
        // Isso requer uma junção com ai_processing_logs
        const { data: processingLogs } = await supabase
          .from('ai_processing_logs')
          .select('request_id')
          .eq('chat_id', chatId);

        const requestIds = processingLogs?.map(log => log.request_id) || [];
        if (requestIds.length > 0) {
          query = query.in('request_id', requestIds);
        }
      }

      if (searchRequestId) {
        query = query.ilike('request_id', `%${searchRequestId}%`);
      }

      if (filterType !== 'all') {
        query = query.eq('error_type', filterType);
      }

      const { data, error } = await query;

      if (error) throw error;
      setErrors(data || []);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
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

  const getSeverityIcon = (errorType: string) => {
    if (errorType.toLowerCase().includes('critical') || errorType.toLowerCase().includes('fatal')) {
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    }
    if (errorType.toLowerCase().includes('warning') || errorType.toLowerCase().includes('warn')) {
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
    return <Info className="h-4 w-4 text-blue-600" />;
  };

  const getSeverityBadge = (errorType: string) => {
    if (errorType.toLowerCase().includes('critical') || errorType.toLowerCase().includes('fatal')) {
      return <Badge variant="destructive">🔴 Crítico</Badge>;
    }
    if (errorType.toLowerCase().includes('warning') || errorType.toLowerCase().includes('warn')) {
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300">🟡 Aviso</Badge>;
    }
    return <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">🔵 Info</Badge>;
  };

  const uniqueTypes = Array.from(new Set(errors.map(e => e.error_type)));

  if (loading) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent>
          <p className="text-muted-foreground">Carregando logs de erro...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Logs de Erro</CardTitle>
          <div className="flex gap-2">
            <Input
              placeholder="Buscar por request ID..."
              value={searchRequestId}
              onChange={(e) => setSearchRequestId(e.target.value)}
              className="w-[200px]"
            />
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {uniqueTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <div className="border rounded-md h-full overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]"></TableHead>
                <TableHead className="w-[120px]">Severidade</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Mensagem</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {errors.map((error) => {
                const isExpanded = expandedRows.has(String(error.id));
                
                return (
                  <>
                    <TableRow 
                      key={error.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleExpanded(String(error.id))}
                    >
                      <TableCell>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getSeverityIcon(error.error_type)}
                          {getSeverityBadge(error.error_type)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs">{error.error_type}</code>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-md truncate text-sm">
                          {error.error_message}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(error.created_at), 'dd/MM HH:mm:ss', { locale: ptBR })}
                        </span>
                      </TableCell>
                    </TableRow>
                    
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={5} className="bg-muted/30">
                          <div className="p-4 space-y-4">
                            <div>
                              <h4 className="font-semibold mb-2">Request ID:</h4>
                              <code className="text-xs bg-background p-2 rounded-md block">
                                {error.request_id}
                              </code>
                            </div>

                            <div>
                              <h4 className="font-semibold mb-2">Mensagem Completa:</h4>
                              <div className="bg-background p-3 rounded-md text-sm">
                                {error.error_message}
                              </div>
                            </div>

                            {error.error_stack && (
                              <div>
                                <h4 className="font-semibold mb-2">Stack Trace:</h4>
                                <pre className="bg-background p-3 rounded-md overflow-x-auto text-xs">
                                  {error.error_stack}
                                </pre>
                              </div>
                            )}

                            {error.context && Object.keys(error.context).length > 0 && (
                              <div>
                                <h4 className="font-semibold mb-2">Context:</h4>
                                <pre className="bg-background p-3 rounded-md overflow-x-auto text-xs">
                                  {JSON.stringify(error.context, null, 2)}
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

        {errors.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Nenhum erro encontrado
          </div>
        )}
      </CardContent>
    </Card>
  );
}
