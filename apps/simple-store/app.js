const PRODUCTS = [
  { id: "p1", name: "Wireless Earbuds", price: 49.99, emoji: "🎧", category: "Audio" },
  { id: "p2", name: "Desk Lamp", price: 34.5, emoji: "💡", category: "Home" },
  { id: "p3", name: "Water Bottle", price: 18.0, emoji: "🥤", category: "Outdoors" },
  { id: "p4", name: "Notebook Set", price: 12.99, emoji: "📓", category: "Stationery" },
  { id: "p5", name: "Phone Stand", price: 15.99, emoji: "📱", category: "Accessories" },
  { id: "p6", name: "Coffee Mug", price: 9.99, emoji: "☕", category: "Kitchen" },
  { id: "p7", name: "Backpack", price: 59.0, emoji: "🎒", category: "Bags" },
  { id: "p8", name: "USB-C Hub", price: 42.0, emoji: "🔌", category: "Tech" },
];

const TRENDING_IDS = ["p1", "p7", "p6", "p8", "p3", "p5"];
const STORAGE_KEY = "simple-store-cart";

const productsGrid = document.getElementById("productsGrid");
const trendingTrack = document.getElementById("trendingTrack");
const chipTrack = document.getElementById("chipTrack");
const filterEmpty = document.getElementById("filterEmpty");
const cartItemsEl = document.getElementById("cartItems");
const cartEmptyEl = document.getElementById("cartEmpty");
const cartFooterEl = document.getElementById("cartFooter");
const cartTotalEl = document.getElementById("cartTotal");
const cartCountEl = document.getElementById("cartCount");
const cartPanel = document.getElementById("cartPanel");
const cartOverlay = document.getElementById("cartOverlay");
const cartToggle = document.getElementById("cartToggle");
const closeCart = document.getElementById("closeCart");
const clearCartBtn = document.getElementById("clearCartBtn");
const checkoutBtn = document.getElementById("checkoutBtn");

let cart = loadCart();
let activeCategory = "All";

function loadCart() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function saveCart() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
}

function formatPrice(n) {
  return `$${n.toFixed(2)}`;
}

function getCartCount() {
  return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
}

function getCartTotal() {
  return Object.entries(cart).reduce((sum, [id, qty]) => {
    const product = PRODUCTS.find((p) => p.id === id);
    return sum + (product ? product.price * qty : 0);
  }, 0);
}

function addToCart(id) {
  cart[id] = (cart[id] || 0) + 1;
  saveCart();
  renderCart();
  openCart();
}

function updateQty(id, delta) {
  if (!cart[id]) return;
  cart[id] += delta;
  if (cart[id] <= 0) delete cart[id];
  saveCart();
  renderCart();
}

function removeFromCart(id) {
  delete cart[id];
  saveCart();
  renderCart();
}

function clearCart() {
  cart = {};
  saveCart();
  renderCart();
}

function bindAddButtons(root) {
  root.querySelectorAll(".btn-add").forEach((btn) => {
    btn.addEventListener("click", () => addToCart(btn.dataset.id));
  });
}

function getFilteredProducts() {
  if (activeCategory === "All") return PRODUCTS;
  return PRODUCTS.filter((p) => p.category === activeCategory);
}

function renderChips() {
  const categories = ["All", ...new Set(PRODUCTS.map((p) => p.category))];
  chipTrack.innerHTML = categories
    .map(
      (cat) =>
        `<button type="button" class="chip${cat === activeCategory ? " active" : ""}" data-category="${cat}">${cat}</button>`
    )
    .join("");

  chipTrack.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      activeCategory = chip.dataset.category;
      renderChips();
      renderProducts();
    });
  });
}

function productCardHtml(p, compact = false) {
  if (compact) {
    return `
      <article class="h-scroll-item">
        <div class="product-visual">${p.emoji}</div>
        <h4>${p.name}</h4>
        <p class="product-price">${formatPrice(p.price)}</p>
        <button type="button" class="btn-add" data-id="${p.id}">Add to cart</button>
      </article>
    `;
  }
  return `
    <article class="product-card">
      <div class="product-visual">${p.emoji}</div>
      <span class="product-category">${p.category}</span>
      <h3>${p.name}</h3>
      <p class="product-price">${formatPrice(p.price)}</p>
      <button type="button" class="btn-add" data-id="${p.id}">Add to cart</button>
    </article>
  `;
}

function renderProducts() {
  const filtered = getFilteredProducts();
  productsGrid.innerHTML = filtered.map((p) => productCardHtml(p)).join("");
  filterEmpty.hidden = filtered.length > 0;
  bindAddButtons(productsGrid);
}

function renderTrending() {
  const trending = TRENDING_IDS.map((id) => PRODUCTS.find((p) => p.id === id)).filter(Boolean);
  trendingTrack.innerHTML = trending.map((p) => productCardHtml(p, true)).join("");
  bindAddButtons(trendingTrack);
}

function renderCart() {
  const count = getCartCount();
  const entries = Object.entries(cart).filter(([, qty]) => qty > 0);

  cartCountEl.textContent = count;
  cartCountEl.hidden = count === 0;

  if (entries.length === 0) {
    cartItemsEl.innerHTML = "";
    cartEmptyEl.hidden = false;
    cartFooterEl.hidden = true;
    return;
  }

  cartEmptyEl.hidden = true;
  cartFooterEl.hidden = false;
  cartTotalEl.textContent = formatPrice(getCartTotal());

  cartItemsEl.innerHTML = entries
    .map(([id, qty]) => {
      const p = PRODUCTS.find((x) => x.id === id);
      if (!p) return "";
      return `
        <li class="cart-item">
          <span class="cart-item-emoji">${p.emoji}</span>
          <div class="cart-item-info">
            <strong>${p.name}</strong>
            <span>${formatPrice(p.price)} each</span>
          </div>
          <div class="cart-item-actions">
            <button type="button" class="qty-btn" data-id="${id}" data-delta="-1" aria-label="Decrease">−</button>
            <span class="qty">${qty}</span>
            <button type="button" class="qty-btn" data-id="${id}" data-delta="1" aria-label="Increase">+</button>
            <button type="button" class="remove-btn" data-id="${id}" aria-label="Remove">Remove</button>
          </div>
        </li>
      `;
    })
    .join("");

  cartItemsEl.querySelectorAll(".qty-btn").forEach((btn) => {
    btn.addEventListener("click", () => updateQty(btn.dataset.id, Number(btn.dataset.delta)));
  });

  cartItemsEl.querySelectorAll(".remove-btn").forEach((btn) => {
    btn.addEventListener("click", () => removeFromCart(btn.dataset.id));
  });
}

function openCart() {
  cartPanel.classList.add("open");
  cartPanel.setAttribute("aria-hidden", "false");
  cartOverlay.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeCartPanel() {
  cartPanel.classList.remove("open");
  cartPanel.setAttribute("aria-hidden", "true");
  cartOverlay.hidden = true;
  document.body.style.overflow = "";
}

cartToggle.addEventListener("click", openCart);
closeCart.addEventListener("click", closeCartPanel);
cartOverlay.addEventListener("click", closeCartPanel);
clearCartBtn.addEventListener("click", clearCart);
checkoutBtn.addEventListener("click", () => {
  const total = getCartTotal();
  const count = getCartCount();
  if (count === 0) return;
  alert(
    `Demo checkout\n\n${count} item(s)\nTotal: ${formatPrice(total)}\n\nThis is a proof of concept — no payment processed.`
  );
  clearCart();
  closeCartPanel();
});

renderChips();
renderProducts();
renderTrending();
renderCart();
