import { BrowserWindow, ipcMain, shell } from "electron";
import { exec } from "child_process";
import axios from "axios";
import { ipcLog, mainLog } from "../logger";

const IPCHandler = (win: BrowserWindow) => {
    /* ************************************************* ipcMain ********************************************** */
    /* ********** 执行脚本命令 ********** */
    ipcMain.on("command_only_stdout", (_event, code: string) => {
        ipcLog.info('command_only_stdout：', code);
        // 在主进程中执行命令，并将结果返回到渲染进程
        exec(code, (error, stdout, stderr) => {
            ipcLog.info('error:',error,' | stdout:',stdout,' | stderr:',stderr);
            win.webContents.send("command_only_stdout_result", stdout);
        })
    })
    /* ********** 执行脚本命令 ********** */
    ipcMain.on("command", (_event, data) => {
        ipcLog.info('ipc-command：', JSON.stringify(data));
        // 在主进程中执行命令，并将结果返回到渲染进程
        exec(data.command, (error, stdout, stderr) => {
            ipcLog.info('ipc-command：：error:',error,' | stdout:',stdout,' | stderr:',stderr);
            if (stderr) {
                win.webContents.send("command-result", { code: 'stderr', param: data, result: stderr });
                return;
            }
            if (error) {
                win.webContents.send("command-result", { code: 'error', param: data, result: error.message });
                return;
            }
            win.webContents.send("command-result", { code: 'stdout', param: data, result: stdout });
        });
    });
    /* ****************** 监听命令动态返回结果 ******************* */
    let isRunning = false;
    let commandQueue = [];
    let currentProcess = null;
    let installingApp = null;

    ipcMain.on('linglong', (_event, params) => {
        ipcLog.info('linglong：', JSON.stringify(params));
        commandQueue.push(params);
        if (!isRunning) {
            executeNextCommand();
        }
    });

    ipcMain.on('stop-linglong', async (_event, params) => {
        if (currentProcess && installingApp.appId === params.appId && installingApp.name == params.name && installingApp.version == params.version) {
            currentProcess.kill();
            executeNextCommand();
        } else {
            const index = commandQueue.findIndex((i) => i.appId === params.appId && i.name === params.name && i.version === params.version);
            if (index !== -1) {
                commandQueue.splice(index, 1);
            }
        }
    });

    function executeNextCommand() {
        if (commandQueue.length === 0) {
            isRunning = false;
            return;
        }

        isRunning = true;
        const params = commandQueue.shift();
        installingApp = params;
        currentProcess = exec(params.command, { encoding: 'utf8' });

        currentProcess.stdout.on('data', (data) => {
            ipcLog.info(`stdout: ${data}`);
            win.webContents.send("linglong-result", { code: 'stdout', param: params, result: data });
        });

        currentProcess.stderr.on('data', (data) => {
            ipcLog.info(`stderr: ${data}`);
            win.webContents.send("linglong-result", { code: 'stderr', param: params, result: data });
        });

        currentProcess.on('close', (code) => {
            ipcLog.info(`child process exited with code ${code}`);
            win.webContents.send("linglong-result", { code: 'close', param: params, result: code });
            isRunning = false;
            currentProcess = null;
            executeNextCommand();
        });

        currentProcess.on('error', (err) => {
            ipcLog.error(`child process encountered an error: ${err}`);
            win.webContents.send("linglong-result", { code: 'error', param: params, result: err });
            isRunning = false;
            currentProcess = null;
            executeNextCommand();
        });
    }
    /* ****************** 强制退出程序 ******************* */
    ipcMain.on('kill-app',(_event, params) => {
        ipcLog.info('kill-app：', JSON.stringify(params));
        const installProcess = exec(params.command, { encoding: 'utf8' });
        installProcess.stdout.on('data', (data) => {
            ipcLog.info(`stdout: ${data}`);
            win.webContents.send("kill-app-result", { code: 'stdout', param: params, result: data });
        })
        installProcess.stderr.on('data', (data) => {
            ipcLog.info(`stderr: ${data}`);
            win.webContents.send("kill-app-result", { code: 'stderr', param: params, result: data });
        })
        installProcess.on('close', (code) => {
            ipcLog.info(`child process exited with code ${code}`);
            win.webContents.send("kill-app-result", { code: 'close', param: params, result: code });
        })
    })
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
        axios.post(data.url, JSON.stringify({ ...data })).then(response => {
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
        axios.post(data.url, { ...data }).then(response => {
            ipcLog.info('ipc-appLogin-success：',JSON.stringify(response.data));
        }).catch(error => {
            ipcLog.info('ipc-appLogin-error：',error);
        });
    });
    /* ********** 发送意见反馈记录请求 ********** */
    ipcMain.on("suggest", (_event, data) => {
        ipcLog.info('ipc-suggest：', JSON.stringify(data));
        axios.defaults.headers.common['Content-Type'] = 'application/json';
        axios.defaults.timeout = 30000;
        axios.post(data.url, { ...data }).then(response => {
            ipcLog.info('ipc-suggest-success：',JSON.stringify(response.data));
        }).catch(error => {
            ipcLog.info('ipc-suggest-error：',error);
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
