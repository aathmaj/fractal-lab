self.onmessage = (event) => {
  const {
    width,
    height,
    renderWidth,
    renderHeight,
    zoom,
    panX,
    panY,
    maxIterations,
    c_real_fixed,
    c_imag_fixed,
  } = event.data;
  const imageData = new ImageData(renderWidth, renderHeight);
  const pixels = imageData.data;

  for (let x = 0; x < renderWidth; x++) {
    for (let y = 0; y < renderHeight; y++) {
      let z_real = (x - renderWidth / 2) / (width * zoom) + panX;
      let z_imag = (y - renderHeight / 2) / (width * zoom) + panY;

      let n = 0;

      while (z_real * z_real + z_imag * z_imag <= 4 && n < maxIterations) {
        const z_real_temp = z_real * z_real - z_imag * z_imag + c_real_fixed;
        z_imag = 2 * z_real * z_imag + c_imag_fixed;
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

  self.postMessage({ imageData, renderWidth, renderHeight });
};
