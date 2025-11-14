import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, MessageSquare, Code, Wrench, CheckCircle2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AgentCommunication {
  agent: string;
  action: string;
  input?: any;
  output?: string;
  apiRequest?: {
    model?: string;
    messages?: any[];
    tools?: any[];
  };
  apiResponse?: {
    content?: string;
    toolCalls?: any[];
  };
  toolResults?: any[];
}

interface CommunicationViewerProps {
  agents: AgentCommunication[];
}

export function CommunicationViewer({ agents }: CommunicationViewerProps) {
  if (!agents || agents.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-muted-foreground">Nenhuma comunicação registrada</p>
        </CardContent>
      </Card>
    );
  }

  const getAgentColor = (agent: string) => {
    const colors: Record<string, string> = {
      SALES: "bg-blue-500",
      CHECKOUT: "bg-green-500",
      MENU: "bg-purple-500",
      SUPPORT: "bg-orange-500",
      LOGISTICS_HANDLER: "bg-yellow-500",
    };
    return colors[agent] || "bg-gray-500";
  };

  return (
    <div className="space-y-4">
      {agents.map((comm, idx) => (
        <Card key={idx} className="border-l-4" style={{ borderLeftColor: `var(--${comm.agent.toLowerCase()})` }}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getAgentColor(comm.agent)}`} />
                <CardTitle className="text-sm font-semibold">{comm.agent}</CardTitle>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{comm.action}</span>
              </div>
              <Badge variant="outline" className="text-xs">
                Step {idx + 1}
              </Badge>
            </div>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="input" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="input" className="text-xs">
                  <Code className="h-3 w-3 mr-1" />
                  Input
                </TabsTrigger>
                <TabsTrigger value="api" className="text-xs">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  API Call
                </TabsTrigger>
                <TabsTrigger value="tools" className="text-xs" disabled={!comm.toolResults || comm.toolResults.length === 0}>
                  <Wrench className="h-3 w-3 mr-1" />
                  Tools ({comm.toolResults?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="output" className="text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Output
                </TabsTrigger>
              </TabsList>

              <TabsContent value="input" className="mt-3">
                {comm.input && Object.keys(comm.input).length > 0 ? (
                  <div className="space-y-3">
                    {/* ✅ FIX #3: Show context if available */}
                    {comm.input.restaurantName && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Restaurant Context:</p>
                        <pre className="text-xs bg-muted p-2 rounded">
{JSON.stringify({
  restaurant: comm.input.restaurantName,
  categories: comm.input.categories?.length || 0,
  products: comm.input.totalProducts || comm.input.categories?.flatMap((c: any) => c.products || []).length || 0,
  cartItems: comm.input.currentCart?.length || comm.input.cartItems?.length || 0,
  cartTotal: comm.input.cartTotal || 0
}, null, 2)}
                        </pre>
                      </div>
                    )}
                    
                    {/* Show categories and products if Menu context */}
                    {comm.input.categories && comm.input.categories.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Menu Categories:</p>
                        <ScrollArea className="h-[200px]">
                          {comm.input.categories.map((cat: any, idx: number) => (
                            <div key={idx} className="mb-2">
                              <p className="text-xs font-medium">{cat.emoji} {cat.name} ({cat.products?.length || 0} produtos)</p>
                              {cat.products && cat.products.length > 0 && (
                                <ul className="text-xs text-muted-foreground ml-4 mt-1">
                                  {cat.products.slice(0, 3).map((p: any, pidx: number) => (
                                    <li key={pidx}>• {p.name} - R$ {p.price?.toFixed(2)}</li>
                                  ))}
                                  {cat.products.length > 3 && (
                                    <li className="italic">... e mais {cat.products.length - 3} produtos</li>
                                  )}
                                </ul>
                              )}
                            </div>
                          ))}
                        </ScrollArea>
                      </div>
                    )}
                    
                    {/* Show full input as JSON */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Full Input:</p>
                      <ScrollArea className="h-[200px] rounded-md border p-3">
                        <pre className="text-xs">{JSON.stringify(comm.input, null, 2)}</pre>
                      </ScrollArea>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground py-4 text-center">Sem input registrado</p>
                )}
              </TabsContent>

              <TabsContent value="api" className="mt-3 space-y-3">
                {comm.apiRequest ? (
                  <>
                    <div>
                      <p className="text-xs font-semibold mb-2 flex items-center gap-2">
                        <ArrowRight className="h-3 w-3" />
                        Request para OpenAI
                      </p>
                      <Card className="bg-muted/50">
                        <CardContent className="p-3">
                          <div className="space-y-2">
                            {comm.apiRequest.model && (
                              <div>
                                <Badge variant="outline" className="text-xs">
                                  {comm.apiRequest.model}
                                </Badge>
                              </div>
                            )}
                            {comm.apiRequest.messages && (
                              <div>
                                <p className="text-xs font-medium mb-1">Messages ({comm.apiRequest.messages.length}):</p>
                                <ScrollArea className="h-[150px] rounded-md border bg-background p-2">
                                  <pre className="text-xs">{JSON.stringify(comm.apiRequest.messages, null, 2)}</pre>
                                </ScrollArea>
                              </div>
                            )}
                            {comm.apiRequest.tools && comm.apiRequest.tools.length > 0 && (
                              <div>
                                <p className="text-xs font-medium mb-1">Tools ({comm.apiRequest.tools.length}):</p>
                                <div className="flex flex-wrap gap-1">
                                  {comm.apiRequest.tools.map((tool: any, i: number) => (
                                    <Badge key={i} variant="secondary" className="text-xs">
                                      {tool.function?.name || tool.name || `Tool ${i + 1}`}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {comm.apiResponse && (
                      <div>
                        <p className="text-xs font-semibold mb-2 flex items-center gap-2">
                          <ArrowRight className="h-3 w-3 rotate-180" />
                          Response da OpenAI
                        </p>
                        <Card className="bg-muted/50">
                          <CardContent className="p-3">
                            <ScrollArea className="h-[100px] rounded-md border bg-background p-2">
                              <pre className="text-xs whitespace-pre-wrap">
                                {comm.apiResponse.content || "Sem conteúdo"}
                              </pre>
                            </ScrollArea>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground py-4 text-center">
                    Sem chamada de API registrada
                  </p>
                )}
              </TabsContent>

              <TabsContent value="tools" className="mt-3">
                {comm.toolResults && comm.toolResults.length > 0 ? (
                  <div className="space-y-2">
                    {comm.toolResults.map((tool: any, i: number) => (
                      <Card key={i} className="bg-muted/50">
                        <CardHeader className="py-2">
                          <CardTitle className="text-xs font-medium flex items-center gap-2">
                            <Wrench className="h-3 w-3" />
                            {tool.toolName || `Tool ${i + 1}`}
                            {tool.success !== undefined && (
                              <Badge variant={tool.success ? "default" : "destructive"} className="text-xs">
                                {tool.success ? "✓ Sucesso" : "✗ Falha"}
                              </Badge>
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="py-2">
                          <ScrollArea className="h-[100px] rounded-md border p-2">
                            <pre className="text-xs">{JSON.stringify(tool, null, 2)}</pre>
                          </ScrollArea>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground py-4 text-center">Nenhuma tool executada</p>
                )}
              </TabsContent>

              <TabsContent value="output" className="mt-3">
                {comm.output ? (
                  <Card className="bg-muted/50">
                    <CardContent className="p-3">
                      <ScrollArea className="h-[200px]">
                        <pre className="text-xs whitespace-pre-wrap">{comm.output}</pre>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                ) : (
                  <p className="text-xs text-muted-foreground py-4 text-center">Sem output registrado</p>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
