const CART_KEY = "smartlogix_cart";

export type CartItem = {
  sku: string;
  productName: string;
  price: number;
  imageUrl: string;
  quantity: number;
};

export const CartService = {
  getCart: (): CartItem[] => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  save: (items: CartItem[]) => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  },

  addItem: (product: Omit<CartItem, "quantity">, quantity = 1) => {
    const cart = CartService.getCart();
    const existing = cart.find((i) => i.sku === product.sku);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({ ...product, quantity });
    }
    CartService.save(cart);
  },

  removeItem: (sku: string) => {
    const cart = CartService.getCart().filter((i) => i.sku !== sku);
    CartService.save(cart);
  },

  updateQuantity: (sku: string, quantity: number) => {
    if (quantity <= 0) {
      CartService.removeItem(sku);
      return;
    }
    const cart = CartService.getCart().map((i) =>
      i.sku === sku ? { ...i, quantity } : i
    );
    CartService.save(cart);
  },

  clearCart: () => {
    localStorage.removeItem(CART_KEY);
  },

  getCount: (): number => {
    return CartService.getCart().reduce((sum, i) => sum + i.quantity, 0);
  },

  getTotal: (): number => {
    return CartService.getCart().reduce(
      (sum, i) => sum + i.price * i.quantity,
      0
    );
  },
};
