(function () {
  "use strict";

  var header = document.querySelector(".header");
  var burger = document.querySelector(".burger");
  var mobileMenu = document.querySelector(".mobile-menu");
  var fab = document.querySelector(".fab");
  var fabMain = document.querySelector(".fab__main");
  var sections = document.querySelectorAll("section[id]");
  var navLinks = document.querySelectorAll(".nav a");
  var reveals = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  var photo = document.querySelector(".hero__photo");
  var motionOK = window.matchMedia("(prefers-reduced-motion: no-preference)").matches;

  /* ---------- Мобильное меню ---------- */
  function closeMenu() {
    burger.classList.remove("open");
    mobileMenu.classList.remove("open");
    document.body.style.overflow = "";
  }
  burger.addEventListener("click", function () {
    var open = burger.classList.toggle("open");
    mobileMenu.classList.toggle("open", open);
    document.body.style.overflow = open ? "hidden" : "";
  });
  mobileMenu.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", closeMenu);
  });

  /* ---------- FAB ---------- */
  fabMain.addEventListener("click", function () { fab.classList.toggle("open"); });
  document.addEventListener("click", function (e) {
    if (!fab.contains(e.target)) fab.classList.remove("open");
  });

  /* ---------- FAQ: открыт только один ---------- */
  var faqItems = document.querySelectorAll(".faq__item");
  faqItems.forEach(function (item) {
    item.addEventListener("toggle", function () {
      if (item.open) {
        faqItems.forEach(function (other) { if (other !== item) other.open = false; });
      }
    });
  });

  /* ---------- Reveal + sticky header + nav + параллакс (на скролле) ---------- */
  function reveal() {
    var vh = window.innerHeight || document.documentElement.clientHeight;
    for (var i = reveals.length - 1; i >= 0; i--) {
      var el = reveals[i];
      var r = el.getBoundingClientRect();
      if (r.top < vh * 0.9 && r.bottom > 0) {
        el.classList.add("in");
        reveals.splice(i, 1);
      }
    }
  }
  function stickyHeader() {
    header.classList.toggle("scrolled", window.scrollY > 24);
  }
  function navActive() {
    var y = window.scrollY + (window.innerHeight || 0) * 0.38;
    var current = "";
    sections.forEach(function (s) { if (s.offsetTop <= y) current = s.id; });
    navLinks.forEach(function (l) {
      l.style.color = l.getAttribute("href") === "#" + current ? "var(--blue)" : "";
    });
  }
  function parallax() {
    if (!photo || !motionOK) return;
    var y = window.scrollY;
    if (y < 1000) photo.style.transform = "translateY(" + y * 0.06 + "px)";
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      reveal();
      stickyHeader();
      navActive();
      parallax();
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", function () { reveal(); navActive(); });
  window.addEventListener("load", reveal);

  // первичный прогон + страховочные таймеры (на случай поздней раскладки/шрифтов)
  reveal(); stickyHeader(); navActive();
  setTimeout(reveal, 120);
  setTimeout(reveal, 500);

  /* ---------- Кинематографичная сцена hero (2.5D-камера) ---------- */
  var hero = document.querySelector(".hero");
  var room = document.querySelector("#hero-room");
  var copy = document.querySelector("#hero-copy");
  var pins = document.querySelectorAll(".hero__pin");

  // Хотспоты: клик-переключение (для тач-устройств)
  pins.forEach(function (pin) {
    pin.addEventListener("click", function (e) {
      e.preventDefault();
      var wasOpen = pin.classList.contains("open");
      pins.forEach(function (p) { p.classList.remove("open"); });
      if (!wasOpen) pin.classList.add("open");
    });
  });
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".hero__pin")) pins.forEach(function (p) { p.classList.remove("open"); });
  });

  // Камера: параллакс на мышь (1–2°) + push-in/затухание при скролле
  if (room && motionOK) {
    var targetRX = 0, targetRY = 0, curRX = 0, curRY = 0;
    var targetTX = 0, targetTY = 0, curTX = 0, curTY = 0;
    var scrollScale = 0, curScale = 0;
    var hovering = false;
    var fine = window.matchMedia("(pointer: fine)").matches;

    if (fine) {
      hero.addEventListener("mousemove", function (e) {
        var r = hero.getBoundingClientRect();
        var nx = (e.clientX - r.left) / r.width - 0.5;   // -0.5..0.5
        var ny = (e.clientY - r.top) / r.height - 0.5;
        targetRY = nx * 2.0;     // поворот по Y, макс ~2°
        targetRX = -ny * 1.4;    // поворот по X
        targetTX = -nx * 14;     // лёгкий сдвиг
        targetTY = -ny * 10;
        hovering = true;
      });
      hero.addEventListener("mouseleave", function () {
        targetRX = targetRY = targetTX = targetTY = 0;
        hovering = false;
      });
    }

    var rendering = true;
    function computeScroll() {
      var h = hero.offsetHeight || window.innerHeight;
      var p = Math.min(Math.max(window.scrollY / h, 0), 1); // 0..1
      scrollScale = p * 0.12;                 // приближение вглубь
      if (copy) {
        copy.style.opacity = String(Math.max(0, 1 - p * 1.5));
        copy.style.transform = "translateY(" + (-p * 60) + "px)";
      }
      // когда секция «Объекты» достигнута — приостанавливаем рендер сцены
      rendering = p < 0.999;
    }
    window.addEventListener("scroll", function () {
      computeScroll();
      if (rendering) ensureLoop();
    }, { passive: true });
    computeScroll();

    var looping = false;
    function ensureLoop() { if (!looping) { looping = true; requestAnimationFrame(tick); } }
    function tick() {
      curRX += (targetRX - curRX) * 0.08;
      curRY += (targetRY - curRY) * 0.08;
      curTX += (targetTX - curTX) * 0.08;
      curTY += (targetTY - curTY) * 0.08;
      curScale += (scrollScale - curScale) * 0.10;
      room.style.transform =
        "scale(" + (1.06 + curScale) + ") translate3d(" + curTX + "px," + curTY + "px,0) " +
        "rotateX(" + curRX + "deg) rotateY(" + curRY + "deg)";
      var settled = !hovering &&
        Math.abs(targetRX - curRX) < 0.002 && Math.abs(targetRY - curRY) < 0.002 &&
        Math.abs(targetTX - curTX) < 0.05 && Math.abs(targetTY - curTY) < 0.05 &&
        Math.abs(scrollScale - curScale) < 0.0005;
      if (settled || !rendering) { looping = false; return; }
      requestAnimationFrame(tick);
    }
    ensureLoop();
    hero.addEventListener("mousemove", ensureLoop);
  }
})();
