gsap.registerPlugin(ScrollTrigger);

const TOTAL_FRAMES = 239;
const ASSETS_DIR = "assets";
const ASSETS_ZIP = "assets.zip";
const FRAME_PREFIX = `${ASSETS_DIR}/zc_`;

const canvas = document.getElementById("bg-canvas");
const ctx = canvas.getContext("2d");

let frames = [];
let blobUrls = [];
let currentFrameIndex = 0;
let dpr = window.devicePixelRatio || 1;

function framePath(index) {
  const num = String(index + 1).padStart(5, "0");
  return `${FRAME_PREFIX}${num}.jpg`;
}

function loadImageFromSrc(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
}

function testAssetFolder() {
  return loadImageFromSrc(framePath(0));
}

function preloadFromFolder() {
  return Promise.all(
    Array.from({ length: TOTAL_FRAMES }, (_, i) => loadImageFromSrc(framePath(i)))
  );
}

function findZipEntryName(zip, index) {
  const num = String(index + 1).padStart(5, "0");
  const basename = `zc_${num}.jpg`;
  const candidates = [
    `${ASSETS_DIR}/${basename}`,
    basename,
    `${ASSETS_DIR}/zc_${num}.jpg`,
  ];
  for (const name of candidates) {
    if (zip.file(name) && !zip.file(name).dir) return name;
  }
  return Object.keys(zip.files).find(
    (name) => name.endsWith(basename) && !zip.files[name].dir
  );
}

async function preloadFromZip() {
  const response = await fetch(ASSETS_ZIP);
  if (!response.ok) {
    throw new Error(`Cannot fetch ${ASSETS_ZIP} (${response.status})`);
  }

  const zip = await JSZip.loadAsync(await response.arrayBuffer());
  const loaded = [];

  for (let i = 0; i < TOTAL_FRAMES; i++) {
    const entryName = findZipEntryName(zip, i);
    if (!entryName) {
      throw new Error(`Missing frame in zip: zc_${String(i + 1).padStart(5, "0")}.jpg`);
    }
    const blob = await zip.file(entryName).async("blob");
    const url = URL.createObjectURL(blob);
    blobUrls.push(url);
    loaded.push(await loadImageFromSrc(url));
  }

  return loaded;
}

async function preloadImages() {
  try {
    await testAssetFolder();
    return preloadFromFolder();
  } catch {
    console.info(`assets/ not available, loading from ${ASSETS_ZIP}…`);
    return preloadFromZip();
  }
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
  window.addEventListener("beforeunload", () => {
    blobUrls.forEach((url) => URL.revokeObjectURL(url));
  });

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
