import { BrowserWindow, ipcMain, shell } from "electron";
import { exec } from "child_process";
import axios from "axios";
import { ipcLog, mainLog } from "../logger";

const IPCHandler = (win: BrowserWindow) => {
    /* ************************************************* ipcMain ********************************************** */
    /* ********** 执行脚本命令 ********** */
    ipcMain.on("command", (_event, data) => {
        ipcLog.info('ipc-command：', JSON.stringify(data));
        // 在主进程中执行命令，并将结果返回到渲染进程
        exec(data.command, (error, stdout, stderr) => {
            // ipcLog.info('error:',error,' | stdout:',stdout,' | stderr:',stderr);
            if (error) {
                win.webContents.send("command-result", { code: 'error', param: data, result: error.message });
                return;
            }
            if (stderr) {
                win.webContents.send("command-result", { code: 'stderr', param: data, result: stderr });
                return;
            }
            win.webContents.send("command-result", { code: 'stdout', param: data, result: stdout });
        });
        // const installProcess = exec(data.command);
        // installProcess.stdout.on('data', (data1) => {
        //     console.log(`stdout: ${data1}`);
        //     // ipcLog.info('data:',data);
        //     win.webContents.send("command-result", { code: 'stdout', param: data, result: data1 });
        // })
        // installProcess.stderr.on('data', (data1) => {
        //     console.log(`stderr: ${data1}`);
        //     // ipcLog.info('data:',data);
        //     // win.webContents.send("command-result", { code: 'stderr', param: data, result: data });
        // })
        // installProcess.on('close', (code) => {
        //     console.log(`child process exited with code ${code}`);
        //     // ipcLog.info('code:',code);
        //     // win.webContents.send("command-result", { code: 'stdout', param: data, result: code });
        // })
    });
    /* ********** 执行网络请求 ********** */
    ipcMain.on("network", (_event, data) => {
        ipcLog.info('ipc-network：', JSON.stringify(data));
        axios.defaults.headers.common['Content-Type'] = 'application/json';
        axios.defaults.timeout = 30000;
        axios.get(data.url).then(response => {
            const code = response.data.code;
            const dataList = response.data.data.list;
            const result = {
                code: code,
                data: dataList,
                param: data
            };
            // 打印日志加密(btoa)/解密(atob)
            // ipcLog.info('ipc-network-result：请求返回正常');
            win.webContents.send("network-result", result);
        }).catch(error => {
            const response = error.response;
            const result = {
                code: response.status,
                msg: response.data,
                param: data
            };
            // ipcLog.info('ipc-network-error：',JSON.stringify(result));
            win.webContents.send("network-result", result);
        });
    });
    /* ********** 执行安装卸载操作时的记录请求 ********** */
    ipcMain.on("visit", (_event, data) => {
        ipcLog.info('ipc-visit：', JSON.stringify(data));
        axios.defaults.headers.common['Content-Type'] = 'application/json';
        axios.defaults.timeout = 30000;
        // const url = "http://linglong.dongpl.com:8687/visit/save";
        const url = "http://120.26.202.221:8687/visit/save";
        const params = {  
            appId: data.appId,  
            name: data.name,  
            version: data.version,  
            command: data.command,  
        };  
        axios.post(url, JSON.stringify(params)).then(response => {
            ipcLog.info('ipc-visit-success：',JSON.stringify(response.data))
        }).catch(error => {
            ipcLog.info('ipc-visit-error：',error)
        });
    });
    /* ********** 执行APP登陆时的记录请求 ********** */
    ipcMain.on("appLogin", (_event, data) => {
        ipcLog.info('ipc-appLogin：', JSON.stringify(data));
        axios.defaults.headers.common['Content-Type'] = 'application/json';
        axios.defaults.timeout = 30000;
        // const url = "http://linglong.dongpl.com:8687/visit/appLogin";
        const url = "http://120.26.202.221:8687/visit/appLogin";
        // const params = {  
            // llVersion: data.llVersion,  
            // appVersion: data.appVersion,  
        // };
        const params = { ...data }  
        axios.post(url, params).then(response => {
            // console.log('response',response);
            ipcLog.info('ipc-appLogin-success：',JSON.stringify(response.data));
        }).catch(error => {
            ipcLog.info('ipc-appLogin-error：',error);
        });
    });
    /* ********** 执行渲染进程的操作日志记录请求 ********** */
    ipcMain.on('logger', (_event, level, arg) => {
        if (level === "info") {
            mainLog.info(arg);
        } else if (level === 'warn') {
            mainLog.warn(arg);
        } else if (level === 'error') {
            mainLog.error(arg);
        } else if (level === 'debug') {
            mainLog.debug(arg);
        }
    })
    /* ************************************************* ipcMain ********************************************** */
}

export default IPCHandler;
