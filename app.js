const canvas = document.querySelector("#field-canvas");
const ctx = canvas.getContext("2d", { alpha: true });
const trustTrigger = document.querySelector("#trust-trigger");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let width = 0;
let height = 0;
let ratio = 1;
let pointerX = 0.5;
let pointerY = 0.5;

function applySavedMode() {
  const savedMode = localStorage.getItem("alwaysProofMode");
  document.body.classList.toggle("dark-mode", savedMode === "dark");
  trustTrigger.setAttribute(
    "aria-label",
    savedMode === "dark" ? "Switch to the public promise" : "Reveal the hidden system"
  );
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
  if (window.ScrollTrigger) ScrollTrigger.refresh();
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
    if (!reducedMotion) requestAnimationFrame(drawField);
    return;
  }

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
