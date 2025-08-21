import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

export interface MenuData {
  restaurant: Restaurant | null;
  categories: Category[];
  products: Product[];
  loading: boolean;
}

export function useRestaurantMenu(slug: string) {
  const [menuData, setMenuData] = useState<MenuData>({
    restaurant: null,
    categories: [],
    products: [],
    loading: true,
  });

  useEffect(() => {
    fetchMenuData();
  }, [slug]);

  const fetchMenuData = async () => {
    try {
      // Fetch restaurant
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (restaurantError) throw restaurantError;

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', restaurantData.id)
        .order('display_order');

      if (categoriesError) throw categoriesError;

      // Fetch products
      let productsData = [];
      if (categoriesData && categoriesData.length > 0) {
        const { data: fetchedProducts, error: productsError } = await supabase
          .from('products')
          .select('*')
          .in('category_id', categoriesData.map(c => c.id))
          .eq('is_available', true)
          .order('display_order');

        if (productsError) throw productsError;
        productsData = fetchedProducts || [];
      }

      setMenuData({
        restaurant: restaurantData,
        categories: categoriesData || [],
        products: productsData,
        loading: false,
      });

    } catch (error) {
      console.error('Error fetching menu data:', error);
      setMenuData(prev => ({ ...prev, loading: false }));
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const getProductsByCategory = (categoryId: string) => {
    return menuData.products.filter(product => product.category_id === categoryId);
  };

  const getCategoryEmoji = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('entrada') || lowerName.includes('snack')) return '🥟';
    if (lowerName.includes('hambúrguer') || lowerName.includes('burger')) return '🍔';
    if (lowerName.includes('pizza')) return '🍕';
    if (lowerName.includes('calzone')) return '🥟';
    if (lowerName.includes('doce') || lowerName.includes('sobremesa')) return '🍫';
    if (lowerName.includes('açaí')) return '🥤';
    if (lowerName.includes('bebida')) return '🥤';
    return '🍽️';
  };

  const getFormattedMenu = () => {
    if (!menuData.restaurant) return null;

    const menu = {
      restaurant: {
        name: menuData.restaurant.name,
        address: menuData.restaurant.address,
        phone: menuData.restaurant.phone,
        whatsapp: menuData.restaurant.whatsapp,
        instagram: menuData.restaurant.instagram,
      },
      menu: menuData.categories.map(category => {
        const products = getProductsByCategory(category.id);
        return {
          id: category.id,
          name: category.name,
          emoji: getCategoryEmoji(category.name),
          description: category.description,
          products: products.map(product => ({
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            formattedPrice: formatPrice(product.price),
          })),
        };
      }).filter(category => category.products.length > 0),
    };

    return menu;
  };

  return {
    ...menuData,
    formatPrice,
    getProductsByCategory,
    getCategoryEmoji,
    getFormattedMenu,
  };
}