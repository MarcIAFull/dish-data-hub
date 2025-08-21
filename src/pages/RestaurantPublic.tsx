import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Phone, MessageCircle } from 'lucide-react';
import { CartProvider } from '@/components/cart/CartProvider';
import { Cart } from '@/components/cart/Cart';
import { ProductCard } from '@/components/cart/ProductCard';
import { EmbeddedChat } from '@/components/chat/EmbeddedChat';

interface Restaurant {
  id: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  whatsapp: string;
  instagram: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
  display_order: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category_id: string;
  display_order: number;
}

export default function RestaurantPublic() {
  const { slug } = useParams();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRestaurantData();
  }, [slug]);

  const fetchRestaurantData = async () => {
    try {
      console.log('Fetching restaurant with slug:', slug);
      
      // Fetch restaurant
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (restaurantError) {
        console.error('Restaurant error:', restaurantError);
        throw restaurantError;
      }
      
      console.log('Restaurant found:', restaurantData);
      setRestaurant(restaurantData);

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', restaurantData.id)
        .order('display_order');

      if (categoriesError) {
        console.error('Categories error:', categoriesError);
        throw categoriesError;
      }
      
      console.log('Categories found:', categoriesData);
      setCategories(categoriesData || []);

      // Fetch products only if we have categories
      if (categoriesData && categoriesData.length > 0) {
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .in('category_id', categoriesData.map(c => c.id))
          .eq('is_available', true)
          .order('display_order');

        if (productsError) {
          console.error('Products error:', productsError);
          throw productsError;
        }
        
        console.log('Products found:', productsData);
        setProducts(productsData || []);
      }

    } catch (error) {
      console.error('Error fetching restaurant data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const getProductsByCategory = (categoryId: string) => {
    return products.filter(product => product.category_id === categoryId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Restaurante não encontrado</h1>
          <p className="text-muted-foreground">
            O restaurante que você está procurando não existe ou foi removido.
          </p>
        </div>
      </div>
    );
  }

  // JSON-LD structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "name": restaurant.name,
    "description": restaurant.description,
    "address": restaurant.address,
    "telephone": restaurant.phone,
    "menu": categories.map(category => ({
      "@type": "MenuSection",
      "name": category.name,
      "description": category.description,
      "hasMenuItems": getProductsByCategory(category.id).map(product => ({
        "@type": "MenuItem",
        "name": product.name,
        "description": product.description,
        "offers": {
          "@type": "Offer",
          "price": product.price,
          "priceCurrency": "BRL"
        }
      }))
    }))
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <CartProvider restaurantId={restaurant.id}>
        <div className="min-h-screen bg-gradient-subtle">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
              {/* Restaurant Header */}
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold mb-4" data-restaurant-name={restaurant.name}>
                  {restaurant.name}
                </h1>
                {restaurant.description && (
                  <p className="text-lg text-muted-foreground mb-6" data-restaurant-description>
                    {restaurant.description}
                  </p>
                )}
                
                <div className="flex flex-wrap justify-center gap-4">
                  {restaurant.address && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span data-restaurant-address>{restaurant.address}</span>
                    </div>
                  )}
                  {restaurant.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span data-restaurant-phone>{restaurant.phone}</span>
                    </div>
                  )}
                  {restaurant.whatsapp && (
                    <a
                      href={`https://wa.me/${restaurant.whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700"
                      data-restaurant-whatsapp={restaurant.whatsapp}
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Menu */}
              <div className="space-y-8" data-menu-sections>
                {categories.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <h3 className="text-lg font-semibold mb-2">Menu em preparação</h3>
                      <p className="text-muted-foreground">
                        Este restaurante ainda está organizando seu menu. Volte em breve!
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  categories.map((category) => {
                    const categoryProducts = getProductsByCategory(category.id);
                    if (categoryProducts.length === 0) return null;

                    return (
                      <Card key={category.id} data-category-id={category.id}>
                        <CardHeader>
                          <CardTitle className="text-2xl" data-category-name>
                            {category.name}
                          </CardTitle>
                          {category.description && (
                            <p className="text-muted-foreground" data-category-description>
                              {category.description}
                            </p>
                          )}
                        </CardHeader>
                        <CardContent>
                          <div className="grid gap-4" data-category-products>
                            {categoryProducts.map((product) => (
                              <ProductCard
                                key={product.id}
                                product={product}
                              />
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Shopping Cart */}
        <Cart restaurantWhatsApp={restaurant.whatsapp} />
        
        {/* Embedded Chat */}
        <EmbeddedChat 
          restaurantId={restaurant.id}
          restaurantName={restaurant.name}
        />
      </CartProvider>
    </>
  );
}