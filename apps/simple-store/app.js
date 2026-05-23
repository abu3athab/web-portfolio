const PRODUCTS = StoreProducts.list;
const TRENDING_IDS = StoreProducts.trendingIds;

const productsGrid = document.getElementById("productsGrid");
const trendingTrack = document.getElementById("trendingTrack");
const chipTrack = document.getElementById("chipTrack");
const filterEmpty = document.getElementById("filterEmpty");
const spotlightEl = document.getElementById("spotlightProduct");
const compactRowsEl = document.getElementById("compactRows");
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

let cart = StoreCart.load();
let activeCategory = "All";

function saveCart() {
  StoreCart.save(cart);
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
        <p class="product-price">${StoreCart.formatPrice(p.price)}</p>
        <button type="button" class="btn-add" data-id="${p.id}">Add to cart</button>
      </article>
    `;
  }
  return `
    <article class="product-card">
      <div class="product-visual">${p.emoji}</div>
      <span class="product-category">${p.category}</span>
      <h3>${p.name}</h3>
      <p class="product-price">${StoreCart.formatPrice(p.price)}</p>
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
  const trending = TRENDING_IDS.map((id) => StoreCart.getProduct(id)).filter(Boolean);
  trendingTrack.innerHTML = trending.map((p) => productCardHtml(p, true)).join("");
  bindAddButtons(trendingTrack);
}

function renderSpotlight() {
  const p = StoreCart.getProduct(StoreProducts.spotlightId);
  if (!p || !spotlightEl) return;
  spotlightEl.innerHTML = `
    <div class="spotlight-visual">${p.emoji}</div>
    <div class="spotlight-body">
      <span class="spotlight-tag">Featured pick</span>
      <h3>${p.name}</h3>
      <p>Our top-rated bag for work and travel — spacious, durable, and demo-ready for your portfolio.</p>
      <div class="spotlight-meta">
        <span class="product-price">${StoreCart.formatPrice(p.price)}</span>
        <span class="spotlight-rating">★★★★★ <em>128 reviews</em></span>
      </div>
      <button type="button" class="btn-add" data-id="${p.id}">Add to cart</button>
    </div>
  `;
  bindAddButtons(spotlightEl);
}

function renderCompactRows() {
  const picks = ["p2", "p4", "p6"].map((id) => StoreCart.getProduct(id)).filter(Boolean);
  compactRowsEl.innerHTML = picks
    .map(
      (p) => `
    <article class="product-row">
      <div class="product-row-visual">${p.emoji}</div>
      <div class="product-row-body">
        <span class="product-category">${p.category}</span>
        <h3>${p.name}</h3>
        <p class="product-price">${StoreCart.formatPrice(p.price)}</p>
      </div>
      <button type="button" class="btn-add btn-add-row" data-id="${p.id}">Add</button>
    </article>
  `
    )
    .join("");
  bindAddButtons(compactRowsEl);
}

function renderCart() {
  const count = StoreCart.getCount(cart);
  const entries = StoreCart.getEntries(cart);

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
  cartTotalEl.textContent = StoreCart.formatPrice(StoreCart.getSubtotal(cart));

  cartItemsEl.innerHTML = entries
    .map(({ product, qty }) => {
      return `
        <li class="cart-item">
          <span class="cart-item-emoji">${product.emoji}</span>
          <div class="cart-item-info">
            <strong>${product.name}</strong>
            <span>${StoreCart.formatPrice(product.price)} each</span>
          </div>
          <div class="cart-item-actions">
            <button type="button" class="qty-btn" data-id="${product.id}" data-delta="-1" aria-label="Decrease">−</button>
            <span class="qty">${qty}</span>
            <button type="button" class="qty-btn" data-id="${product.id}" data-delta="1" aria-label="Increase">+</button>
            <button type="button" class="remove-btn" data-id="${product.id}" aria-label="Remove">Remove</button>
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
  if (StoreCart.getCount(cart) === 0) return;
  closeCartPanel();
  window.location.href = "checkout.html";
});

window.simpleStoreAddToCart = addToCart;

renderChips();
renderSpotlight();
renderProducts();
renderCompactRows();
renderTrending();
renderCart();
