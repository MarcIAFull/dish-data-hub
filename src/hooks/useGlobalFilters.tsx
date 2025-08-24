import { useState, useEffect } from 'react';
import { useRestaurantsManagement } from './useRestaurantsManagement';

export interface GlobalFilters {
  selectedRestaurants: string[];
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  status?: string;
  searchTerm: string;
}

const defaultFilters: GlobalFilters = {
  selectedRestaurants: [],
  dateRange: {
    from: null,
    to: null,
  },
  searchTerm: '',
};

export const useGlobalFilters = () => {
  const { restaurants } = useRestaurantsManagement();
  const [filters, setFilters] = useState<GlobalFilters>(() => {
    // Load from localStorage
    const saved = localStorage.getItem('globalFilters');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...defaultFilters,
          ...parsed,
          dateRange: {
            from: parsed.dateRange?.from ? new Date(parsed.dateRange.from) : null,
            to: parsed.dateRange?.to ? new Date(parsed.dateRange.to) : null,
          },
        };
      } catch {
        return defaultFilters;
      }
    }
    return defaultFilters;
  });

  // Auto-select all restaurants if none selected and restaurants are loaded
  useEffect(() => {
    if (restaurants.length > 0 && filters.selectedRestaurants.length === 0) {
      setFilters(prev => ({
        ...prev,
        selectedRestaurants: restaurants.map(r => r.id),
      }));
    }
  }, [restaurants, filters.selectedRestaurants.length]);

  // Save to localStorage whenever filters change
  useEffect(() => {
    localStorage.setItem('globalFilters', JSON.stringify(filters));
  }, [filters]);

  const updateFilters = (newFilters: Partial<GlobalFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const resetFilters = () => {
    setFilters({
      ...defaultFilters,
      selectedRestaurants: restaurants.map(r => r.id),
    });
  };

  const selectedRestaurantNames = restaurants
    .filter(r => filters.selectedRestaurants.includes(r.id))
    .map(r => r.name);

  return {
    filters,
    updateFilters,
    resetFilters,
    restaurants,
    selectedRestaurantNames,
  };
};