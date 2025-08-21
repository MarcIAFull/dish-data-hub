import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Plus, 
  Minus, 
  ShoppingCart, 
  DollarSign, 
  User, 
  Phone, 
  MapPin,
  Package
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category_id: string;
  is_available: boolean;
}

interface Category {
  id: string;
  name: string;
  description: string;
  products: Product[];
}

interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
}

interface CreateOrderFormProps {
  restaurantId: string;
  categories: Category[];
  onOrderCreated?: (order: any) => void;
}

export const CreateOrderForm: React.FC<CreateOrderFormProps> = ({ 
  restaurantId, 
  categories,
  onOrderCreated 
}) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'pix' | 'card' | 'credit'>('cash');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existingItem = prev.find(item => item.product.id === product.id);
      if (existingItem) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prev, { product, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const existingItem = prev.find(item => item.product.id === productId);
      if (existingItem && existingItem.quantity > 1) {
        return prev.map(item => 
          item.product.id === productId 
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      } else {
        return prev.filter(item => item.product.id !== productId);
      }
    });
  };

  const updateCartItemNotes = (productId: string, notes: string) => {
    setCart(prev => prev.map(item => 
      item.product.id === productId 
        ? { ...item, notes }
        : item
    ));
  };

  const getTotalPrice = () => {
    const subtotal = cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
    const deliveryFee = deliveryType === 'delivery' ? 5.00 : 0;
    return subtotal + deliveryFee;
  };

  const getSubtotal = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const getCartItemCount = (productId: string) => {
    const item = cart.find(item => item.product.id === productId);
    return item ? item.quantity : 0;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleSubmitOrder = async () => {
    if (!customerName.trim() || !customerPhone.trim() || cart.length === 0) {
      toast({
        title: "Erro",
        description: "Preencha os dados do cliente e adicione pelo menos um item",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-order', {
        body: {
          restaurantId,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerEmail: customerEmail.trim() || undefined,
          customerAddress: customerAddress.trim() || undefined,
          items: cart.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            notes: item.notes || undefined
          })),
          deliveryType,
          paymentMethod,
          notes: notes.trim() || undefined
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Pedido criado",
        description: `Pedido #${data.order.order_number} criado com sucesso!`,
      });

      // Reset form
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setCustomerAddress('');
      setNotes('');
      setDeliveryType('delivery');
      setPaymentMethod('cash');

      if (onOrderCreated) {
        onOrderCreated(data.order);
      }

    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o pedido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Product Selection */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Selecionar Produtos</CardTitle>
            <CardDescription>
              Adicione produtos ao carrinho para criar o pedido
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              {categories.map((category) => (
                <div key={category.id} className="mb-6">
                  <h3 className="font-medium text-lg mb-3">{category.name}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {category.products
                      .filter(product => product.is_available)
                      .map((product) => {
                        const inCartCount = getCartItemCount(product.id);
                        
                        return (
                          <Card key={product.id} className="p-4">
                            <div className="flex items-start gap-3">
                              {product.image_url && (
                                <Avatar className="h-16 w-16 rounded-lg">
                                  <AvatarImage src={product.image_url} alt={product.name} />
                                  <AvatarFallback className="rounded-lg">
                                    <Package className="h-6 w-6" />
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <div className="flex-1">
                                <h4 className="font-medium">{product.name}</h4>
                                {product.description && (
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {product.description}
                                  </p>
                                )}
                                <p className="font-medium text-green-600">
                                  {formatCurrency(product.price)}
                                </p>
                                
                                <div className="flex items-center gap-2 mt-3">
                                  {inCartCount > 0 ? (
                                    <div className="flex items-center gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => removeFromCart(product.id)}
                                      >
                                        <Minus className="h-3 w-3" />
                                      </Button>
                                      <Badge variant="secondary">{inCartCount}</Badge>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => addToCart(product)}
                                      >
                                        <Plus className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button
                                      size="sm"
                                      onClick={() => addToCart(product)}
                                    >
                                      <Plus className="h-3 w-3 mr-1" />
                                      Adicionar
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                  </div>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Order Summary and Customer Form */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Novo Pedido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Customer Information */}
            <div>
              <h3 className="font-medium mb-3">Dados do Cliente</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="customerName">Nome *</Label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nome do cliente"
                  />
                </div>
                
                <div>
                  <Label htmlFor="customerPhone">Telefone *</Label>
                  <Input
                    id="customerPhone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                
                <div>
                  <Label htmlFor="customerEmail">Email</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                  />
                </div>
                
                <div>
                  <Label htmlFor="deliveryType">Tipo de Entrega</Label>
                  <Select value={deliveryType} onValueChange={(value: 'delivery' | 'pickup') => setDeliveryType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="delivery">Entrega</SelectItem>
                      <SelectItem value="pickup">Retirada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {deliveryType === 'delivery' && (
                  <div>
                    <Label htmlFor="customerAddress">Endereço de Entrega</Label>
                    <Textarea
                      id="customerAddress"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="Endereço completo para entrega"
                      rows={3}
                    />
                  </div>
                )}
                
                <div>
                  <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
                  <Select value={paymentMethod} onValueChange={(value: 'cash' | 'pix' | 'card' | 'credit') => setPaymentMethod(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Dinheiro</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="card">Cartão</SelectItem>
                      <SelectItem value="credit">Crediário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Cart Items */}
            <div>
              <h3 className="font-medium mb-3">Itens do Pedido</h3>
              {cart.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum item no carrinho
                </p>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.product.id} className="bg-muted/50 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{item.product.name}</span>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFromCart(item.product.id)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm w-6 text-center">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => addToCart(item.product)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>{formatCurrency(item.product.price)} × {item.quantity}</span>
                        <span className="font-medium">{formatCurrency(item.product.price * item.quantity)}</span>
                      </div>
                      <Input
                        placeholder="Observações do item..."
                        value={item.notes || ''}
                        onChange={(e) => updateCartItemNotes(item.product.id, e.target.value)}
                        className="mt-2 text-xs"
                        size={32}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Order Notes */}
            <div>
              <Label htmlFor="notes">Observações do Pedido</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações adicionais..."
                rows={3}
              />
            </div>

            <Separator />

            {/* Order Summary */}
            <div>
              <h3 className="font-medium mb-3">Resumo</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(getSubtotal())}</span>
                </div>
                {deliveryType === 'delivery' && (
                  <div className="flex justify-between text-sm">
                    <span>Taxa de entrega:</span>
                    <span>{formatCurrency(5.00)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Total:</span>
                  <span className="text-green-600">{formatCurrency(getTotalPrice())}</span>
                </div>
              </div>
            </div>

            <Button
              onClick={handleSubmitOrder}
              disabled={loading || cart.length === 0 || !customerName.trim() || !customerPhone.trim()}
              className="w-full"
            >
              {loading ? 'Criando Pedido...' : 'Criar Pedido'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};