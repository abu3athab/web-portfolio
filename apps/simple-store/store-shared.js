const StoreProducts = {
  list: [
    { id: "p1", name: "Wireless Earbuds", price: 49.99, emoji: "🎧", category: "Audio" },
    { id: "p2", name: "Desk Lamp", price: 34.5, emoji: "💡", category: "Home" },
    { id: "p3", name: "Water Bottle", price: 18.0, emoji: "🥤", category: "Outdoors" },
    { id: "p4", name: "Notebook Set", price: 12.99, emoji: "📓", category: "Stationery" },
    { id: "p5", name: "Phone Stand", price: 15.99, emoji: "📱", category: "Accessories" },
    { id: "p6", name: "Coffee Mug", price: 9.99, emoji: "☕", category: "Kitchen" },
    { id: "p7", name: "Backpack", price: 59.0, emoji: "🎒", category: "Bags" },
    { id: "p8", name: "USB-C Hub", price: 42.0, emoji: "🔌", category: "Tech" },
  ],
  trendingIds: ["p1", "p7", "p6", "p8", "p3", "p5"],
  spotlightId: "p7",
};

const StoreCart = {
  key: "simple-store-cart",

  load() {
    try {
      const saved = localStorage.getItem(this.key);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  },

  save(cart) {
    localStorage.setItem(this.key, JSON.stringify(cart));
  },

  clear() {
    localStorage.removeItem(this.key);
  },

  formatPrice(n) {
    return `$${n.toFixed(2)}`;
  },

  getProduct(id) {
    return StoreProducts.list.find((p) => p.id === id);
  },

  getCount(cart) {
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  },

  getSubtotal(cart) {
    return Object.entries(cart).reduce((sum, [id, qty]) => {
      const product = this.getProduct(id);
      return sum + (product ? product.price * qty : 0);
    }, 0);
  },

  getEntries(cart) {
    return Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => ({ product: this.getProduct(id), qty }))
      .filter((e) => e.product);
  },
};
