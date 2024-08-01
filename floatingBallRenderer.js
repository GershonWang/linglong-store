const { ipcRenderer } = require('electron');

const ball = document.getElementById('ball');
let isDragging = false;
let offsetX, offsetY;

ball.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - ball.getBoundingClientRect().left;
    offsetY = e.clientY - ball.getBoundingClientRect().top;
    ball.style.cursor = 'grabbing';
});

document.addEventListener('mousemove', (e) => {
  if (isDragging) {
    const x = e.clientX - offsetX;
    const y = e.clientY - offsetY;
    ball.style.left = `${x}px`;
    ball.style.top = `${y}px`;

    // 发送拖动位置到主进程
    ipcRenderer.send('update-floating-ball-position', { x, y });
  }
});

document.addEventListener('mouseup', () => {
    isDragging = false;
    ball.style.cursor = 'pointer';
});
