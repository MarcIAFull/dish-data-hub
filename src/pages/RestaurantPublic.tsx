import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Phone, MessageCircle } from 'lucide-react';

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
      // Fetch restaurant
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (restaurantError) throw restaurantError;
      setRestaurant(restaurantData);

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', restaurantData.id)
        .order('display_order');

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .in('category_id', categoriesData?.map(c => c.id) || [])
        .eq('is_available', true)
        .order('display_order');

      if (productsError) throw productsError;
      setProducts(productsData || []);

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
                            <div
                              key={product.id}
                              className="flex justify-between items-start p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                              data-product-id={product.id}
                            >
                              <div className="flex-1">
                                <h4 className="font-semibold text-lg mb-2" data-product-name>
                                  {product.name}
                                </h4>
                                {product.description && (
                                  <p className="text-muted-foreground text-sm mb-3" data-product-description>
                                    {product.description}
                                  </p>
                                )}
                                <Badge variant="secondary" data-product-price>
                                  {formatPrice(product.price)}
                                </Badge>
                              </div>
                              {product.image_url && (
                                <img
                                  src={product.image_url}
                                  alt={product.name}
                                  className="w-20 h-20 object-cover rounded-lg ml-4"
                                  data-product-image
                                />
                              )}
                            </div>
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
    </>
  );
}