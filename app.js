const canvas = document.querySelector("#field-canvas");
const ctx = canvas.getContext("2d", { alpha: true });
const darkRainCanvas = document.querySelector("#dark-rain-canvas");
const darkRainCtx = darkRainCanvas.getContext("2d", { alpha: true });
const trustTrigger = document.querySelector("#trust-trigger");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let width = 0;
let height = 0;
let ratio = 1;
let pointerX = 0.5;
let pointerY = 0.5;
let rainColumns = [];
let lastRainTime = 0;

function syncModeLinks() {
  const isDark = document.body.classList.contains("dark-mode");
  document.querySelectorAll("[data-dark-href]").forEach((link) => {
    if (!link.dataset.lightHref) link.dataset.lightHref = link.getAttribute("href") || "";
    link.setAttribute("href", isDark ? link.dataset.darkHref : link.dataset.lightHref);
  });
}

function applySavedMode() {
  const savedMode = localStorage.getItem("alwaysProofMode");
  document.body.classList.toggle("dark-mode", savedMode === "dark");
  trustTrigger.setAttribute(
    "aria-label",
    savedMode === "dark" ? "Switch to the public promise" : "Reveal the hidden system"
  );
  syncModeLinks();
}

function toggleMode() {
  const isDark = document.body.classList.toggle("dark-mode");
  localStorage.setItem("alwaysProofMode", isDark ? "dark" : "light");
  trustTrigger.setAttribute(
    "aria-label",
    isDark ? "Switch to the public promise" : "Reveal the hidden system"
  );
  trustTrigger.classList.remove("pulsing");
  void trustTrigger.offsetWidth;
  trustTrigger.classList.add("pulsing");
  syncModeLinks();
  animateDarknet();
  if (window.ScrollTrigger) ScrollTrigger.refresh();
}

function animateDarknet() {
  if (!window.gsap || reducedMotion || !document.body.classList.contains("dark-mode")) return;

  gsap.fromTo(
    ".dark-window, [data-dark-reveal]",
    { autoAlpha: 0, y: 18, scale: 0.98 },
    {
      autoAlpha: 1,
      y: 0,
      scale: 1,
      duration: 0.32,
      stagger: { each: 0.06, from: "random" },
      ease: "steps(3)",
      overwrite: "auto"
    }
  );

  gsap.fromTo(
    ".console-lines span, .dark-ledger-module div, .dark-command-module li",
    { autoAlpha: 0.38 },
    {
      autoAlpha: 1,
      duration: 0.18,
      stagger: 0.05,
      repeat: 1,
      yoyo: true,
      overwrite: "auto"
    }
  );
}

function resizeCanvas() {
  ratio = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  darkRainCanvas.width = Math.floor(width * ratio);
  darkRainCanvas.height = Math.floor(height * ratio);
  darkRainCanvas.style.width = `${width}px`;
  darkRainCanvas.style.height = `${height}px`;
  darkRainCtx.setTransform(ratio, 0, 0, ratio, 0, 0);

  const columnWidth = width < 560 ? 18 : 23;
  const count = Math.ceil(width / columnWidth) + 6;
  rainColumns = Array.from({ length: count }, (_, index) => ({
    x: index * columnWidth + Math.random() * 10 - 5,
    y: Math.random() * height * -1.4,
    speed: 70 + Math.random() * 210,
    size: 12 + Math.random() * 18,
    gap: 0.86 + Math.random() * 0.42,
    length: 10 + Math.floor(Math.random() * 28),
    alpha: 0.18 + Math.random() * 0.62
  }));
}

