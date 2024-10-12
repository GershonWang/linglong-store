import { app, BrowserWindow, shell, screen, Menu, ipcMain } from "electron";
import { join } from "node:path";
import { mainLog } from "./logger";
import TrayMenu from "./trayMenu";
import IPCHandler from "./ipcHandler";
import { updateHandle } from "./update";
import { clearUpdateCache } from "./utils";
import installList from "./utils/installList";

process.env.DIST_ELECTRON = join(__dirname, '../dist-electron');
process.env.DIST = join(__dirname, "../dist");
process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL ? join(process.env.DIST_ELECTRON, '../public') : process.env.DIST;

const preload = join(__dirname, 'preload.js')
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
const indexHtml = join(process.env.DIST, "index.html");
const floatingBallHtml = join(process.env.DIST, "floatingBall/index.html");

let win: BrowserWindow | null;
let floatingBallWindow; // 悬浮球窗口
let floatingEnabled = false;

// 创建窗口并初始化相关参数
function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 768,
    minWidth: 800,
    minHeight: 600,
    icon: join(process.env.PUBLIC, "logo.png"),
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false, // 解决渲染进程中无法使用nodejs/electron函数方法
      // webSecurity: false, // 禁用 Web 安全策略
    },
  });
  mainLog.info("dev环境的配置地址", VITE_DEV_SERVER_URL);
  mainLog.info("pro环境的配置地址", indexHtml);
  // 禁用菜单，一般情况下，不需要禁用
  Menu.setApplicationMenu(null);
  // 根据是否存在开发服务地址判断加载模式
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(indexHtml);
  }
  // 测试程序加载完毕，打印当前时间
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });
  // 设置所有链接通过默认浏览器打开，而非程序内打开
  win.webContents.setWindowOpenHandler(({ url }) => {
    mainLog.info("打开url", url);
    // 如果是http或https协议的链接，则通过默认浏览器打开
    if (url.startsWith("https:") || url.startsWith("http:")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });
}

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

// 应用准备就绪创建窗口
app.whenReady().then(() => {
  createWindow(); // 创建商店主窗口
  createFloatingBallWindow();  // 创建悬浮按钮
  TrayMenu(win); // 加载托盘
  IPCHandler(win); // 加载IPC服务
  updateHandle(win); // 自动更新
  installList();      // 加载弹出层
  // macOS事件(应用被激活时触发)
  app.on('activate', () => {
    const allWindows = BrowserWindow.getAllWindows();
    mainLog.info('活跃窗口个数：', allWindows.length);
    if (allWindows.length) {
      allWindows[0].focus()
    } else {
      createWindow()
    }
  })
});

// 应用监听所有关闭事件，退出程序
app.on("window-all-closed", () => {
  win = null;
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
// 应用监听开启第二个窗口
// app.on('second-instance', () => {
//   if (win) {
//     if (win.isMinimized()) {
//       win.restore()
//     }
//     win.focus()
//   }
// })
// 处理应用程序关闭事件
app.on('before-quit', () => {
  // 在这里进行必要的清理操作，如果有未完成的更新，取消它
  clearUpdateCache();
});