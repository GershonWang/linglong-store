import { app, BrowserWindow, shell, Menu, ipcMain } from "electron";
import { exec } from "child_process";
import { join } from "node:path";
import axios from "axios";

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
    width: 1366,
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
  console.log("dev环境的配置地址", VITE_DEV_SERVER_URL);
  console.log("pro环境的配置地址", indexHtml);
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
    console.log("url", url);
    // 如果是http或https协议的链接，则通过默认浏览器打开
    if (url.startsWith("https:") || url.startsWith("http:")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });
}
// 应用准备就绪创建窗口
app.whenReady().then(createWindow);
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
app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows();
  console.log('allWindows.length', allWindows.length)
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

/* ************************************************* ipcMain ********************************************** */
// 执行脚本命令
ipcMain.on("command", (_event, data) => {
  // 在主进程中执行命令，并将结果返回到渲染进程
  exec(data.command, (error, stdout, stderr) => {
    if (error) {
      win?.webContents.send("command-result", { code: 'error', param: data, result: error.message });
      return;
    }
    if (stderr) {
      win?.webContents.send("command-result", { code: 'stderr', param: data, result: stderr });
      return;
    }
    win?.webContents.send("command-result", { code: 'stdout', param: data, result: stdout });
  });
});
// 执行网络请求
ipcMain.on("network", (_event, data) => {
  axios.defaults.headers.common['Content-Type'] = 'application/json';
  axios.defaults.timeout = 30000;
  axios.get(data.url).then(response =>{
    const result = response.data;
    result.param = data;
    win?.webContents.send("network-result", result);
  }).catch(error =>{
    const response = error.response;
    const result = {
      code: response.status,
      msg: response.data,
      param: data
    };
    win?.webContents.send("network-result", result);
  });
});
/* ************************************************* ipcMain ********************************************** */