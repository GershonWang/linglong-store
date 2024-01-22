import { BrowserWindow, ipcMain } from "electron";
import { exec } from "child_process";
import axios from "axios";

const IPCHandler = (win: BrowserWindow) => {
    /* ************************************************* ipcMain ********************************************** */
    // 执行脚本命令
    ipcMain.on("command", (_event, data) => {
        console.log('command-data',data);
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
            win.webContents.send("command-result", { code: 'stdout', param: data, result: stdout });
        });
    });
    // 执行网络请求
    ipcMain.on("network", (_event, data) => {
        axios.defaults.headers.common['Content-Type'] = 'application/json';
        axios.defaults.timeout = 30000;
        axios.get(data.url).then(response => {
            const result = response.data;
            result.param = data;
            win?.webContents.send("network-result", result);
        }).catch(error => {
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
}

export default IPCHandler;
