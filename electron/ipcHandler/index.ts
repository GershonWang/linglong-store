import { BrowserWindow, ipcMain } from "electron";
import { exec } from "child_process";
import axios from "axios";
import log from "../logger";

const IPCHandler = (win: BrowserWindow) => {
    /* ************************************************* ipcMain ********************************************** */
    // 执行脚本命令
    ipcMain.on("command", (_event, data) => {
        log.info('command-data：',data);
        // 在主进程中执行命令，并将结果返回到渲染进程
        exec(data.command, (error, stdout, stderr) => {
            if (error) {
                log.info('错误返回error：',error);
                win.webContents.send("command-result", { code: 'error', param: data, result: error.message });
                return;
            }
            if (stderr) {
                log.info('异常返回stderr：',stderr);
                win.webContents.send("command-result", { code: 'stderr', param: data, result: stderr });
                return;
            }
            log.info('正常返回stdout：',stdout);
            win.webContents.send("command-result", { code: 'stdout', param: data, result: stdout });
        });
    });
    // 执行网络请求
    ipcMain.on("network", (_event, data) => {
        log.info('network：',data);
        axios.defaults.headers.common['Content-Type'] = 'application/json';
        axios.defaults.timeout = 30000;
        axios.get(data.url).then(response => {
            const result = response.data;
            result.param = data;
            log.info('network-result：',result);
            win.webContents.send("network-result", result);
        }).catch(error => {
            const response = error.response;
            const result = {
                code: response.status,
                msg: response.data,
                param: data
            };
            log.info('网络异常network-result：',result);
            win.webContents.send("network-result", result);
        });
    });
    /* ************************************************* ipcMain ********************************************** */
}

export default IPCHandler;
