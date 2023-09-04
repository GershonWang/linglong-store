import { app, BrowserWindow, Menu, ipcMain } from 'electron'
import { exec } from 'child_process';
import path from 'node:path'

process.env.DIST = path.join(__dirname, '../dist')
process.env.PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')


let win: BrowserWindow | null
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {

  // 禁用菜单，一般情况下，不需要禁用
  Menu.setApplicationMenu(null);

  win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(process.env.PUBLIC, 'logo.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      webSecurity: false, // 禁用 Web 安全策略
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    console.log("dev环境的配置地址",VITE_DEV_SERVER_URL);
    win.webContents.openDevTools({'mode':'detach'});
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(process.env.DIST, 'index.html'))
  }

  ipcMain.on('execute-command', (event, command) => {
    // 在主进程中执行命令，并将结果返回到渲染进程
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`执行命令出错: ${error.message}`);
        win?.webContents.send('command-result', error.message);
        return;
      }
      if (stderr) {
        console.error(`命令执行错误: ${stderr}`);
        win?.webContents.send('command-result', stderr);
        return;
      }
      console.log(`命令执行结果: ${stdout}`);
      win?.webContents.send('command-result', stdout);
    });
  });
}

app.on('window-all-closed', () => {
  win = null
})

app.whenReady().then(createWindow)