function drawDarkRain(time = 0) {
  const delta = Math.min((time - lastRainTime) / 1000 || 0.016, 0.05);
  lastRainTime = time;

  darkRainCtx.globalCompositeOperation = "source-over";
  darkRainCtx.fillStyle = "rgba(0, 0, 0, 0.18)";
  darkRainCtx.fillRect(0, 0, width, height);
  darkRainCtx.globalCompositeOperation = "lighter";
  darkRainCtx.textAlign = "center";
  darkRainCtx.textBaseline = "top";

  rainColumns.forEach((column) => {
    column.y += column.speed * delta;
    const step = column.size * column.gap;
    if (column.y - column.length * step > height + 80) {
      column.y = -Math.random() * height * 0.75 - 80;
      column.speed = 70 + Math.random() * 230;
      column.length = 9 + Math.floor(Math.random() * 34);
      column.alpha = 0.16 + Math.random() * 0.68;
      column.size = 11 + Math.random() * 19;
    }

    darkRainCtx.font = `${column.size}px ${getComputedStyle(document.documentElement).getPropertyValue("--mono-family") || "monospace"}`;
    for (let i = 0; i < column.length; i += 1) {
      const y = column.y - i * step;
      if (y < -40 || y > height + 40) continue;
      const fade = 1 - i / column.length;
      const isHead = i === 0;
      const char = Math.random() > 0.5 ? "1" : "0";
      darkRainCtx.shadowColor = isHead ? "rgba(255, 77, 66, 0.95)" : "rgba(221, 16, 18, 0.55)";
      darkRainCtx.shadowBlur = isHead ? 18 : 9;
      darkRainCtx.fillStyle = isHead
        ? `rgba(255, 228, 220, ${Math.min(0.92, column.alpha + 0.28)})`
        : `rgba(235, 22, 24, ${Math.max(0.04, column.alpha * fade)})`;
      darkRainCtx.fillText(char, column.x, y);
    }
  });
}

function lightBlob(x, y, rx, ry, color, alpha) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, Math.max(rx, ry));
  gradient.addColorStop(0, color.replace("ALPHA", String(alpha)));
  gradient.addColorStop(0.46, color.replace("ALPHA", String(alpha * 0.55)));
  gradient.addColorStop(1, color.replace("ALPHA", "0"));
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(rx / Math.max(rx, ry), ry / Math.max(rx, ry));
  ctx.translate(-x, -y);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, Math.max(rx, ry), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawField(time = 0) {
  ctx.clearRect(0, 0, width, height);
  ctx.globalCompositeOperation = "screen";

  const isDark = document.body.classList.contains("dark-mode");
  const t = time * 0.00018;
  const driftX = (pointerX - 0.5) * 80;
  const driftY = (pointerY - 0.5) * 60;
  if (isDark) {
    drawDarkRain(time);
    if (!reducedMotion) requestAnimationFrame(drawField);
    return;
  }

  darkRainCtx.clearRect(0, 0, width, height);

  const main = "rgba(28, 214, 205, ALPHA)";
  const second = "rgba(7, 142, 137, ALPHA)";
  const mist = "rgba(255, 255, 255, ALPHA)";

  lightBlob(
    width * (0.12 + Math.sin(t * 1.7) * 0.04) + driftX,
    height * (0.26 + Math.cos(t * 1.1) * 0.05) + driftY,
    width * 0.34,
    height * 0.13,
    main,
    0.34
  );
  lightBlob(
    width * (0.74 + Math.cos(t * 1.2) * 0.05) - driftX * 0.4,
    height * (0.38 + Math.sin(t * 1.4) * 0.08),
    width * 0.42,
    height * 0.12,
    second,
    0.22
  );
  lightBlob(
    width * (0.54 + Math.sin(t * 1.4) * 0.06),
    height * (0.18 + Math.cos(t * 1.8) * 0.05) - driftY * 0.3,
    width * 0.24,
    height * 0.09,
    mist,
    0.16
  );

  ctx.globalCompositeOperation = "source-over";
  if (!reducedMotion) requestAnimationFrame(drawField);
}

applySavedMode();
trustTrigger.addEventListener("click", toggleMode);
trustTrigger.addEventListener("animationend", () => trustTrigger.classList.remove("pulsing"));

