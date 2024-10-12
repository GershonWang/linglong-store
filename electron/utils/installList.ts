import { BrowserWindow, Menu, ipcMain } from "electron";
import { join } from "node:path";

process.env.DIST = join(__dirname, "../dist");
const listDialogHtml = join(process.env.DIST, "listDialog/index.html");

let listDialog: BrowserWindow | null; // 悬浮球窗口
let isListDialogShow = false;

function installList() {

    function createFloatingBallWindow() {
        listDialog = new BrowserWindow({
            width: 800,                // 宽度
            height: 600,               // 高度
            alwaysOnTop: true,        // 窗口始终在最上面
            resizable: false,         // 禁止改变窗口大小
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
            // listDialog.webContents.openDevTools({ mode: "detach" });
            listDialog.loadFile(join(process.env.PUBLIC, '../listDialog/index.html'));
        } else {
            listDialog.loadFile(listDialogHtml);
        }

        listDialog.on('closed', () => {
            console.log('closed111');

            listDialog = null;
        });
    }

    ipcMain.on('open-list-dialog', (_event, enable) => {
        isListDialogShow = enable;
        if (isListDialogShow) {
            if (!listDialog) {
                createFloatingBallWindow();
            }
            listDialog.show();
        } else {
            if (listDialog) {
                listDialog.hide();
                listDialog = null;
            }
        }
    });
}

export default installList;