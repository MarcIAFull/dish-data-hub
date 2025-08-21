import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useRestaurantMenu } from '@/hooks/useRestaurantMenu';

export default function RestaurantPublic() {
  const { slug } = useParams();
  const {
    restaurant,
    categories,
    loading,
    formatPrice,
    getProductsByCategory,
    getCategoryEmoji,
    getFormattedMenu,
  } = useRestaurantMenu(slug || '');


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
    "name": restaurant?.name || '',
    "description": restaurant?.description || '',
    "address": restaurant?.address || '',
    "telephone": restaurant?.phone || '',
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
          "priceCurrency": "EUR"
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
      
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-4">
                🍕 Cardápio Completo – {restaurant?.name || 'Restaurante'} (Quarteira)
              </h1>
              
              {/* Contact Info */}
              <div className="space-y-2 text-lg">
                {restaurant?.address && (
                  <div className="flex items-center justify-center gap-2">
                    <span>📍</span>
                    <span>{restaurant.address}</span>
                  </div>
                )}
                {restaurant?.phone && (
                  <div className="flex items-center justify-center gap-2">
                    <span>📞</span>
                    <span>{restaurant.phone}</span>
                  </div>
                )}
                <div className="flex items-center justify-center gap-2">
                  <span>⏰</span>
                  <span>Ter–Dom: 18h00 – 01h00 (Delivery até 00h30)</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span>🚚</span>
                  <span>Delivery próprio + Uber Eats</span>
                </div>
              </div>
            </div>

            {/* Menu Categories */}
            <div className="space-y-8">
              {categories.length === 0 ? (
                <div className="text-center py-12">
                  <h3 className="text-lg font-semibold mb-2">Menu em preparação</h3>
                  <p className="text-muted-foreground">
                    Este restaurante ainda está organizando seu menu. Volte em breve!
                  </p>
                </div>
              ) : (
                categories.map((category) => {
                  const categoryProducts = getProductsByCategory(category.id);
                  if (categoryProducts.length === 0) return null;

                  // Get emoji for category based on name
                  const categoryEmoji = getCategoryEmoji(category.name);

                  return (
                    <div key={category.id} className="mb-8">
                      <h2 className="text-2xl font-bold mb-6 border-b pb-2">
                        {categoryEmoji} {category.name}
                      </h2>
                      
                      {category.description && (
                        <p className="text-muted-foreground mb-4">{category.description}</p>
                      )}
                      
                      <div className="space-y-4">
                        {categoryProducts.map((product) => (
                          <div key={product.id} className="border-l-4 border-primary pl-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg">
                                  {product.name}
                                </h3>
                                {product.description && (
                                  <p className="text-muted-foreground mt-1">
                                    {product.description}
                                  </p>
                                )}
                              </div>
                              <div className="ml-4 text-xl font-bold text-primary">
                                {formatPrice(product.price)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
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