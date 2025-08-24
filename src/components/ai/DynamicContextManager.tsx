import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Package, 
  Tag, 
  TrendingUp, 
  Save, 
  Plus, 
  Trash2,
  Brain,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface ProductInventory {
  id?: string;
  restaurant_id: string;
  product_id: string;
  current_stock: number;
  low_stock_threshold: number;
  auto_disable_when_empty: boolean;
  products?: {
    name: string;
    price: number;
  };
}

interface DynamicPromotion {
  id?: string;
  restaurant_id: string;
  title: string;
  description: string;
  discount_type: string;
  discount_value: number;
  applicable_products: any;
  applicable_categories: any;
  start_time: string;
  end_time?: string;
  is_active: boolean;
  auto_announce: boolean;
}

interface DynamicContextManagerProps {
  restaurantId: string;
}

export const DynamicContextManager: React.FC<DynamicContextManagerProps> = ({ 
  restaurantId 
}) => {
  const [inventory, setInventory] = useState<ProductInventory[]>([]);
  const [promotions, setPromotions] = useState<DynamicPromotion[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New promotion form state
  const [newPromotion, setNewPromotion] = useState<Partial<DynamicPromotion>>({
    restaurant_id: restaurantId,
    title: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 0,
    applicable_products: [],
    applicable_categories: [],
    start_time: new Date().toISOString(),
    is_active: true,
    auto_announce: true
  });

  useEffect(() => {
    fetchData();
  }, [restaurantId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch products and categories
      const [productsRes, categoriesRes, inventoryRes, promotionsRes] = await Promise.all([
        supabase
          .from('products')
          .select(`
            *,
            categories (id, name, restaurant_id)
          `)
          .eq('categories.restaurant_id', restaurantId),
        
        supabase
          .from('categories')
          .select('*')
          .eq('restaurant_id', restaurantId),
          
        supabase
          .from('product_inventory')
          .select(`
            *,
            products (name, price)
          `)
          .eq('restaurant_id', restaurantId),
          
        supabase
          .from('dynamic_promotions')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .order('created_at', { ascending: false })
      ]);

      if (productsRes.error) throw productsRes.error;
      if (categoriesRes.error) throw categoriesRes.error;
      if (inventoryRes.error) throw inventoryRes.error;
      if (promotionsRes.error) throw promotionsRes.error;

      setProducts(productsRes.data || []);
      setCategories(categoriesRes.data || []);
      setInventory(inventoryRes.data || []);
      setPromotions(promotionsRes.data || []);
      
    } catch (error) {
      console.error('Error fetching dynamic context data:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateInventory = async (productId: string, stock: number) => {
    try {
      const existingItem = inventory.find(item => item.product_id === productId);
      
      if (existingItem) {
        const { error } = await supabase
          .from('product_inventory')
          .update({ 
            current_stock: stock,
            last_updated: new Date().toISOString()
          })
          .eq('id', existingItem.id);
          
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('product_inventory')
          .insert({
            restaurant_id: restaurantId,
            product_id: productId,
            current_stock: stock,
            low_stock_threshold: 5,
            auto_disable_when_empty: true
          });
          
        if (error) throw error;
      }
      
      await fetchData();
      
      toast({
        title: "Estoque atualizado",
        description: "A IA agora tem informações em tempo real do estoque",
      });
    } catch (error) {
      console.error('Error updating inventory:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o estoque",
        variant: "destructive",
      });
    }
  };

  const savePromotion = async () => {
    try {
      setSaving(true);
      
      if (!newPromotion.title || !newPromotion.discount_value) {
        toast({
          title: "Erro",
          description: "Título e valor do desconto são obrigatórios",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('dynamic_promotions')
        .insert([newPromotion as any]);

      if (error) throw error;

      await fetchData();
      
      // Reset form
      setNewPromotion({
        restaurant_id: restaurantId,
        title: '',
        description: '',
        discount_type: 'percentage',
        discount_value: 0,
        applicable_products: [],
        applicable_categories: [],
        start_time: new Date().toISOString(),
        is_active: true,
        auto_announce: true
      });

      toast({
        title: "Promoção criada",
        description: "A IA começará a anunciar esta promoção automaticamente",
      });
    } catch (error) {
      console.error('Error saving promotion:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a promoção",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const togglePromotion = async (promotionId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('dynamic_promotions')
        .update({ 
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', promotionId);

      if (error) throw error;

      await fetchData();
      
      toast({
        title: isActive ? "Promoção ativada" : "Promoção desativada",
        description: isActive ? 
          "A IA começará a anunciar esta promoção" : 
          "A IA parará de anunciar esta promoção",
      });
    } catch (error) {
      console.error('Error toggling promotion:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a promoção",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Brain className="mx-auto h-8 w-8 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Carregando contexto dinâmico...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Contexto Dinâmico da IA
          </CardTitle>
          <CardDescription>
            Gerencie informações em tempo real que a IA usa para responder aos clientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="inventory" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="inventory">Estoque</TabsTrigger>
              <TabsTrigger value="promotions">Promoções</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="inventory" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Controle de Estoque Inteligente</h3>
                <Badge variant="secondary">
                  {inventory.length} produtos monitorados
                </Badge>
              </div>
              
              <div className="space-y-3">
                {products.map((product) => {
                  const inventoryItem = inventory.find(item => item.product_id === product.id);
                  const currentStock = inventoryItem?.current_stock || 0;
                  const threshold = inventoryItem?.low_stock_threshold || 5;
                  
                  return (
                    <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            R$ {parseFloat(product.price).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {currentStock <= threshold ? (
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                          <span className="text-sm">
                            {currentStock} unidades
                          </span>
                        </div>
                        
                        <Input
                          type="number"
                          min="0"
                          value={currentStock}
                          onChange={(e) => updateInventory(product.id, parseInt(e.target.value) || 0)}
                          className="w-20"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="promotions" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Active Promotions */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Promoções Ativas</h3>
                  <div className="space-y-3">
                    {promotions.filter(p => p.is_active).map((promotion) => (
                      <div key={promotion.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium">{promotion.title}</h4>
                          <Switch
                            checked={promotion.is_active}
                            onCheckedChange={(checked) => togglePromotion(promotion.id!, checked)}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {promotion.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {promotion.discount_value}
                            {promotion.discount_type === 'percentage' ? '%' : 'R$'} OFF
                          </Badge>
                          {promotion.auto_announce && (
                            <Badge variant="secondary">Auto-anúncio</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* New Promotion Form */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Nova Promoção</h3>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="promo-title">Título da Promoção</Label>
                      <Input
                        id="promo-title"
                        value={newPromotion.title}
                        onChange={(e) => setNewPromotion(prev => ({
                          ...prev,
                          title: e.target.value
                        }))}
                        placeholder="Ex: Super Desconto de Verão"
                      />
                    </div>

                    <div>
                      <Label htmlFor="promo-description">Descrição</Label>
                      <Textarea
                        id="promo-description"
                        value={newPromotion.description}
                        onChange={(e) => setNewPromotion(prev => ({
                          ...prev,
                          description: e.target.value
                        }))}
                        placeholder="Descreva os detalhes da promoção..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Tipo de Desconto</Label>
                        <Select 
                          value={newPromotion.discount_type} 
                          onValueChange={(value: 'percentage' | 'fixed_amount' | 'bogo') => 
                            setNewPromotion(prev => ({ ...prev, discount_type: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">Porcentagem</SelectItem>
                            <SelectItem value="fixed_amount">Valor Fixo</SelectItem>
                            <SelectItem value="bogo">Leve 2 Pague 1</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="discount-value">
                          Valor {newPromotion.discount_type === 'percentage' ? '(%)' : '(R$)'}
                        </Label>
                        <Input
                          id="discount-value"
                          type="number"
                          min="0"
                          step={newPromotion.discount_type === 'percentage' ? "1" : "0.01"}
                          value={newPromotion.discount_value}
                          onChange={(e) => setNewPromotion(prev => ({
                            ...prev,
                            discount_value: parseFloat(e.target.value) || 0
                          }))}
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="auto-announce"
                        checked={newPromotion.auto_announce}
                        onCheckedChange={(checked) => setNewPromotion(prev => ({
                          ...prev,
                          auto_announce: checked
                        }))}
                      />
                      <Label htmlFor="auto-announce">
                        IA anuncia automaticamente esta promoção
                      </Label>
                    </div>

                    <Button onClick={savePromotion} disabled={saving} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      {saving ? 'Salvando...' : 'Criar Promoção'}
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="insights" className="space-y-4">
              <div className="text-center p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Insights de Contexto Dinâmico</h3>
                <p className="text-muted-foreground mb-4">
                  Análises em tempo real sobre como a IA usa o contexto dinâmico
                </p>
                <Badge variant="secondary">Em desenvolvimento</Badge>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};