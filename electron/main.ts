import { app, BrowserWindow, shell, Menu, ipcMain } from "electron";
import { exec } from "child_process";
import { join } from "node:path";

process.env.DIST_ELECTRON = join(__dirname, '../dist-electron')
process.env.DIST = join(__dirname, "../dist");
process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL ? join(process.env.DIST_ELECTRON, '../public') : process.env.DIST

let win: BrowserWindow | null;
const preload = join(__dirname, 'preload.js')
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
const indexHtml = join(process.env.DIST, "index.html");

// 创建窗口并初始化相关参数
function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: join(process.env.PUBLIC, "logo.png"),
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false, // 解决渲染进程中无法使用nodejs/electron函数方法
      webSecurity: false, // 禁用 Web 安全策略
    },
  });
  // 禁用菜单，一般情况下，不需要禁用
  Menu.setApplicationMenu(null);
  // 根据是否存在开发服务地址判断加载模式
  if (process.env.VITE_DEV_SERVER_URL) {
    console.log("dev环境的配置地址", VITE_DEV_SERVER_URL);
    win.webContents.openDevTools({ mode: "detach" });
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    console.log("pro环境的配置地址", indexHtml);
    win.loadFile(indexHtml);
  }
  // Test active push message to Renderer-process.
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });
  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https:") || url.startsWith("http:"))
      shell.openExternal(url);
    return { action: "deny" };
  });
}
app.whenReady().then(createWindow);
app.on("window-all-closed", () => {
  win = null;
  if (process.platform !== 'darwin') app.quit()
});
app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})
app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows();
  console.log('allWindows.length',allWindows.length)
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

// 执行脚本命令
ipcMain.on("command",(_event,data) => {
  // 在主进程中执行命令，并将结果返回到渲染进程
  exec(data.command, (error, stdout, stderr) => {
    if (error) {
      console.error(`执行命令出错: ${error.message}`);
      win?.webContents.send("command-result", {code: 'error',data: data,result: error.message});
      return;
    }
    if (stderr) {
      console.error(`命令执行错误: ${stderr}`);
      win?.webContents.send("command-result", {code: 'stderr',data: data,result: stderr});
      return;
    }
    console.log(`命令执行结果: ${stdout}`);
    win?.webContents.send("command-result", {code: 'stdout',data: data,result: stdout});
  });
})