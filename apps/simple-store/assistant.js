(function () {
  const panel = document.getElementById("assistantPanel");
  const toggle = document.getElementById("assistantToggle");
  const closeBtn = document.getElementById("assistantClose");
  const messagesEl = document.getElementById("assistantMessages");
  const form = document.getElementById("assistantForm");
  const input = document.getElementById("assistantInput");
  const chipsEl = document.getElementById("assistantChips");

  if (!panel || !toggle) return;

  const AI_MODEL = "google/gemini-2.0-flash";

  const CATEGORY_HINTS = {
    audio: ["audio", "music", "earbuds", "headphones", "listen"],
    home: ["home", "desk", "lamp", "office", "work", "setup"],
    outdoors: ["outdoor", "travel", "hike", "gym", "bottle"],
    stationery: ["study", "notes", "notebook", "school", "write"],
    accessories: ["phone", "stand", "accessory", "desk"],
    kitchen: ["kitchen", "coffee", "mug", "drink"],
    bags: ["bag", "backpack", "carry", "commute"],
    tech: ["tech", "usb", "hub", "laptop", "computer"],
  };

  const USE_CASES = {
    travel: ["p7", "p3", "p1"],
    office: ["p2", "p5", "p8", "p4"],
    budget: ["p6", "p4", "p3"],
    gift: ["p6", "p4", "p1"],
  };

  function buildCatalogContext() {
    return StoreProducts.list
      .map(
        (p) =>
          `- ${p.emoji} ${p.name} (${p.category}): ${StoreCart.formatPrice(p.price)} [id:${p.id}]`
      )
      .join("\n");
  }

  function buildCartContext() {
    const cart = StoreCart.load();
    const entries = StoreCart.getEntries(cart);
    if (!entries.length) return "Cart is empty.";
    return entries
      .map(({ product, qty }) => `${product.name} x${qty} — ${StoreCart.formatPrice(product.price * qty)}`)
      .join(", ");
  }

  function buildSystemPrompt() {
    return `You are a friendly shopping assistant for "Simple Store", a demo e-commerce POC.
Answer briefly (2-4 sentences). Use markdown sparingly. Suggest real products from the catalog only.
Do not invent products. Prices are USD.

Catalog:
${buildCatalogContext()}

Customer cart: ${buildCartContext()}
Free shipping over $50. Demo store only — no real payments.`;
  }

  function formatProductList(products) {
    if (!products.length) return "I couldn't find matching products.";
    return products
      .map((p) => `${p.emoji} **${p.name}** — ${StoreCart.formatPrice(p.price)} (${p.category})`)
      .join("\n");
  }

  function findByBudget(maxPrice) {
    return StoreProducts.list.filter((p) => p.price <= maxPrice).sort((a, b) => a.price - b.price);
  }

  function findByKeywords(text) {
    const words = text.toLowerCase();
    const scores = StoreProducts.list.map((p) => {
      let score = 0;
      if (words.includes(p.name.toLowerCase())) score += 5;
      if (words.includes(p.category.toLowerCase())) score += 3;
      Object.entries(CATEGORY_HINTS).forEach(([cat, hints]) => {
        if (p.category.toLowerCase() === cat && hints.some((h) => words.includes(h))) score += 4;
      });
      return { product: p, score };
    });
    return scores
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.product);
  }

  function getLocalResponse(message) {
    const q = message.toLowerCase().trim();
    const cart = StoreCart.load();
    const count = StoreCart.getCount(cart);
    const subtotal = StoreCart.getSubtotal(cart);

    if (/^(hi|hello|hey|salam|marhaba)\b/.test(q)) {
      return "Hi! I'm your Simple Store assistant. Ask about products, budgets, or your cart — try “under $20” or “office setup”.";
    }

    if (/help|what can you|how do you/.test(q)) {
      return "I can:\n• Recommend products by category or budget\n• Summarize your cart\n• Suggest travel, office, or gift picks\n• Compare prices";
    }

    if (/cart|basket|checkout/.test(q)) {
      if (!count) return "Your cart is empty. Browse **All products** or ask me for recommendations!";
      const shipping = subtotal >= 50 ? "free" : StoreCart.formatPrice(5.99);
      return `You have **${count} item(s)** for **${StoreCart.formatPrice(subtotal)}**. Shipping: ${shipping}. Ready to checkout when you are.`;
    }

    if (/cheapest|lowest price|affordable/.test(q)) {
      const sorted = [...StoreProducts.list].sort((a, b) => a.price - b.price);
      return `Our most affordable picks:\n${formatProductList(sorted.slice(0, 3))}`;
    }

    if (/expensive|premium|highest/.test(q)) {
      const sorted = [...StoreProducts.list].sort((a, b) => b.price - a.price);
      return `Top-priced items:\n${formatProductList(sorted.slice(0, 3))}`;
    }

    const budgetMatch = q.match(/under\s+\$?(\d+(?:\.\d+)?)|below\s+\$?(\d+(?:\.\d+)?)|less than\s+\$?(\d+(?:\.\d+)?)/);
    if (budgetMatch) {
      const max = Number(budgetMatch[1] || budgetMatch[2] || budgetMatch[3]);
      const picks = findByBudget(max);
      return picks.length
        ? `Under ${StoreCart.formatPrice(max)}:\n${formatProductList(picks)}`
        : `Nothing under ${StoreCart.formatPrice(max)} right now. The cheapest item is ${StoreCart.formatPrice(Math.min(...StoreProducts.list.map((p) => p.price)))}.`;
    }

    if (/travel|trip|commute|flight/.test(q)) {
      const ids = USE_CASES.travel;
      return `For travel I'd suggest:\n${formatProductList(ids.map((id) => StoreCart.getProduct(id)).filter(Boolean))}`;
    }

    if (/office|desk|work from home|wfh|study/.test(q)) {
      const ids = USE_CASES.office;
      return `Office / desk setup ideas:\n${formatProductList(ids.map((id) => StoreCart.getProduct(id)).filter(Boolean))}`;
    }

    if (/gift|present/.test(q)) {
      const ids = USE_CASES.gift;
      return `Gift-friendly picks:\n${formatProductList(ids.map((id) => StoreCart.getProduct(id)).filter(Boolean))}`;
    }

    if (/shipping|delivery|free ship/.test(q)) {
      return "Demo shipping is **free on orders over $50**. Under that, a flat **$5.99** applies at checkout.";
    }

    if (/category|categories|what do you sell/.test(q)) {
      const cats = [...new Set(StoreProducts.list.map((p) => p.category))];
      return `We stock: **${cats.join(", ")}**. Ask e.g. “tech under $45” or “kitchen items”.`;
    }

    if (/trending|popular|best seller/.test(q)) {
      const trending = StoreProducts.trendingIds
        .map((id) => StoreCart.getProduct(id))
        .filter(Boolean)
        .slice(0, 4);
      return `Trending now:\n${formatProductList(trending)}`;
    }

    const keywordHits = findByKeywords(q);
    if (keywordHits.length) {
      return `Here's what matches your search:\n${formatProductList(keywordHits.slice(0, 4))}`;
    }

    return `I'm not sure about that, but here are all **${StoreProducts.list.length}** products:\n${formatProductList(StoreProducts.list.slice(0, 5))}\n\n…and more in the catalog. Try “under $20” or “travel essentials”.`;
  }

  function extractPuterText(response) {
    if (typeof response === "string") return response.trim();
    const content = response?.message?.content;
    if (typeof content === "string") return content.trim();
    if (Array.isArray(content) && content[0]?.text) return content[0].text.trim();
    if (response?.text) return response.text.trim();
    return null;
  }

  async function askPuter(message) {
    if (typeof puter === "undefined" || !puter?.ai?.chat) {
      throw new Error("Puter not loaded");
    }

    const response = await puter.ai.chat(
      [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: message },
      ],
      { model: AI_MODEL, temperature: 0.7, max_tokens: 280 }
    );

    const text = extractPuterText(response);
    if (!text) throw new Error("Empty AI response");
    return text;
  }

  function renderMarkdown(text) {
    return text
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br>");
  }

  function appendMessage(role, text, isTyping = false) {
    const el = document.createElement("div");
    el.className = `assistant-msg assistant-msg-${role}${isTyping ? " typing" : ""}`;
    el.innerHTML = isTyping ? '<span class="dot-pulse"><span></span><span></span><span></span></span>' : renderMarkdown(text);
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return el;
  }

  async function handleSend(message) {
    const trimmed = message.trim();
    if (!trimmed) return;

    appendMessage("user", trimmed);
    input.value = "";
    const typing = appendMessage("assistant", "", true);

    let reply = null;
    try {
      reply = await askPuter(trimmed);
    } catch {
      reply = null;
    }

    if (!reply) reply = getLocalResponse(trimmed);

    typing.classList.remove("typing");
    typing.innerHTML = renderMarkdown(reply);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function openPanel() {
    panel.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
    input.focus();
  }

  function closePanel() {
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
  }

  toggle.addEventListener("click", () => {
    if (panel.classList.contains("open")) closePanel();
    else openPanel();
  });

  closeBtn.addEventListener("click", closePanel);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    handleSend(input.value);
  });

  chipsEl.querySelectorAll(".assistant-chip").forEach((chip) => {
    chip.addEventListener("click", () => handleSend(chip.dataset.prompt));
  });

  appendMessage(
    "assistant",
    "Hi! I'm your **shopping assistant**, powered by AI. Ask about products, your cart, or try a quick suggestion below."
  );
})();
