window.onload = function () {
  const canvas = document.getElementById("mandelbrotCanvas");
  const ctx = canvas.getContext("2d");
  const messageBox = document.getElementById("messageBox");
  const loadingIndicator = document.getElementById("loadingIndicator");
  const zoomSpeedSlider = document.getElementById("zoomSpeedSlider");

  let width = Math.min(window.innerWidth * 0.9, 800);
  let height = Math.min(window.innerHeight * 0.7, 600);
  canvas.width = width;
  canvas.height = height;

  let maxIterations = 350;
  let zoom = 0.4;
  let panX = -0.68;
  let panY = 0;
  let isHighRes = false;
  let zoomSpeed = parseFloat(zoomSpeedSlider.value) / 100 + 1;

  let isDragging = false;
  let lastMouseX = 0;
  let lastMouseY = 0;


  function updateMaxIterations(){
    maxIterations = Math.round(250 + Math.log(zoom) * 100);
    maxIterations = Math.max(250, Math.min(maxIterations, 1500));
  }

  function init() {
    window.addEventListener("resize", () => {
      width = Math.min(window.innerWidth * 0.9, 800);
      height = Math.min(window.innerHeight * 0.7, 600);
      canvas.width = width;
      canvas.height = height;
      drawMandelbrot();
    });
    addEventListeners();
    drawMandelbrot();
  }

  function addEventListeners() {
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
        panX -= dx / (width * zoom);
        panY -= dy / (height * zoom);
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        drawMandelbrot();
      }
    });

    canvas.addEventListener("mouseup", () => {
      isDragging = false;
      canvas.style.cursor = "grab";
    });

    canvas.addEventListener("wheel", (e) => {
      e.preventDefault();

      const zoomFactor = e.deltaY > 0 ? 1 / zoomSpeed : zoomSpeed;
      const mouseX = e.offsetX;
      const mouseY = e.offsetY;
      const real = (mouseX - width / 2) / (width * zoom) + panX;
      const imag = (mouseY - height / 2) / (width * zoom) + panY;
      zoom *= zoomFactor;
      panX = real - (mouseX - width / 2) / (width * zoom);
      panY = imag - (mouseY - height / 2) / (width * zoom);
      drawMandelbrot();
      showMessage(`Zoom: ${Math.round(100 * zoom)}%`);
    });

    document.getElementById("zoomInBtn").addEventListener("click", () => {
      zoom *= zoomSpeed;
      drawMandelbrot();
      showMessage(`Zoom: ${Math.round(100 * zoom)}%`);
    });

    document.getElementById("zoomOutBtn").addEventListener("click", () => {
      zoom /= zoomSpeed;
      drawMandelbrot();
      showMessage(`Zoom: ${Math.round(100 * zoom)}%`);
    });

    document.getElementById("highResBtn").addEventListener("click", () => {
      isHighRes = !isHighRes;
      drawMandelbrot();
      showMessage(`High-Res Mode: ${isHighRes ? "Enabled" : "Disabled"}`);
    });

    document.getElementById("resetBtn").addEventListener("click", () => {
      zoom = 0.5;
      panX = -0.5;
      panY = 0;
      maxIterations = 250;
      isHighRes = false;
      drawMandelbrot();
      showMessage("View has been reset.");
    });

    zoomSpeedSlider.addEventListener("input", (e) => {
      zoomSpeed = parseFloat(e.target.value) / 100 + 1;
    });
  }

  function drawMandelbrot() {
    loadingIndicator.style.display = "block";

    updateMaxIterations();

    setTimeout(() => {
      try {
        const renderWidth = isHighRes ? width * 2 : width;
        const renderHeight = isHighRes ? height * 2 : height;

        const offscreenCanvas = document.createElement("canvas");
        offscreenCanvas.width = renderWidth;
        offscreenCanvas.height = renderHeight;
        const offscreenCtx = offscreenCanvas.getContext("2d");

        const imageData = offscreenCtx.createImageData(
          renderWidth,
          renderHeight
        );
        const pixels = imageData.data;

        for (let x = 0; x < renderWidth; x++) {
          for (let y = 0; y < renderHeight; y++) {
            const c_real = (x - renderWidth / 2) / (width * zoom) + panX;
            const c_imag = (y - renderHeight / 2) / (width * zoom) + panY;

            let z_real = 0;
            let z_imag = 0;
            let n = 0;

            while (
              z_real * z_real + z_imag * z_imag <= 4 &&
              n < maxIterations
            ) {
              const z_real_temp = z_real * z_real - z_imag * z_imag + c_real;
              z_imag = 2 * z_real * z_imag + c_imag;
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
              const colorValue = (n / maxIterations) * 255;
              pixels[pixelIndex] = colorValue * 2;
              pixels[pixelIndex + 1] = colorValue * 3;
              pixels[pixelIndex + 2] = colorValue * 5;
              pixels[pixelIndex + 3] = 255;
            }
          }
        }

        offscreenCtx.putImageData(imageData, 0, 0);
        ctx.drawImage(offscreenCanvas, 0, 0, width, height);
      } catch (e) {
        console.error("Error drawing Mandelbrot set:", e);
        showMessage("Error drawing Mandelbrot set. Please try again.");
      } finally {
        loadingIndicator.style.display = "none";
      }
    }, 0);
  }

  function showMessage(text) {
    messageBox.textContent = text;
    messageBox.style.opacity = "1";
    setTimeout(() => {
      messageBox.style.opacity = "0";
    }, 3000);
  }

  init();
};
