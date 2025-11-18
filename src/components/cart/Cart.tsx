import React, { useState } from 'react';
import { useCart } from './CartProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ShoppingCart, Plus, Minus, Trash2, MessageCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface CartProps {
  restaurantWhatsApp?: string;
}

export const Cart: React.FC<CartProps> = ({ restaurantWhatsApp }) => {
  const { 
    items, 
    removeItem, 
    updateQuantity, 
    updateNotes, 
    clearCart, 
    getTotalItems, 
    getTotalPrice,
    isCartOpen,
    setIsCartOpen 
  } = useCart();
  
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const generateOrderMessage = () => {
    let message = `🛍️ *Novo Pedido*\n\n`;
    message += `👤 *Cliente:* ${customerName}\n`;
    message += `📱 *Telefone:* ${customerPhone}\n`;
    message += `📍 *Endereço:* ${deliveryAddress}\n\n`;
    
    message += `📋 *Itens do Pedido:*\n`;
    items.forEach((item, index) => {
      message += `${index + 1}. ${item.name}\n`;
      message += `   Qtd: ${item.quantity}x | Preço: ${formatPrice(item.price)}\n`;
      if (item.notes) {
        message += `   Obs: ${item.notes}\n`;
      }
      message += `   Subtotal: ${formatPrice(item.price * item.quantity)}\n\n`;
    });
    
    message += `💰 *Total: ${formatPrice(getTotalPrice())}*\n\n`;
    
    if (specialInstructions) {
      message += `📝 *Observações especiais:*\n${specialInstructions}\n\n`;
    }
    
    message += `✅ Pedido realizado através do site`;
    
    return encodeURIComponent(message);
  };

  const sendToWhatsApp = () => {
    if (!restaurantWhatsApp) {
      alert('WhatsApp não configurado para este restaurante');
      return;
    }

    if (!customerName || !customerPhone || !deliveryAddress) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if (items.length === 0) {
      alert('Carrinho vazio');
      return;
    }

    const message = generateOrderMessage();
    const whatsappUrl = `https://wa.me/${restaurantWhatsApp}?text=${message}`;
    
    window.open(whatsappUrl, '_blank');
    
    // Clear cart after sending
    clearCart();
    setCustomerName('');
    setCustomerPhone('');
    setDeliveryAddress('');
    setSpecialInstructions('');
    setIsCartOpen(false);
  };

  const totalItems = getTotalItems();

  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="lg"
          className="fixed bottom-6 right-6 h-14 px-6 shadow-lg z-50 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <ShoppingCart className="h-5 w-5 mr-2" />
          Carrinho ({totalItems})
        </Button>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Seu Pedido ({totalItems} itens)
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Seu carrinho está vazio</p>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="space-y-4">
                {items.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium">{item.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {formatPrice(item.price)} cada
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-3 mb-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Badge variant="secondary" className="ml-auto">
                          {formatPrice(item.price * item.quantity)}
                        </Badge>
                      </div>
                      
                      <Textarea
                        placeholder="Observações para este item..."
                        value={item.notes || ''}
                        onChange={(e) => updateNotes(item.id, e.target.value)}
                        className="text-sm"
                        rows={2}
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Separator />

              {/* Customer Information */}
              <div className="space-y-4">
                <h3 className="font-medium">Informações do Cliente</h3>
                
                <div>
                  <Label htmlFor="customerName">Nome *</Label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Seu nome completo"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="customerPhone">Telefone *</Label>
                  <Input
                    id="customerPhone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="deliveryAddress">Endereço de Entrega *</Label>
                  <Textarea
                    id="deliveryAddress"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Rua, número, bairro, cidade"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="specialInstructions">Observações Especiais</Label>
                  <Textarea
                    id="specialInstructions"
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="Instruções especiais para entrega..."
                  />
                </div>
              </div>

              <Separator />

              {/* Order Summary */}
              <div className="space-y-2">
                <div className="flex justify-between text-lg font-medium">
                  <span>Total:</span>
                  <span>{formatPrice(getTotalPrice())}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button 
                  onClick={sendToWhatsApp}
                  className="w-full"
                  size="lg"
                  disabled={!customerName || !customerPhone || !deliveryAddress || items.length === 0}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Enviar Pedido via WhatsApp
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={clearCart}
                  className="w-full"
                  disabled={items.length === 0}
                >
                  Limpar Carrinho
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};