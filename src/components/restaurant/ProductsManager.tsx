import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Package, ImageIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ProductModifiersSection } from './ProductModifiersSection';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category_id: string;
  image_url: string | null;
  is_active: boolean;
  display_order: number;
}

interface Category {
  id: string;
  name: string;
}

interface ProductsManagerProps {
  restaurantId: string;
}

export function ProductsManager({ restaurantId }: ProductsManagerProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    image_url: '',
  });

  // Query para contar complementos por produto
  const { data: modifierCounts = {} } = useQuery({
    queryKey: ['product-modifiers-count', restaurantId],
    queryFn: async () => {
      const { data } = await supabase
        .from('product_modifiers')
        .select('id, applicable_products')
        .eq('restaurant_id', restaurantId);
      
      const counts: Record<string, number> = {};
      data?.forEach(mod => {
        mod.applicable_products?.forEach((pid: string) => {
          counts[pid] = (counts[pid] || 0) + 1;
        });
      });
      return counts;
    }
  });

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [restaurantId]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .eq('restaurant_id', restaurantId)
        .order('display_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar categorias',
        variant: 'destructive',
      });
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories!inner (
            restaurant_id
          )
        `)
        .eq('categories.restaurant_id', restaurantId)
        .order('display_order');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar produtos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const productData = {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        category_id: formData.category_id,
        image_url: formData.image_url || null,
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        toast({
          title: 'Sucesso!',
          description: 'Produto atualizado',
        });
      } else {
        const { error } = await supabase
          .from('products')
          .insert([{
            ...productData,
            display_order: products.length,
          }]);

        if (error) throw error;
        toast({
          title: 'Sucesso!',
          description: 'Produto criado',
        });
      }

      setFormData({ name: '', description: '', price: '', category_id: '', image_url: '' });
      setEditingProduct(null);
      setIsDialogOpen(false);
      fetchProducts();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar produto',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      category_id: product.category_id,
      image_url: product.image_url || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      
      toast({
        title: 'Sucesso!',
        description: 'Produto excluído',
      });
      fetchProducts();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir produto',
        variant: 'destructive',
      });
    }
  };

  const openNewProductDialog = () => {
    setEditingProduct(null);
    setFormData({ name: '', description: '', price: '', category_id: '', image_url: '' });
    setIsDialogOpen(true);
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || 'Sem categoria';
  };

  const filteredProducts = selectedCategoryFilter === 'all' 
    ? products 
    : products.filter(p => p.category_id === selectedCategoryFilter);

  if (loading && products.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (categories.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Crie categorias primeiro</h3>
          <p className="text-muted-foreground">
            Você precisa criar pelo menos uma categoria antes de adicionar produtos
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <h2 className="text-2xl font-semibold">Produtos do Menu</h2>
          <p className="text-muted-foreground">
            Adicione e gerencie os produtos do seu restaurante
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewProductDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </DialogTitle>
              <DialogDescription>
                {editingProduct 
                  ? 'Edite as informações do produto e seus complementos'
                  : 'Adicione um novo produto ao menu'
                }
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Dados Básicos</TabsTrigger>
                <TabsTrigger value="modifiers" disabled={!editingProduct}>
                  Complementos
                  {editingProduct && modifierCounts[editingProduct.id] > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {modifierCounts[editingProduct.id]}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basic">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="product-name">Nome do Produto</Label>
                      <Input
                        id="product-name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Ex: Pizza Margherita"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="product-price">Preço (€)</Label>
                      <Input
                        id="product-price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="9.99"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="product-category">Categoria</Label>
                      <Select
                        value={formData.category_id}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                        required
                      >
                        <SelectTrigger id="product-category">
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="product-description">Descrição</Label>
                      <Textarea
                        id="product-description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Descreva o produto..."
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="product-image">URL da Imagem (opcional)</Label>
                      <Input
                        id="product-image"
                        type="url"
                        value={formData.image_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                        placeholder="https://exemplo.com/imagem.jpg"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Salvando...' : (editingProduct ? 'Atualizar' : 'Criar')}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="modifiers">
                {editingProduct && (
                  <ProductModifiersSection 
                    restaurantId={restaurantId}
                    productId={editingProduct.id}
                    categoryId={editingProduct.category_id}
                  />
                )}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2">
        <Button
          variant={selectedCategoryFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategoryFilter('all')}
        >
          Todas ({products.length})
        </Button>
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategoryFilter === category.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategoryFilter(category.id)}
          >
            {category.name} ({products.filter(p => p.category_id === category.id).length})
          </Button>
        ))}
      </div>

      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhum produto encontrado</h3>
            <p className="text-muted-foreground mb-4">
              {selectedCategoryFilter === 'all' 
                ? 'Crie produtos para aparecerem no seu menu'
                : 'Nenhum produto nesta categoria'
              }
            </p>
            {selectedCategoryFilter === 'all' && (
              <Button onClick={openNewProductDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Produto
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              {product.image_url ? (
                <div className="aspect-video w-full bg-muted relative">
                  <img 
                    src={product.image_url} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-video w-full bg-muted flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      {modifierCounts[product.id] > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {modifierCounts[product.id]} complementos
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-xs mt-1">
                      {getCategoryName(product.category_id)}
                    </CardDescription>
                  </div>
                  <div className="text-lg font-bold text-primary">
                    €{product.price.toFixed(2)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {product.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {product.description}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(product)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(product.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}