window.onload = function() {
    const canvas = document.getElementById('juliaCanvas');
    const ctx = canvas.getContext('2d');
    const messageBox = document.getElementById('messageBox');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const zoomSpeedSlider = document.getElementById('zoomSpeedSlider');
    const cRealSlider = document.getElementById('cRealSlider');
    const cImagSlider = document.getElementById('cImagSlider');
    const cRealValue = document.getElementById('cRealValue');
    const cImagValue = document.getElementById('cImagValue');

    let width = Math.min(window.innerWidth * 0.9, 800);
    let height = Math.min(window.innerHeight * 0.7, 600);
    canvas.width = width;
    canvas.height = height;

    let maxIterations = 250;
    let zoom = 0.335; 
    let panX = 0;
    let panY = 0;
    let isHighRes = false;
    let zoomSpeed = parseFloat(zoomSpeedSlider.value) / 100 + 1;
    let c_real = parseFloat(cRealSlider.value);
    let c_imag = parseFloat(cImagSlider.value);

    let isDragging = false;
    let lastMouseX = 0;
    let lastMouseY = 0;

    const worker = new Worker('worker.js');

    worker.onmessage = (event) => {
        const { imageData, renderWidth, renderHeight } = event.data;
        const offscreenCanvas = new OffscreenCanvas(renderWidth, renderHeight);
        const offscreenCtx = offscreenCanvas.getContext('2d');
        offscreenCtx.putImageData(imageData, 0, 0);
        ctx.drawImage(offscreenCanvas, 0, 0, width, height);
        loadingIndicator.style.display = 'none';
    };

    function updateMaxIterations() {
        maxIterations = Math.round(250 + Math.log(zoom) * 100);
        maxIterations = Math.max(250, Math.min(maxIterations, 1500));
    }

    function init() {
        window.addEventListener('resize', () => {
            width = Math.min(window.innerWidth * 0.9, 800);
            height = Math.min(window.innerHeight * 0.7, 600);
            canvas.width = width;
            canvas.height = height;
            drawJuliaSet();
        });
        addEventListeners();
        drawJuliaSet();
        updateCValues();
    }

    function updateCValues() {
        cRealValue.textContent = c_real.toFixed(5);
        cImagValue.textContent = c_imag.toFixed(5);
    }

    function addEventListeners() {

        canvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
            canvas.style.cursor = 'grabbing';
        });

        canvas.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const dx = e.clientX - lastMouseX;
                const dy = e.clientY - lastMouseY;
                panX -= dx / (width * zoom);
                panY -= dy / (height * zoom);
                lastMouseX = e.clientX;
                lastMouseY = e.clientY;
                drawJuliaSet();
            }
        });

        window.addEventListener('mouseup', () => {
            isDragging = false;
            canvas.style.cursor = 'grab';
        });

        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            
            const zoomFactor = e.deltaY > 0 ? 1 / zoomSpeed : zoomSpeed;
            const mouseX = e.offsetX;
            const mouseY = e.offsetY;
            const real = (mouseX - width / 2) / (width * zoom) + panX;
            const imag = (mouseY - height / 2) / (width * zoom) + panY;
            zoom *= zoomFactor;
            panX = real - (mouseX - width / 2) / (width * zoom);
            panY = imag - (mouseY - height / 2) / (width * zoom);
            drawJuliaSet();
            showMessage(`Zoom: ${Math.round(100 * zoom)}%`);
        });

        document.getElementById('zoomInBtn').addEventListener('click', () => {
            zoom *= zoomSpeed;
            drawJuliaSet();
            showMessage(`Zoom: ${Math.round(100 * zoom)}%`);
        });

        document.getElementById('zoomOutBtn').addEventListener('click', () => {
            zoom /= zoomSpeed;
            drawJuliaSet();
            showMessage(`Zoom: ${Math.round(100 * zoom)}%`);
        });

        document.getElementById('highResBtn').addEventListener('click', () => {
            isHighRes = !isHighRes;
            drawJuliaSet();
            showMessage(`High-Res Mode: ${isHighRes ? 'Enabled' : 'Disabled'}`);
        });

        document.getElementById('resetBtn').addEventListener('click', () => {
            zoom = 0.5;
            panX = 0;
            panY = 0;
            isHighRes = false;
            maxIterations = 250;
            c_real = -0.7;
            c_imag = 0.27015;
            cRealSlider.value = c_real;
            cImagSlider.value = c_imag;
            drawJuliaSet();
            updateCValues();
            showMessage('View and C values have been reset.');
        });

        zoomSpeedSlider.addEventListener('input', (e) => {
            zoomSpeed = parseFloat(e.target.value) / 100 + 1;
        });

        cRealSlider.addEventListener('input', (e) => {
            c_real = parseFloat(e.target.value);
            drawJuliaSet();
            updateCValues();
        });
        
        cImagSlider.addEventListener('input', (e) => {
            c_imag = parseFloat(e.target.value);
            drawJuliaSet();
            updateCValues();
        });
    }

    function drawJuliaSet() {
        loadingIndicator.style.display = 'block';

        updateMaxIterations();

        const renderWidth = isHighRes ? width * 2 : width;
        const renderHeight = isHighRes ? height * 2 : height;
        
        worker.postMessage({
            width,
            height,
            renderWidth,
            renderHeight,
            zoom,
            panX,
            panY,
            maxIterations,
            c_real_fixed: c_real,
            c_imag_fixed: c_imag
        });
    }

    function showMessage(text) {
        messageBox.textContent = text;
        messageBox.style.opacity = '1';
        setTimeout(() => {
            messageBox.style.opacity = '0';
        }, 3000);
    }

    init();
}
