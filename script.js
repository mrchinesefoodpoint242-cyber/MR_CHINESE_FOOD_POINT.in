/* =========================================================
   MR CHINESE FOOD POINT — SCRIPT.JS
   Cart, search, filter, dark mode, animations, WhatsApp order
   ========================================================= */

/* ---------- CONSTANTS ---------- */
const STORAGE_CART_KEY = "mrcfp_cart";
const STORAGE_THEME_KEY = "mrcfp_theme";
const STORAGE_FAV_KEY = "mrcfp_favs";
const WHATSAPP_NUMBER = "917011869015";
const GST_RATE = 0.05;
const DELIVERY_CHARGE = 20;
const FREE_DELIVERY_ABOVE = 300;

/* ---------- PAYMENT / TIMING CONFIG ---------- */
const UPI_ID = "Q176355265@ybl";        // TODO: replace with the restaurant's real UPI ID
const UPI_PAYEE_NAME = "MRChineseFoodPoint";
const OPEN_HOUR = 11;    // 11:00 AM
const OPEN_MIN  = 0;
const CLOSE_HOUR = 22;   // 10:30 PM
const CLOSE_MIN  = 30;

/* ---------- STATE ---------- */
let cart = JSON.parse(localStorage.getItem(STORAGE_CART_KEY) || "[]");
let favourites = JSON.parse(localStorage.getItem(STORAGE_FAV_KEY) || "[]");
let paymentMode = "cod"; // "cod" | "online"

/* ---------- INIT ---------- */
document.addEventListener("DOMContentLoaded", () => {
  initPreloader();
  initTheme();
  initSkeletonReveal();
  initScrollEffects();
  initFAQ();
  initRipple();
  document.getElementById("year").textContent = new Date().getFullYear();
  updateCart();
  initStoreStatus();
});

/* =========================================================
   PRELOADER
   ========================================================= */
function initPreloader(){
  const pre = document.getElementById("preloader");
  window.addEventListener("load", () => {
    setTimeout(() => pre.classList.add("hide"), 500);
  });
  // fallback in case load already fired
  setTimeout(() => pre.classList.add("hide"), 2000);
}

/* =========================================================
   SKELETON -> REAL CARDS REVEAL
   ========================================================= */
function initSkeletonReveal(){
  setTimeout(() => {
    document.querySelectorAll("[data-skeleton]").forEach(s => s.remove());
    document.querySelectorAll(".food-card").forEach((card, i) => {
      card.hidden = false;
      card.style.animationDelay = (i % 6) * 0.06 + "s";
    });
    renderAllCardControls();
  }, 700);
}

/* =========================================================
   DARK MODE
   ========================================================= */
function initTheme(){
  const saved = localStorage.getItem(STORAGE_THEME_KEY);
  if(saved === "dark"){
    document.body.classList.add("dark");
    document.getElementById("darkToggle").textContent = "☀️";
  }
  document.getElementById("darkToggle").addEventListener("click", toggleTheme);
}
function toggleTheme(){
  const isDark = document.body.classList.toggle("dark");
  localStorage.setItem(STORAGE_THEME_KEY, isDark ? "dark" : "light");
  document.getElementById("darkToggle").textContent = isDark ? "☀️" : "🌙";
}

/* =========================================================
   SCROLL EFFECTS (sticky header shadow + scroll-to-top)
   ========================================================= */
function initScrollEffects(){
  const header = document.getElementById("siteHeader");
  const topBtn = document.getElementById("scrollTop");

  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    header.classList.toggle("scrolled", y > 10);
    topBtn.classList.toggle("show", y > 500);
  });

  topBtn.addEventListener("click", () => window.scrollTo({top:0, behavior:"smooth"}));

  // reveal-on-scroll for section cards
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if(e.isIntersecting){
        e.target.style.animationPlayState = "running";
        observer.unobserve(e.target);
      }
    });
  }, {threshold:0.1});
  document.querySelectorAll(".why-card, .review-card, .info-card").forEach(el => observer.observe(el));
}

function scrollToMenu(){
  document.getElementById("menu").scrollIntoView({behavior:"smooth", block:"start"});
}
function scrollToId(id){
  const el = document.getElementById(id);
  if(el) el.scrollIntoView({behavior:"smooth", block:"start"});
}

/* =========================================================
   RIPPLE EFFECT
   ========================================================= */
