import { BrowserWindow, Menu, screen, ipcMain } from "electron";
import { join } from "node:path";

const floatingBallHtml = join(process.env.DIST, "floatingBall/index.html");

let floatingBallWindow: BrowserWindow | null; // 悬浮球窗口
let floatingEnabled = false;

function createFloatingBallWindow() {
    // 创建悬浮球
    function createFloatingBallWindow() {
        const { width, height } = screen.getPrimaryDisplay().workAreaSize;
        floatingBallWindow = new BrowserWindow({
            width: 50,                // 宽度
            height: 80,               // 高度
            frame: false,             // 无边框窗口
            transparent: true,        // 背景透明
            alwaysOnTop: true,        // 窗口始终在最上面
            resizable: false,         // 禁止改变窗口大小
            hasShadow: false,         // 不需要窗口阴影
            x: width - 100,           // 默认定位-宽度减100 在右边
            y: height - 150,          // 默认定位-高度减100 在下边
            webPreferences: {
                preload: join(__dirname, 'preloadBall.js'),
                contextIsolation: true,
                nodeIntegration: true   // 允许使用Node.js
            }
        });
        // 禁用菜单，一般情况下，不需要禁用
        Menu.setApplicationMenu(null);
        // 根据是否存在开发服务地址判断加载模式
        if (process.env.VITE_DEV_SERVER_URL) {
            floatingBallWindow.loadFile(join(process.env.PUBLIC, '../floatingBall/index.html'));
        } else {
            floatingBallWindow.loadFile(floatingBallHtml);
        }

        floatingBallWindow.on('closed', () => {
            console.log('closed');

            floatingBallWindow = null;
        });
    }

    // 监听显示隐藏悬浮球
    ipcMain.on('toggle-floating', (_event, enable) => {
        floatingEnabled = enable;
        if (floatingEnabled) {
            if (!floatingBallWindow) {
                createFloatingBallWindow();
            }
            floatingBallWindow.show();
        } else {
            if (floatingBallWindow) {
                floatingBallWindow.hide();
                floatingBallWindow = null;
            }
        }
    });
}

export default createFloatingBallWindow;