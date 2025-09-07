self.onmessage = (event) => {
    const { width, height, renderWidth, renderHeight, maxIterations, zoom, panX, panY } = event.data;
    const offscreenCanvas = new OffscreenCanvas(renderWidth, renderHeight);
    const offscreenCtx = offscreenCanvas.getContext("2d");


    const imageData = offscreenCtx.createImageData(renderWidth, renderHeight);



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


        self.postMessage(imageData);
};