function initRipple(){
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".ripple");
    if(!btn) return;
    const circle = document.createElement("span");
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    circle.className = "ripple-circle";
    circle.style.width = circle.style.height = size + "px";
    circle.style.left = (e.clientX - rect.left - size/2) + "px";
    circle.style.top = (e.clientY - rect.top - size/2) + "px";
    btn.appendChild(circle);
    setTimeout(() => circle.remove(), 650);
  });
}

/* =========================================================
   FAQ ACCORDION
   ========================================================= */
function initFAQ(){
  document.querySelectorAll(".faq-q").forEach(btn => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".faq-item");
      const wasOpen = item.classList.contains("open");
      document.querySelectorAll(".faq-item").forEach(i => i.classList.remove("open"));
      if(!wasOpen) item.classList.add("open");
    });
  });
}

/* =========================================================
   CART CORE LOGIC
   ========================================================= */
function saveCart(){
  localStorage.setItem(STORAGE_CART_KEY, JSON.stringify(cart));
}

function addCart(name, price){
  let item = cart.find(x => x.name === name);
  if(item){ item.qty++; }
  else { cart.push({name, price, qty:1}); }
  saveCart();
  updateCart();
  bumpCartIcon();
}

function plusItem(name){
  const item = cart.find(x => x.name === name);
  if(item){ item.qty++; saveCart(); updateCart(); }
}

function minusItem(name){
  const item = cart.find(x => x.name === name);
  if(!item) return;
  if(item.qty > 1){ item.qty--; }
  else { cart = cart.filter(x => x.name !== name); }
  saveCart();
  updateCart();
}

function removeItem(name){
  cart = cart.filter(x => x.name !== name);
  saveCart();
  updateCart();
}

function clearCart(){
  cart = [];
  saveCart();
  updateCart();
}

function getQty(name){
  const item = cart.find(x => x.name === name);
  return item ? item.qty : 0;
}

function bumpCartIcon(){
  const btn = document.querySelector(".cart-btn");
  if(!btn) return;
  btn.style.transform = "scale(1.12)";
  setTimeout(() => btn.style.transform = "", 180);
}

/* ---------- Render: per-card qty control ---------- */
function renderAllCardControls(){
  document.querySelectorAll(".qty-add-wrap").forEach(wrap => {
    const name = wrap.dataset.name;
    const price = Number(wrap.dataset.price);
    renderCardControl(wrap, name, price);
  });
}

function renderCardControl(wrap, name, price){
  const qty = getQty(name);
  if(qty > 0){
    wrap.innerHTML = `
      <div class="qty-stepper">
        <button onclick="minusItem('${escapeAttr(name)}')" aria-label="Decrease quantity">−</button>
        <span>${qty}</span>
        <button onclick="plusItem('${escapeAttr(name)}')" aria-label="Increase quantity">+</button>
      </div>`;
  } else {
    wrap.innerHTML = `<button class="add-btn" onclick="addCart('${escapeAttr(name)}', ${price})">Add +</button>`;
  }
}

