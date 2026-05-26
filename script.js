gsap.registerPlugin(ScrollTrigger);

const TOTAL_FRAMES = 239;
const FRAME_PREFIX = "assets/zc_";

const canvas = document.getElementById("bg-canvas");
const ctx = canvas.getContext("2d");

let frames = [];
let currentFrameIndex = 0;
let dpr = window.devicePixelRatio || 1;

function framePath(index) {
  const num = String(index + 1).padStart(5, "0");
  return `${FRAME_PREFIX}${num}.jpg`;
}

function preloadImages() {
  const promises = Array.from({ length: TOTAL_FRAMES }, (_, i) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load ${framePath(i)}`));
      img.src = framePath(i);
    });
  });
  return Promise.all(promises);
}

function resizeCanvas() {
  dpr = window.devicePixelRatio || 1;
  const w = window.innerWidth;
  const h = window.innerHeight;

  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawFrame(currentFrameIndex);
}

function drawCover(img) {
  const cw = window.innerWidth;
  const ch = window.innerHeight;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;

  const scale = Math.max(cw / iw, ch / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = (cw - dw) / 2;
  const dy = (ch - dh) / 2;

  ctx.clearRect(0, 0, cw, ch);
  ctx.drawImage(img, dx, dy, dw, dh);
}

function drawFrame(index) {
  if (!frames.length) return;
  currentFrameIndex = Math.max(0, Math.min(index, frames.length - 1));
  drawCover(frames[currentFrameIndex]);
}

function initScrollFrames() {
  ScrollTrigger.create({
    trigger: document.documentElement,
    start: "top top",
    end: "bottom bottom",
    scrub: true,
    onUpdate: (self) => {
      const index = Math.round(self.progress * (TOTAL_FRAMES - 1));
      drawFrame(index);
    },
  });
}

function initSectionAnimations() {
  gsap.utils.toArray(".section-inner").forEach((inner) => {
    gsap.timeline({
      scrollTrigger: {
        trigger: inner.closest(".section"),
        start: "top bottom",
        end: "bottom top",
        scrub: 1,
      },
    })
      .fromTo(
        inner,
        { opacity: 0, y: 60 },
        { opacity: 1, y: 0, ease: "none", duration: 1 }
      )
      .to(inner, { opacity: 0, y: -30, ease: "none", duration: 1 }, 1);
  });
}

function init() {
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  preloadImages()
    .then((loaded) => {
      frames = loaded;
      drawFrame(0);
      initScrollFrames();
      initSectionAnimations();
      ScrollTrigger.refresh();
    })
    .catch((err) => {
      console.error("Image preload failed:", err);
    });
}

init();
