import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAdmin: false,
      cart: [],
      wishlist: [],
      
      setUser: (user, token, isAdmin = false) => 
        set({ user, token, isAdmin }),
      
      logout: () => 
        set({ user: null, token: null, isAdmin: false, cart: [], wishlist: [] }),
      
      setCart: (cart) => 
        set({ cart }),
      
      addToCart: (item) => 
        set((state) => {
          const existing = state.cart.find(
            (i) => i.product_id === item.product_id && i.size === item.size
          );
          
          if (existing) {
            return {
              cart: state.cart.map((i) =>
                i.product_id === item.product_id && i.size === item.size
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            };
          }
          
          return { cart: [...state.cart, item] };
        }),
      
      removeFromCart: (productId, size) =>
        set((state) => ({
          cart: state.cart.filter(
            (i) => !(i.product_id === productId && i.size === size)
          ),
        })),
      
      clearCart: () => set({ cart: [] }),

      // Wishlist Management
      setWishlist: (wishlist) => set({ wishlist }),
      
      toggleWishlist: (product) => set((state) => {
        const exists = state.wishlist.some(p => p.id === product.id);
        if (exists) {
          return { wishlist: state.wishlist.filter(p => p.id !== product.id) };
        }
        return { wishlist: [...state.wishlist, product] };
      }),
      
      removeFromWishlist: (productId) => set((state) => ({
        wishlist: state.wishlist.filter(p => p.id !== productId)
      })),
      
      clearWishlist: () => set({ wishlist: [] }),
    }),
    {
      name: 'vs-fashion-store',
    }
  )
);

export default useStore;