function escapeAttr(str){
  return String(str).replace(/'/g, "\\'");
}

/* ---------- Render: cart drawer items ---------- */
function renderCartItems(){
  const box = document.getElementById("cartItems");
  if(cart.length === 0){
    box.innerHTML = `
      <div class="cart-empty">
        <div class="ce-icon">🛒</div>
        <p>Your cart is empty.<br>Add something delicious!</p>
      </div>`;
    return;
  }
  box.innerHTML = "";
  cart.forEach(item => {
    const imgSrc = getImageForItem(item.name);
    box.innerHTML += `
      <div class="cart-item">
        <img src="${imgSrc}" alt="${item.name}" onerror="this.style.display='none'">
        <div class="cart-item-info">
          <b>${item.name}</b>
          <span>₹${item.price} × ${item.qty} = ₹${item.price * item.qty}</span>
        </div>
        <div class="cart-item-actions">
          <div class="qty-stepper">
            <button onclick="minusItem('${escapeAttr(item.name)}')" aria-label="Decrease quantity">−</button>
            <span>${item.qty}</span>
            <button onclick="plusItem('${escapeAttr(item.name)}')" aria-label="Increase quantity">+</button>
          </div>
          <button class="remove-btn" onclick="removeItem('${escapeAttr(item.name)}')">Remove</button>
        </div>
      </div>`;
  });
}

function getImageForItem(name){
  const card = document.querySelector(`.food-card[data-name="${cssEscape(name)}"] img`);
  return card ? card.getAttribute("src") : "";
}
function cssEscape(str){
  return String(str).replace(/"/g, '\\"');
}

/* ---------- Master update ---------- */
function updateCart(){
  let subtotal = 0, count = 0;
  cart.forEach(i => { subtotal += i.price * i.qty; count += i.qty; });

  const gst = Math.round(subtotal * GST_RATE);
  const delivery = (subtotal === 0 || subtotal >= FREE_DELIVERY_ABOVE) ? 0 : DELIVERY_CHARGE;
  const grandTotal = subtotal + gst + delivery;

  const $ = id => document.getElementById(id);
  if($("subtotal")) $("subtotal").textContent = subtotal;
  if($("gst")) $("gst").textContent = gst;
  if($("deliveryLabel")) $("deliveryLabel").textContent = delivery === 0 ? "FREE" : "₹" + delivery;
  if($("total")) $("total").textContent = grandTotal;
  if($("count")) $("count").textContent = count;
  if($("fabCount")) $("fabCount").textContent = count + (count === 1 ? " item" : " items");
  if($("fabTotal")) $("fabTotal").textContent = "₹" + grandTotal + " ›";

  const fab = document.getElementById("mobileFabCart");
  const navBadge = document.getElementById("navBadge");
  if(fab) fab.classList.toggle("show", count > 0);
  if(navBadge){
    navBadge.hidden = count === 0;
    navBadge.textContent = count;
  }

  renderAllCardControls();
  renderCartItems();
  if(paymentMode === "online") renderPaymentQR();
}

/* ---------- Drawer open/close ---------- */
function openCart(){
  document.getElementById("cart").classList.add("active");
  document.getElementById("cartOverlay").classList.add("active");
  document.body.style.overflow = "hidden";
}
function closeCart(){
  document.getElementById("cart").classList.remove("active");
  document.getElementById("cartOverlay").classList.remove("active");
  document.body.style.overflow = "";
}

/* =========================================================
   FAVOURITES
   ========================================================= */
function toggleFav(name, btn){
  const idx = favourites.indexOf(name);
  if(idx > -1){
    favourites.splice(idx, 1);
    btn.textContent = "🤍";
    btn.classList.remove("active");
  } else {
    favourites.push(name);
    btn.textContent = "❤️";
    btn.classList.add("active");
  }
  localStorage.setItem(STORAGE_FAV_KEY, JSON.stringify(favourites));
}

/* =========================================================
   SEARCH
   ========================================================= */
function searchFood(){
  const value = document.getElementById("search").value.toLowerCase();
  applySearch(value);
  syncSearchInputs(value);
}
function searchFoodMobile(){
  const value = document.getElementById("searchMobile").value.toLowerCase();
  applySearch(value);
  syncSearchInputs(value);
}
function syncSearchInputs(value){
  const a = document.getElementById("search");
  const b = document.getElementById("searchMobile");
  if(a && a.value.toLowerCase() !== value) a.value = value;
  if(b && b.value.toLowerCase() !== value) b.value = value;
}

function applySearch(value){
  let visibleCount = 0;
  document.querySelectorAll(".food-card").forEach(card => {
    const name = card.dataset.name.toLowerCase();
    const match = name.includes(value);
    card.style.display = match ? "" : "none";
    if(match) visibleCount++;
  });
  document.getElementById("noResults").hidden = visibleCount !== 0;

  // reset category to "All" visually when searching
  if(value.length > 0){
    document.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
    document.querySelector('.chip[data-cat="all"]').classList.add("active");
  }
}

/* =========================================================
   CATEGORY FILTER
   ========================================================= */
function filterFood(category, btn){
  document.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
  if(btn) btn.classList.add("active");

  // clear search when switching category
  const searchEl = document.getElementById("search");
  const searchMobileEl = document.getElementById("searchMobile");
  if(searchEl) searchEl.value = "";
  if(searchMobileEl) searchMobileEl.value = "";

  let visibleCount = 0;
  document.querySelectorAll(".food-card").forEach(card => {
    const match = (category === "all" || card.dataset.cat === category);
    card.style.display = match ? "" : "none";
    if(match) visibleCount++;
  });
  document.getElementById("noResults").hidden = visibleCount !== 0;
}

/* =========================================================
   MOBILE SEARCH TOGGLE
   ========================================================= */
document.getElementById("mobileSearchBtn")?.addEventListener("click", toggleMobileSearch);
function toggleMobileSearch(){
  const wrap = document.getElementById("mobileSearchWrap");
  wrap.classList.toggle("open");
  if(wrap.classList.contains("open")){
    setTimeout(() => document.getElementById("searchMobile").focus(), 250);
  }
}

/* =========================================================
   WHATSAPP CHECKOUT
   ========================================================= */
function whatsappOrder(){
  if(cart.length === 0){
    alert("Your cart is empty! Add some delicious food first 🥟");
    return;
  }

  let subtotal = 0;
  cart.forEach(i => subtotal += i.price * i.qty);
  const gst = Math.round(subtotal * GST_RATE);
  const delivery = (subtotal >= FREE_DELIVERY_ABOVE) ? 0 : DELIVERY_CHARGE;
  const grandTotal = subtotal + gst + delivery;

  let msg = "*MR Chinese Food Point*%0A*Customer Order*%0A%0A";
  cart.forEach(item => {
    msg += `${item.name} x${item.qty} = ₹${item.price * item.qty}%0A`;
  });
  msg += "%0A-------------------%0A";
  msg += `Subtotal: ₹${subtotal}%0A`;
  msg += `GST (5%25): ₹${gst}%0A`;
  msg += `Delivery: ${delivery === 0 ? "FREE" : "₹" + delivery}%0A`;
  msg += `*Grand Total: ₹${grandTotal}*%0A%0A`;
  msg += "Please confirm my order. Thank you!";

  msg += `%0A%0A*Payment Mode:* ${paymentMode === "online" ? "Online (UPI)" : "Cash on Delivery"}`;
  if(paymentMode === "online"){
    msg += "%0A📎 Payment screenshot attached separately.";
  }
  if(!isStoreOpen()){
    msg += "%0A%0A(Note: placing this order outside regular hours — please confirm timing.)";
  }

  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank");
}

/* =========================================================
   PAYMENT MODE (COD / Online UPI + QR)
   ========================================================= */
function setPaymentMode(mode){
  paymentMode = mode;
  document.getElementById("payCodBtn").classList.toggle("active", mode === "cod");
  document.getElementById("payOnlineBtn").classList.toggle("active", mode === "online");
  const panel = document.getElementById("qrPanel");
  if(mode === "online"){
    panel.hidden = false;
    renderPaymentQR();
  } else {
    panel.hidden = true;
  }
}

function getGrandTotal(){
  let subtotal = 0;
  cart.forEach(i => subtotal += i.price * i.qty);
  const gst = Math.round(subtotal * GST_RATE);
  const delivery = (subtotal === 0 || subtotal >= FREE_DELIVERY_ABOVE) ? 0 : DELIVERY_CHARGE;
  return subtotal + gst + delivery;
}

function renderPaymentQR(){
  const amount = getGrandTotal();
  const upiUrl = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(UPI_PAYEE_NAME)}&am=${amount}&cu=INR&tn=${encodeURIComponent("Order Payment")}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiUrl)}`;
  document.getElementById("qrImage").src = qrSrc;
  document.getElementById("qrAmount").textContent = amount;
  document.getElementById("qrUpiId").textContent = UPI_ID;
}

/* =========================================================
   LIVE RESTAURANT OPEN/CLOSED STATUS
   ========================================================= */
function isStoreOpen(now = new Date()){
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const openMinutes = OPEN_HOUR * 60 + OPEN_MIN;
  const closeMinutes = CLOSE_HOUR * 60 + CLOSE_MIN;
  return minutesNow >= openMinutes && minutesNow < closeMinutes;
}

function initStoreStatus(){
  updateStoreStatus();
  setInterval(updateStoreStatus, 60000); // refresh every minute
}

function updateStoreStatus(){
  const open = isStoreOpen();
  const badge = document.getElementById("statusBadge");
  if(badge){
    badge.textContent = open ? "● Open Now" : "● Closed Now";
    badge.classList.toggle("closed", !open);
  }
  const strip = document.getElementById("cartStatusStrip");
  if(strip) strip.hidden = open;
}
