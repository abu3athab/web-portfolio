const summaryItems = document.getElementById("summaryItems");
const summarySubtotal = document.getElementById("summarySubtotal");
const summaryShipping = document.getElementById("summaryShipping");
const summaryTotal = document.getElementById("summaryTotal");
const placeOrderBtn = document.getElementById("placeOrderBtn");
const checkoutMain = document.getElementById("checkoutMain");
const checkoutSuccess = document.getElementById("checkoutSuccess");
const successMessage = document.getElementById("successMessage");
const paymentForm = document.getElementById("paymentForm");

const cart = StoreCart.load();
const entries = StoreCart.getEntries(cart);
const subtotal = StoreCart.getSubtotal(cart);
const shipping = subtotal >= 50 || subtotal === 0 ? 0 : 5.99;
const total = subtotal + shipping;

if (entries.length === 0) {
  window.location.replace("index.html");
}

summaryItems.innerHTML = entries
  .map(
    ({ product, qty }) => `
    <li class="summary-item">
      <span class="summary-emoji">${product.emoji}</span>
      <div class="summary-item-info">
        <strong>${product.name}</strong>
        <span>Qty ${qty} · ${StoreCart.formatPrice(product.price)}</span>
      </div>
      <span class="summary-line-total">${StoreCart.formatPrice(product.price * qty)}</span>
    </li>
  `
  )
  .join("");

summarySubtotal.textContent = StoreCart.formatPrice(subtotal);
summaryShipping.textContent = shipping === 0 ? "Free" : StoreCart.formatPrice(shipping);
summaryTotal.textContent = StoreCart.formatPrice(total);

placeOrderBtn.addEventListener("click", () => {
  const method = paymentForm.payment.value;
  const labels = {
    card: "Credit / Debit card",
    paypal: "PayPal",
    apple: "Apple Pay",
    cod: "Cash on delivery",
  };

  StoreCart.clear();
  checkoutMain.hidden = true;
  checkoutSuccess.hidden = false;
  document.querySelector(".checkout-step").textContent = "Complete";
  successMessage.textContent = `Demo order confirmed via ${labels[method]}. Total: ${StoreCart.formatPrice(total)} — no payment was processed.`;
});
