window.onload = function () {
  const canvas = document.getElementById("fractalCanvas");
  const ctx = canvas.getContext("2d");
  const messageBox = document.getElementById("messageBox");
  const loadingIndicator = document.getElementById("loadingIndicator");

  let width = Math.min(window.innerWidth * 0.9, 800);
  let height = Math.min(window.innerHeight * 0.7, 600);
  canvas.width = width;
  canvas.height = height;

  let isHighRes = false;
  let zoomSpeed = 1.2;
  let isMouseOverCanvas = false;

  // Burning Ship state
  let burningShipZoom = 0.5;
  let burningShipPanX = -0.5;
  let burningShipPanY = -0.5;

  let isDragging = false;
  let lastMouseX = 0;
  let lastMouseY = 0;

  // Inline Web Worker code
  const workerCode = `
                self.onmessage = (event) => {
                    const { width, height, renderWidth, renderHeight, zoom, panX, panY, maxIterations } = event.data;
                    const imageData = new ImageData(renderWidth, renderHeight);
                    const pixels = imageData.data;

                    for (let x = 0; x < renderWidth; x++) {
                        for (let y = 0; y < renderHeight; y++) {
                            const c_real = (x - renderWidth / 2) / (width * zoom) + panX;
                            const c_imag = (y - renderHeight / 2) / (width * zoom) + panY;
                            
                            let z_real = 0;
                            let z_imag = 0;
                            let n = 0;

                            while (z_real * z_real + z_imag * z_imag <= 4 && n < maxIterations) {
                                const z_real_temp = z_real * z_real - z_imag * z_imag + c_real;
                                z_imag = 2 * Math.abs(z_real) * Math.abs(z_imag) + c_imag;
                                z_real = z_real_temp;
                                n++;
                            }

                            const pixelIndex = (x + y * renderWidth) * 4;
                            if (n === maxIterations) {
                                pixels[pixelIndex] = 0;
                                pixels[pixelIndex + 1] = 0;
                                pixels[pixelIndex + 2] = 0;
                                pixels[pixelIndex + 3] = 255;
                            } else {
                                const t = Math.pow(n / maxIterations, 0.5);
                                const r = Math.floor(9 * (1 - t) * t * t * t * 255);
                                const g = Math.floor(15 * (1 - t) * (1 - t) * t * t * 255);
                                const b = Math.floor(8.5 * (1 - t) * (1 - t) * (1 - t) * t * 255);
                                
                                pixels[pixelIndex] = r;
                                pixels[pixelIndex + 1] = g;
                                pixels[pixelIndex + 2] = b;
                                pixels[pixelIndex + 3] = 255;
                            }
                        }
                    }
                    self.postMessage({ imageData, renderWidth, renderHeight });
                };
            `;
  const workerBlob = new Blob([workerCode], { type: "text/javascript" });
  const workerUrl = URL.createObjectURL(workerBlob);
  const burningShipWorker = new Worker(workerUrl);

  // Handle messages from the Web Worker
  burningShipWorker.onmessage = (event) => {
    const { imageData, renderWidth, renderHeight } = event.data;
    const offscreenCanvas = new OffscreenCanvas(renderWidth, renderHeight);
    const offscreenCtx = offscreenCanvas.getContext("2d");
    offscreenCtx.putImageData(imageData, 0, 0);
    ctx.drawImage(offscreenCanvas, 0, 0, width, height);
    loadingIndicator.style.display = "none";
  };

  function drawFractal() {
    loadingIndicator.style.display = "block";

    const renderWidth = isHighRes ? width * 2 : width;
    const renderHeight = isHighRes ? height * 2 : height;
    let maxIterations = 250;

    maxIterations = Math.round(250 + Math.log(burningShipZoom) * 100);
    maxIterations = Math.max(250, Math.min(maxIterations, 1500));

    burningShipWorker.postMessage({
      width,
      height,
      renderWidth,
      renderHeight,
      zoom: burningShipZoom,
      panX: burningShipPanX,
      panY: burningShipPanY,
      maxIterations,
    });
  }

  function showMessage(text) {
    messageBox.textContent = text;
    messageBox.style.opacity = "1";
    setTimeout(() => {
      messageBox.style.opacity = "0";
    }, 3000);
  }

  function init() {
    window.addEventListener("resize", () => {
      width = Math.min(window.innerWidth * 0.9, 800);
      height = Math.min(window.innerHeight * 0.7, 600);
      canvas.width = width;
      canvas.height = height;
      drawFractal();
    });
    addEventListeners();
    drawFractal();
  }

  function addEventListeners() {
    canvas.addEventListener("mouseenter", () => {
      isMouseOverCanvas = true;
    });
    canvas.addEventListener("mouseleave", () => {
      isMouseOverCanvas = false;
    });

    canvas.addEventListener("mousedown", (e) => {
      isDragging = true;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
      canvas.style.cursor = "grabbing";
    });
    canvas.addEventListener("mousemove", (e) => {
      if (isDragging) {
        const dx = e.clientX - lastMouseX;
        const dy = e.clientY - lastMouseY;

        burningShipPanX -= dx / (width * burningShipZoom);
        burningShipPanY -= dy / (height * burningShipZoom);

        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        drawFractal();
      }
    });
    window.addEventListener("mouseup", () => {
      isDragging = false;
      canvas.style.cursor = "grab";
    });
    canvas.addEventListener("wheel", (e) => {
      if (!isMouseOverCanvas) return;
      e.preventDefault();

      const zoomFactor = e.deltaY > 0 ? 1 / zoomSpeed : zoomSpeed;
      const mouseX = e.offsetX;
      const mouseY = e.offsetY;

      const real =
        (mouseX - width / 2) / (width * burningShipZoom) + burningShipPanX;
      const imag =
        (mouseY - height / 2) / (width * burningShipZoom) + burningShipPanY;

      burningShipZoom *= zoomFactor;
      burningShipPanX = real - (mouseX - width / 2) / (width * burningShipZoom);
      burningShipPanY =
        imag - (mouseY - height / 2) / (width * burningShipZoom);

      showMessage(`Zoom: ${Math.round(100 * burningShipZoom)}%`);
      drawFractal();
    });

    document
      .getElementById("burningShipZoomInBtn")
      .addEventListener("click", () => {
        burningShipZoom *= zoomSpeed;
        showMessage(`Zoom: ${Math.round(100 * burningShipZoom)}%`);
        drawFractal();
      });
    document
      .getElementById("burningShipZoomOutBtn")
      .addEventListener("click", () => {
        burningShipZoom /= zoomSpeed;
        showMessage(`Zoom: ${Math.round(100 * burningShipZoom)}%`);
        drawFractal();
      });
    document
      .getElementById("burningShipHighResBtn")
      .addEventListener("click", () => {
        isHighRes = !isHighRes;
        drawFractal();
        showMessage(`High-Res Mode: ${isHighRes ? "Enabled" : "Disabled"}`);
      });
    document
      .getElementById("burningShipResetBtn")
      .addEventListener("click", () => {
        burningShipZoom = 0.5;
        burningShipPanX = -0.5;
        burningShipPanY = -0.5;
        isHighRes = false;
        drawFractal();
        showMessage("Burning Ship view has been reset.");
      });
    document
      .getElementById("burningShipZoomSpeedSlider")
      .addEventListener("input", (e) => {
        zoomSpeed = parseFloat(e.target.value) / 100 + 1;
      });
  }

  init();
};
