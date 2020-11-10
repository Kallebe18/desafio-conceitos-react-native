/* eslint-disable no-param-reassign */
import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsList = await AsyncStorage.getItem('products').then(json => {
        return JSON.parse(json || '[]') as Product[];
      });
      setProducts(productsList);
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async (product: Product) => {
      const productAlreadyExists = products.findIndex(p => p.id === product.id);
      if (productAlreadyExists !== -1) {
        setProducts(
          products.map(p => {
            if (p.id === product.id) {
              p.quantity += 1;
            }
            return p;
          }),
        );
      } else {
        product.quantity = 1;
        setProducts([...products, product]);
      }
      await AsyncStorage.setItem('products', JSON.stringify(products));
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      setProducts(
        products.map(p => {
          if (p.id === id) {
            p.quantity += 1;
          }
          return p;
        }),
      );
      await AsyncStorage.setItem('products', JSON.stringify(products));
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const decremented = products.map(p => {
        if (p.id === id) {
          p.quantity -= 1;
        }
        return p;
      });
      setProducts(decremented.filter(p => p.quantity > 0));
      await AsyncStorage.setItem('products', JSON.stringify(products));
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
