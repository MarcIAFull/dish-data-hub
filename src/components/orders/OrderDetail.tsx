import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  User, 
  Phone, 
  MapPin, 
  Clock,
  DollarSign,
  Package,
  CreditCard,
  Truck,
  CheckCircle,
  XCircle,
  PlayCircle,
  PauseCircle,
  FileText
} from 'lucide-react';
import { useOrders } from '@/hooks/useOrders';

interface OrderDetailProps {
  order: any;
  onStatusUpdate: (orderId: string, status: string) => void;
}

export const OrderDetail: React.FC<OrderDetailProps> = ({ 
  order,
  onStatusUpdate
}) => {
  const { getStatusLabel, getStatusColor, formatCurrency } = useOrders();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />;
      case 'preparing':
        return <PlayCircle className="h-4 w-4" />;
      case 'ready':
        return <Package className="h-4 w-4" />;
      case 'delivered':
        return <Truck className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels = {
      cash: 'Dinheiro',
      pix: 'PIX',
      card: 'Cartão',
      credit: 'Crediário'
    };
    return labels[method as keyof typeof labels] || method;
  };

  const getStatusActions = () => {
    const actions = [];

    if (order.status === 'pending') {
      actions.push(
        <Button
          key="confirm"
          onClick={() => onStatusUpdate(order.id, 'confirmed')}
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Confirmar Pedido
        </Button>
      );
    }

    if (order.status === 'confirmed') {
      actions.push(
        <Button
          key="preparing"
          onClick={() => onStatusUpdate(order.id, 'preparing')}
        >
          <PlayCircle className="h-4 w-4 mr-2" />
          Iniciar Preparo
        </Button>
      );
    }

    if (order.status === 'preparing') {
      actions.push(
        <Button
          key="ready"
          onClick={() => onStatusUpdate(order.id, 'ready')}
        >
          <Package className="h-4 w-4 mr-2" />
          Marcar como Pronto
        </Button>
      );
    }

    if (order.status === 'ready') {
      actions.push(
        <Button
          key="delivered"
          onClick={() => onStatusUpdate(order.id, 'delivered')}
        >
          <Truck className="h-4 w-4 mr-2" />
          Marcar como Entregue
        </Button>
      );
    }

    if (['pending', 'confirmed'].includes(order.status)) {
      actions.push(
        <Button
          key="cancel"
          variant="destructive"
          onClick={() => onStatusUpdate(order.id, 'cancelled')}
        >
          <XCircle className="h-4 w-4 mr-2" />
          Cancelar Pedido
        </Button>
      );
    }

    return actions;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Pedido #{order.order_number}
            </CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatDistanceToNow(new Date(order.created_at), {
                  addSuffix: true,
                  locale: ptBR
                })}
              </div>
              <Badge className={`${getStatusColor(order.status)}`}>
                <div className="flex items-center gap-1">
                  {getStatusIcon(order.status)}
                  {getStatusLabel(order.status)}
                </div>
              </Badge>
            </div>
          </div>
          <div className="flex gap-2">
            {getStatusActions()}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Customer Information */}
        <div>
          <h3 className="font-medium mb-3">Informações do Cliente</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{order.customers.name}</p>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  {order.customers.phone}
                </div>
              </div>
            </div>
            
            {order.customers.email && (
              <div className="text-sm">
                <p className="text-muted-foreground">Email:</p>
                <p>{order.customers.email}</p>
              </div>
            )}
          </div>

          {order.delivery_type === 'delivery' && order.delivery_address && (
            <div className="mt-4">
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Endereço de entrega:</p>
                  <p>{order.delivery_address}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Order Items */}
        <div>
          <h3 className="font-medium mb-3">Itens do Pedido</h3>
          <div className="space-y-3">
            {order.order_items.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{item.products.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Quantidade: {item.quantity} × {formatCurrency(item.unit_price)}
                  </p>
                  {item.notes && (
                    <p className="text-sm text-muted-foreground italic">
                      Obs: {item.notes}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(item.total_price)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Payment and Delivery Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-3">Pagamento</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{getPaymentMethodLabel(order.payment_method)}</span>
                <Badge 
                  variant={order.payment_status === 'paid' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {order.payment_status === 'paid' ? 'Pago' : 'Pendente'}
                </Badge>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-3">Entrega</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {order.delivery_type === 'delivery' ? 'Entrega' : 'Retirada'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Order Summary */}
        <div>
          <h3 className="font-medium mb-3">Resumo do Pedido</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.delivery_fee > 0 && (
              <div className="flex justify-between text-sm">
                <span>Taxa de entrega:</span>
                <span>{formatCurrency(order.delivery_fee)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-medium">
              <span>Total:</span>
              <span className="text-green-600">{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <>
            <Separator />
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Observações
              </h3>
              <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                {order.notes}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};