resizeCanvas();
drawField();
window.addEventListener("resize", resizeCanvas);
window.addEventListener("pointermove", (event) => {
  pointerX = event.clientX / Math.max(width, 1);
  pointerY = event.clientY / Math.max(height, 1);
});

if (window.gsap) {
  gsap.registerPlugin(window.ScrollTrigger);
  gsap.defaults({ ease: "power3.out", duration: 0.8 });

  const mm = gsap.matchMedia();

  mm.add("(prefers-reduced-motion: no-preference)", () => {
    const intro = gsap.timeline({ defaults: { ease: "power4.out" } });
    intro
      .from(".site-header", { y: -24, autoAlpha: 0, duration: 0.7 })
      .from(".hero [data-reveal]", { y: 34, autoAlpha: 0, stagger: 0.08, duration: 0.9 }, "-=0.35")
      .from(".scan-orbit", { scale: 0.74, rotation: -80, autoAlpha: 0, duration: 1.1 }, "-=0.8");

    gsap.to(".scan-orbit", {
      rotation: 360,
      repeat: -1,
      duration: 18,
      ease: "none",
      transformOrigin: "50% 50%"
    });

    animateDarknet();

    gsap.to(".dark-window", {
      x: (index) => (index % 2 === 0 ? 8 : -7),
      y: (index) => (index % 2 === 0 ? -5 : 6),
      duration: 2.6,
      repeat: -1,
      yoyo: true,
      ease: "steps(4)",
      stagger: 0.18
    });

    gsap.to(".network-lines path", {
      strokeDashoffset: -180,
      duration: 2.4,
      repeat: -1,
      ease: "none",
      stagger: 0.16
    });

    gsap.to(".network-nodes circle", {
      autoAlpha: 0.28,
      duration: 0.28,
      repeat: -1,
      yoyo: true,
      ease: "steps(2)",
      stagger: { each: 0.08, from: "random" }
    });

    gsap.to(".dark-pulse polyline", {
      autoAlpha: 0.42,
      duration: 0.2,
      repeat: -1,
      yoyo: true,
      ease: "steps(2)"
    });

    gsap.to(".dark-map-module path", {
      strokeDashoffset: -160,
      duration: 2.8,
      repeat: -1,
      ease: "none",
      stagger: 0.12
    });

    gsap.to(".dark-map-module circle", {
      scale: 1.5,
      autoAlpha: 0.42,
      transformOrigin: "50% 50%",
      duration: 0.34,
      repeat: -1,
      yoyo: true,
      ease: "steps(2)",
      stagger: { each: 0.1, from: "random" }
    });

    gsap.to(".proof-device", {
      y: -42,
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: 1
      }
    });

    gsap.utils.toArray("[data-reveal]").forEach((element) => {
      if (
        element.closest(".hero") ||
        element.classList.contains("site-header") ||
        element.classList.contains("process-step")
      ) {
        return;
      }
      gsap.from(element, {
        y: 42,
        autoAlpha: 0,
        duration: 0.9,
        scrollTrigger: {
          trigger: element,
          start: "top 84%",
          toggleActions: "play none none reverse"
        }
      });
    });

    gsap.utils.toArray(".benefit-panel, .plan, .statement-grid article").forEach((element, index) => {
      gsap.to(element, {
        y: index % 2 === 0 ? -18 : 18,
        scrollTrigger: {
          trigger: element,
          start: "top bottom",
          end: "bottom top",
          scrub: 1.2
        }
      });
    });

    ScrollTrigger.batch(".process-step", {
      start: "top 92%",
      once: true,
      batchMax: 2,
      interval: 0.08,
      onEnter: (batch) => {
        gsap.fromTo(
          batch,
          { x: 36, y: 22, autoAlpha: 0 },
          {
            x: 0,
            y: 0,
            autoAlpha: 1,
            duration: 0.72,
            ease: "power3.out",
            stagger: 0.1,
            overwrite: "auto"
          }
        );
      }
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  });
}
