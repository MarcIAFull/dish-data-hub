import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useBusinessIntelligence } from '@/hooks/useBusinessIntelligence';
import { 
  FileText,
  Download,
  Calendar,
  TrendingUp,
  DollarSign,
  Receipt,
  Building2,
  FileSpreadsheet,
  Mail,
  Printer
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer 
} from 'recharts';
import { DateRange } from 'react-day-picker';

interface FinancialReportsProps {
  restaurantId: string;
}

export function FinancialReports({ restaurantId }: FinancialReportsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [reportType, setReportType] = useState('dre');
  const [exportFormat, setExportFormat] = useState('pdf');
  const [generating, setGenerating] = useState(false);

  // Mock financial data - in real implementation would come from database
  const financialData = {
    dre: {
      receitas: {
        vendas: 85000,
        servicos: 12000,
        outros: 3000
      },
      custos: {
        mercadorias: 25000,
        maoDeObra: 18000,
        materiais: 5000
      },
      despesas: {
        operacionais: 15000,
        administrativas: 8000,
        vendas: 6000,
        financeiras: 2000
      }
    },
    fluxoCaixa: [
      { data: '2024-01-01', entradas: 15000, saidas: 8000, saldo: 7000 },
      { data: '2024-01-02', entradas: 18000, saidas: 12000, saldo: 13000 },
      { data: '2024-01-03', entradas: 22000, saidas: 10000, saldo: 25000 },
      { data: '2024-01-04', entradas: 16000, saidas: 14000, saldo: 27000 },
      { data: '2024-01-05', entradas: 20000, saidas: 9000, saldo: 38000 },
    ],
    impostos: {
      pis: 1200,
      cofins: 3600,
      icms: 8500,
      iss: 2400,
      irpj: 4500,
      csll: 1800
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const calculateTotal = (obj: Record<string, number>) => {
    return Object.values(obj).reduce((sum, value) => sum + value, 0);
  };

  const generateReport = async () => {
    setGenerating(true);
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In real implementation, would call edge function to generate PDF/Excel
      const blob = new Blob(['Mock report content'], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-${reportType}-${Date.now()}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setGenerating(false);
    }
  };

  const sendToAccountant = async () => {
    // In real implementation, would send email with reports
    console.log('Sending reports to accountant...');
  };

  const totalReceitas = calculateTotal(financialData.dre.receitas);
  const totalCustos = calculateTotal(financialData.dre.custos);
  const totalDespesas = calculateTotal(financialData.dre.despesas);
  const lucroLiquido = totalReceitas - totalCustos - totalDespesas;
  const margemLiquida = (lucroLiquido / totalReceitas) * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Relatórios Financeiros</h2>
          <p className="text-muted-foreground">
            Relatórios contábeis e fiscais para sua empresa
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Esta semana</SelectItem>
              <SelectItem value="month">Este mês</SelectItem>
              <SelectItem value="quarter">Este trimestre</SelectItem>
              <SelectItem value="year">Este ano</SelectItem>
              <SelectItem value="custom">Período customizado</SelectItem>
            </SelectContent>
          </Select>
          
          {selectedPeriod === 'custom' && (
            <DatePickerWithRange date={dateRange} setDate={setDateRange} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Receita Total</p>
                <h3 className="text-2xl font-bold">{formatCurrency(totalReceitas)}</h3>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm ml-1 text-green-600">
                +12.5% vs mês anterior
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Custos</p>
                <h3 className="text-2xl font-bold">{formatCurrency(totalCustos)}</h3>
              </div>
              <Receipt className="h-8 w-8 text-red-500" />
            </div>
            <div className="flex items-center mt-2">
              <Badge variant="outline">
                {((totalCustos / totalReceitas) * 100).toFixed(1)}% da receita
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Lucro Líquido</p>
                <h3 className="text-2xl font-bold">{formatCurrency(lucroLiquido)}</h3>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
            <div className="flex items-center mt-2">
              <Badge variant={margemLiquida > 0 ? 'default' : 'destructive'}>
                {margemLiquida.toFixed(1)}% margem
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Impostos</p>
                <h3 className="text-2xl font-bold">{formatCurrency(calculateTotal(financialData.impostos))}</h3>
              </div>
              <Building2 className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="flex items-center mt-2">
              <span className="text-sm text-muted-foreground">
                {((calculateTotal(financialData.impostos) / totalReceitas) * 100).toFixed(1)}% da receita
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={reportType} onValueChange={setReportType} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dre">DRE</TabsTrigger>
          <TabsTrigger value="fluxo">Fluxo de Caixa</TabsTrigger>
          <TabsTrigger value="impostos">Impostos</TabsTrigger>
          <TabsTrigger value="export">Exportação</TabsTrigger>
        </TabsList>

        <TabsContent value="dre" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Demonstração do Resultado do Exercício (DRE)</CardTitle>
              <CardDescription>
                Resumo das receitas, custos e despesas do período
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold text-green-700 mb-3">Receitas</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(financialData.dre.receitas).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="font-medium">{formatCurrency(value)}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 flex justify-between font-bold">
                      <span>Total de Receitas</span>
                      <span>{formatCurrency(totalReceitas)}</span>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold text-red-700 mb-3">Custos</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(financialData.dre.custos).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="font-medium">({formatCurrency(value)})</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 flex justify-between font-bold">
                      <span>Total de Custos</span>
                      <span>({formatCurrency(totalCustos)})</span>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold text-orange-700 mb-3">Despesas</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(financialData.dre.despesas).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="font-medium">({formatCurrency(value)})</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 flex justify-between font-bold">
                      <span>Total de Despesas</span>
                      <span>({formatCurrency(totalDespesas)})</span>
                    </div>
                  </div>
                </div>

                <div className="border-2 border-primary rounded-lg p-4 bg-primary/5">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-lg">Resultado Líquido</h4>
                    <span className={`font-bold text-xl ${lucroLiquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(lucroLiquido)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Margem líquida: {margemLiquida.toFixed(2)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fluxo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Fluxo de Caixa</CardTitle>
              <CardDescription>
                Entradas e saídas de caixa por período
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  entradas: {
                    label: "Entradas",
                    color: "hsl(var(--primary))",
                  },
                  saidas: {
                    label: "Saídas",
                    color: "#EF4444",
                  },
                  saldo: {
                    label: "Saldo",
                    color: "#10B981",
                  },
                }}
                className="h-80"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={financialData.fluxoCaixa}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="data" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                    />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="entradas"
                      stackId="1"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.6}
                    />
                    <Area
                      type="monotone"
                      dataKey="saidas"
                      stackId="2"
                      stroke="#EF4444"
                      fill="#EF4444"
                      fillOpacity={0.6}
                    />
                    <Line
                      type="monotone"
                      dataKey="saldo"
                      stroke="#10B981"
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="impostos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumo de Impostos</CardTitle>
              <CardDescription>
                Impostos devidos no período
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {Object.entries(financialData.impostos).map(([imposto, valor]) => (
                    <div key={imposto} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium uppercase">{imposto}</p>
                        <p className="text-sm text-muted-foreground">
                          {((valor / totalReceitas) * 100).toFixed(2)}% da receita
                        </p>
                      </div>
                      <span className="font-bold">{formatCurrency(valor)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between">
                      <span className="font-bold">Total de Impostos</span>
                      <span className="font-bold text-lg">{formatCurrency(calculateTotal(financialData.impostos))}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <ChartContainer
                    config={{
                      value: {
                        label: "Valor",
                        color: "hsl(var(--primary))",
                      },
                    }}
                    className="h-80"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={Object.entries(financialData.impostos).map(([nome, valor]) => ({ nome: nome.toUpperCase(), valor }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="nome" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Exportação e Integrações</CardTitle>
              <CardDescription>
                Exporte relatórios ou integre com sistemas externos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Gerar Relatórios</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">Tipo de Relatório</label>
                      <Select value={reportType} onValueChange={setReportType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dre">DRE Completa</SelectItem>
                          <SelectItem value="fluxo">Fluxo de Caixa</SelectItem>
                          <SelectItem value="impostos">Relatório de Impostos</SelectItem>
                          <SelectItem value="vendas">Relatório de Vendas</SelectItem>
                          <SelectItem value="completo">Relatório Completo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Formato</label>
                      <Select value={exportFormat} onValueChange={setExportFormat}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pdf">PDF</SelectItem>
                          <SelectItem value="excel">Excel</SelectItem>
                          <SelectItem value="csv">CSV</SelectItem>
                          <SelectItem value="xml">XML (NFe)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        onClick={generateReport} 
                        disabled={generating}
                        className="flex-1"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {generating ? 'Gerando...' : 'Baixar Relatório'}
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        onClick={sendToAccountant}
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Enviar p/ Contador
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Integrações ERP</h4>
                  
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <Building2 className="h-4 w-4 mr-2" />
                      Conectar com TOTVS
                    </Button>
                    
                    <Button variant="outline" className="w-full justify-start">
                      <Building2 className="h-4 w-4 mr-2" />
                      Conectar com SAP
                    </Button>
                    
                    <Button variant="outline" className="w-full justify-start">
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Exportar para Contábil
                    </Button>
                    
                    <Button variant="outline" className="w-full justify-start">
                      <Receipt className="h-4 w-4 mr-2" />
                      Gerar SPED Fiscal
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}