import { app, BrowserWindow, shell, Menu } from "electron";
import { join } from "node:path";
import fs from "fs-extra";
import { mainLog } from "./logger";
import IPCHandler from "./ipcHandler";
import { updateHandle } from "./update";

process.env.DIST_ELECTRON = join(__dirname, '../dist-electron');
process.env.DIST = join(__dirname, "../dist");
process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL ? join(process.env.DIST_ELECTRON, '../public') : process.env.DIST;

const preload = join(__dirname, 'preload.js')
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
const indexHtml = join(process.env.DIST, "index.html");

let win: BrowserWindow | null;

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
    win.webContents.openDevTools({ mode: "detach" });
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(indexHtml);
  }
  // Test active push message to Renderer-process.
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
// 应用准备就绪创建窗口
app.whenReady().then(() => {
  createWindow();
  // 加载IPC服务
  IPCHandler(win);
  // 自动更新
  updateHandle(win);
});
// 应用监听所有关闭事件，退出程序
app.on("window-all-closed", () => {
  win = null;
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
// 应用监听开启第二个窗口
app.on('second-instance', () => {
  if (win) {
    if (win.isMinimized()) {
      win.restore()
    }
    win.focus()
  }
})
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
// 处理应用程序关闭事件
app.on('before-quit', () => {
  // 在这里进行必要的清理操作，如果有未完成的更新，取消它
  clearUpdateCache();
  win.webContents.send('removeDownListener');
});
// 清理升级缓存
function clearUpdateCache() {
  try {
    const updateCachePath = join(app.getPath('home'), '/.cache/linglong_store-updater');
    mainLog.log('清除更新缓存', updateCachePath);
    // 检测更新日志目录是否存在
    fs.pathExists(updateCachePath, (err, exists) => {
      if (err) {
        mainLog.error('Error checking file existence:', err);
      } else {
        mainLog.log('exists', exists);
        if (exists) {
          fs.rmSync(updateCachePath, { recursive: true });
        }
      }
    });
  } catch (error) {
    mainLog.error('Error clearing update cache:', error);
  }
}