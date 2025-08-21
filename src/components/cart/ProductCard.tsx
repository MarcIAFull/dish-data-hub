import React from 'react';
import { useCart } from './CartProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, ShoppingCart } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category_id: string;
  display_order: number;
}

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addItem, setIsCartOpen } = useCart();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price
    });
    setIsCartOpen(true);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <h4 className="font-semibold text-lg mb-2" data-product-name>
              {product.name}
            </h4>
            {product.description && (
              <p className="text-muted-foreground text-sm mb-3" data-product-description>
                {product.description}
              </p>
            )}
            <div className="flex items-center justify-between">
              <Badge variant="secondary" data-product-price>
                {formatPrice(product.price)}
              </Badge>
              <Button
                size="sm"
                onClick={handleAddToCart}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Adicionar
              </Button>
            </div>
          </div>
          {product.image_url && (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-20 h-20 object-cover rounded-lg"
              data-product-image
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};