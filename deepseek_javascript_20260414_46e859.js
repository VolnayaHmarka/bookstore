(function(){
  "use strict";

  // ---------- DATA (mock books) ----------
  const BOOKS = [
    { id: 'b1', title: 'The Silent Garden', price: 18.99, description: 'A lyrical journey through hidden courtyards and quiet revelations. Perfect for slow afternoons.' },
    { id: 'b2', title: 'Urban Tides', price: 22.50, description: 'A sharp, modern fable about change, cities, and the people who drift between them.' },
    { id: 'b3', title: 'The Paper Lantern', price: 14.95, description: 'Historical mystery set in old Kyoto. Secrets, shadows, and soft light.' },
    { id: 'b4', title: 'Recipes from the Blue Kitchen', price: 29.99, description: 'More than a cookbook — stories, comfort, and a splash of nostalgia.' },
    { id: 'b5', title: 'Echoes of the Fjord', price: 17.25, description: 'Nordic noir meets family saga. Unputdownable.' },
    { id: 'b6', title: 'Midnight Codex', price: 26.00, description: 'A bibliophile\'s dream wrapped in a tech thriller. Page-turner.' }
  ];

  // ---------- GLOBAL STATE ----------
  let currentRoute = 'home';            // home, catalog, product, cart, about
  let selectedProductId = null;         // for product detail
  
  // Cart state: array of { id, title, price, quantity }
  let cart = [];

  // ---------- LOCALSTORAGE ----------
  const STORAGE_KEY = 'pagequill_cart';

  function loadCartFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        cart = JSON.parse(stored);
        cart = cart.map(item => ({ ...item, quantity: Number(item.quantity), price: Number(item.price) }));
      } else {
        cart = [];
      }
    } catch (e) {
      cart = [];
    }
  }

  function saveCartToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }

  // ---------- CART OPERATIONS ----------
  function addToCart(bookId, bookTitle, bookPrice, quantity = 1) {
    const existing = cart.find(item => item.id === bookId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({
        id: bookId,
        title: bookTitle,
        price: Number(bookPrice),
        quantity: quantity
      });
    }
    saveCartToStorage();
    renderView();
    updateNavActiveClass();
  }

  function removeFromCart(bookId) {
    cart = cart.filter(item => item.id !== bookId);
    saveCartToStorage();
    renderView();
    updateNavActiveClass();
  }

  function updateQuantity(bookId, delta) {
    const item = cart.find(i => i.id === bookId);
    if (!item) return;
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      removeFromCart(bookId);
    } else {
      item.quantity = newQty;
      saveCartToStorage();
      renderView();
      updateNavActiveClass();
    }
  }

  function getCartTotal() {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  function getCartCount() {
    return cart.reduce((count, item) => count + item.quantity, 0);
  }

  // ---------- ROUTING (SPA) ----------
  function navigateTo(route, productId = null) {
    currentRoute = route;
    if (route === 'product' && productId) {
      selectedProductId = productId;
    } else {
      selectedProductId = null;
    }
    
    window.location.hash = route + (productId ? '/'+productId : '');
    
    renderView();
    updateNavActiveClass();
  }

  function initRouteFromHash() {
    const hash = window.location.hash.slice(1) || 'home';
    const parts = hash.split('/');
    let route = parts[0];
    const validRoutes = ['home', 'catalog', 'product', 'cart', 'about'];
    if (!validRoutes.includes(route)) route = 'home';
    
    if (route === 'product' && parts[1]) {
      currentRoute = 'product';
      selectedProductId = parts[1];
    } else {
      currentRoute = route;
      selectedProductId = null;
    }
    renderView();
    updateNavActiveClass();
  }

  // ---------- UI RENDER ----------
  const appView = document.getElementById('appView');
  const navContainer = document.getElementById('mainNav');

  function renderNavigation() {
    const routes = [
      { id: 'home', label: 'Home' },
      { id: 'catalog', label: 'Books' },
      { id: 'cart', label: `Cart (${getCartCount()})` },
      { id: 'about', label: 'About' }
    ];
    navContainer.innerHTML = routes.map(r => 
      `<button class="nav-btn" data-route="${r.id}">${r.label}</button>`
    ).join('');
    
    navContainer.querySelectorAll('[data-route]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const route = btn.dataset.route;
        navigateTo(route);
      });
    });
  }

  function updateNavActiveClass() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      const route = btn.dataset.route;
      if (route === currentRoute) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
      if (route === 'cart') {
        btn.textContent = `Cart (${getCartCount()})`;
      }
    });
  }

  function renderView() {
    if (!appView) return;
    
    const cartBtn = navContainer.querySelector('[data-route="cart"]');
    if (cartBtn) cartBtn.textContent = `Cart (${getCartCount()})`;

    switch (currentRoute) {
      case 'home': renderHome(); break;
      case 'catalog': renderCatalog(); break;
      case 'product': renderProductDetail(); break;
      case 'cart': renderCart(); break;
      case 'about': renderAbout(); break;
      default: renderHome();
    }
  }

  // ---------- PAGE RENDERERS ----------
  function renderHome() {
    appView.innerHTML = `
      <div class="hero">
        <h2>📚 Page & Quill</h2>
        <p style="font-size:1.3rem; margin-top:1rem;">A quiet corner for book lovers. <br> Offline, always.</p>
        <div class="nav-links-inline">
          <button class="btn btn-primary" data-nav="catalog">Browse books</button>
          <button class="btn btn-outline" data-nav="cart">View cart</button>
        </div>
        <p class="text-muted mt-4">✨ 100% offline · local storage cart</p>
      </div>
    `;
    appView.querySelector('[data-nav="catalog"]')?.addEventListener('click', ()=> navigateTo('catalog'));
    appView.querySelector('[data-nav="cart"]')?.addEventListener('click', ()=> navigateTo('cart'));
  }

  function renderCatalog() {
    const booksHtml = BOOKS.map(book => `
      <div class="book-card">
        <div class="book-img">📖 ${book.title.substring(0,12)}</div>
        <div class="book-title">${book.title}</div>
        <div class="book-price">$${book.price.toFixed(2)}</div>
        <div class="card-actions">
          <button class="btn btn-outline view-detail" data-id="${book.id}">View</button>
          <button class="btn btn-primary add-to-cart" data-id="${book.id}" data-title="${book.title}" data-price="${book.price}">Add to cart</button>
        </div>
      </div>
    `).join('');
    
    appView.innerHTML = `
      <section>
        <h2 style="font-size:2rem; margin-bottom:0.5rem;">Our shelves</h2>
        <p class="text-muted">Handpicked reads, ready to travel home.</p>
        <div class="grid-catalog">
          ${booksHtml}
        </div>
      </section>
    `;
    
    appView.querySelectorAll('.view-detail').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.dataset.id;
        navigateTo('product', id);
      });
    });
    appView.querySelectorAll('.add-to-cart').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.dataset.id;
        const title = btn.dataset.title;
        const price = parseFloat(btn.dataset.price);
        addToCart(id, title, price, 1);
      });
    });
  }

  function renderProductDetail() {
    const book = BOOKS.find(b => b.id === selectedProductId);
    if (!book) {
      appView.innerHTML = `<p>Book not found. <button class="btn" data-nav="catalog">Back to catalog</button></p>`;
      appView.querySelector('[data-nav="catalog"]')?.addEventListener('click', ()=> navigateTo('catalog'));
      return;
    }
    appView.innerHTML = `
      <div class="detail-container">
        <div class="detail-img">📘 ${book.title}</div>
        <div class="detail-info">
          <h2>${book.title}</h2>
          <div class="detail-price">$${book.price.toFixed(2)}</div>
          <p class="detail-desc">${book.description} <br><small class="text-muted">(dummy description — offline edition)</small></p>
          <div style="display:flex; gap:1rem;">
            <button class="btn btn-primary" id="addFromDetail" style="padding:0.9rem 2rem;">Add to cart</button>
            <button class="btn btn-outline" data-nav="catalog">← Back to books</button>
          </div>
        </div>
      </div>
    `;
    document.getElementById('addFromDetail').addEventListener('click', () => {
      addToCart(book.id, book.title, book.price, 1);
    });
    appView.querySelector('[data-nav="catalog"]').addEventListener('click', ()=> navigateTo('catalog'));
  }

  function renderCart() {
    if (cart.length === 0) {
      appView.innerHTML = `
        <div class="empty-message">
          <h2>🛒 Your cart is empty</h2>
          <p>Find something you love in the catalog.</p>
          <button class="btn btn-primary mt-4" data-nav="catalog">Explore books</button>
        </div>
      `;
      appView.querySelector('[data-nav="catalog"]')?.addEventListener('click', ()=> navigateTo('catalog'));
      return;
    }

    const itemsHtml = cart.map(item => `
      <div class="cart-item" data-id="${item.id}">
        <div class="cart-item-info">
          <div class="cart-item-name">${item.title}</div>
          <div class="cart-item-price">$${item.price.toFixed(2)} each</div>
        </div>
        <div class="cart-controls">
          <button class="qty-btn dec-qty" data-id="${item.id}">−</button>
          <span class="cart-qty">${item.quantity}</span>
          <button class="qty-btn inc-qty" data-id="${item.id}">+</button>
        </div>
        <div style="margin-left:auto; font-weight:600;">$${(item.price * item.quantity).toFixed(2)}</div>
        <button class="btn btn-danger remove-item" data-id="${item.id}" style="padding:0.4rem 1rem;">Remove</button>
      </div>
    `).join('');

    const total = getCartTotal();

    appView.innerHTML = `
      <section>
        <h2 style="font-size:2rem;">Your cart</h2>
        <div class="cart-items">
          ${itemsHtml}
        </div>
        <div class="cart-total">Total: $${total.toFixed(2)}</div>
        <div style="display:flex; gap:1rem; margin-top:1rem;">
          <button class="btn btn-primary" id="continueShopping">Continue shopping</button>
          <button class="btn btn-outline" id="clearCartBtn">Clear cart</button>
        </div>
      </section>
    `;

    appView.querySelectorAll('.dec-qty').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.dataset.id;
        updateQuantity(id, -1);
      });
    });
    appView.querySelectorAll('.inc-qty').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.dataset.id;
        updateQuantity(id, 1);
      });
    });
    appView.querySelectorAll('.remove-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.dataset.id;
        removeFromCart(id);
      });
    });
    document.getElementById('continueShopping')?.addEventListener('click', ()=> navigateTo('catalog'));
    document.getElementById('clearCartBtn')?.addEventListener('click', ()=> {
      cart = [];
      saveCartToStorage();
      renderView();
      updateNavActiveClass();
    });
  }

  function renderAbout() {
    appView.innerHTML = `
      <div class="about-card">
        <h2 style="font-size:2.2rem;">📬 Page & Quill</h2>
        <p style="margin: 1.5rem 0;">Est. 2026 · offline-first bookstore demo</p>
        <p>📍 221B Paper Street, Literary Lane</p>
        <p>📞 +1 (555) 204- BOOK</p>
        <p>✉️ hello@pagequill.offline</p>
        <p class="text-muted mt-4">This SPA works entirely offline. Cart saved in your browser.</p>
      </div>
    `;
  }

  // ---------- INITIALIZE ----------
  function initApp() {
    loadCartFromStorage();
    renderNavigation();
    window.addEventListener('hashchange', initRouteFromHash);
    if (window.location.hash) {
      initRouteFromHash();
    } else {
      navigateTo('home');
    }
  }

  initApp();
})();