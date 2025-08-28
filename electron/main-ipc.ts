import { app, BrowserWindow, ipcMain } from "electron";
import { ChildProcessWithoutNullStreams, exec, spawn } from "child_process";
import stripAnsi from 'strip-ansi';
import axios from "axios";
import fs from "fs-extra";
import { ipcLog, mainLog } from "./main-logger";
import { join } from "node:path";

/**
 * 主窗口对象所有涉及的渲染线程和主线程之间的交互
 * @param mainWin 主窗口对象
 * @param otherWin 列表窗口对象
 */
const IpcHandler = (mainWin: BrowserWindow, otherWin: BrowserWindow) => {
    
    /* ********** 执行自动化安装玲珑环境的脚本文件 ********** */
    ipcMain.on("to_install_linglong", async (_event, url: string) => {
        ipcLog.info('to_install_linglong >> ', url);
        const scriptPath = join(app.getPath('temp'), 'temp_script.sh');
        ipcLog.info('sh文件目录scriptPath >> ', scriptPath);
        // 1. 发起网络请求获取字符串数据
        await axios.get(`${url}/app/findShellString`).then(async response => {
            ipcLog.info('findShellString >> ', response);
            const reps = response.data;
            const {code, data} = reps;
            if (code == 200 && data && data.length > 0) {
                fs.writeFileSync(scriptPath, data); // 2. 将内容写入 .sh 文件
                fs.chmodSync(scriptPath, '755'); // 3. 赋予 .sh 文件执行权限
                // 4. 执行 .sh 文件并返回结果(继承父进程的输入输出)
                const result = await new Promise((resolve, reject) => {
                    const child = spawn('pkexec', ['bash', scriptPath], { stdio: ['inherit', 'pipe', 'pipe'] });
                    // 监听标准输出流
                    let stdoutData = '';
                    child.stdout.on('data', res => stdoutData += res);
                    ipcLog.info('runScript stdoutData', stdoutData);
                    // 监听标准错误输出流
                    let stderrData = '';
                    child.stderr.on('data', res => stderrData += res);
                    ipcLog.info('runScript stderrData', stderrData);
                    // 监听子进程关闭事件
                    child.on('close', (code) => {
                        if (code === 0) {
                            resolve(stdoutData);
                        } else {
                            reject(new Error(`Child process exited with code ${code}: ${stderrData}`));
                        }
                    });
                });
                ipcLog.info('Script Output:', result);
            } else {
                ipcLog.info('服务暂不可用！', data);
            }
        })
        .catch(error => ipcLog.info('error response', JSON.parse(JSON.stringify(error))))
        .finally(() => {
            // fs.unlinkSync(scriptPath); // 可选：执行完毕后删除脚本文件
            // app.relaunch(); // 重新启动应用
            // app.exit(); // 退出当前应用实例
            mainWin?.destroy();
            otherWin?.destroy();
            app.quit();
        });
    })

    /* ****************** 命令 uname -a ******************* */
    ipcMain.on("uname-a", () => {
        exec("uname -a", (error, stdout, stderr) => {
            ipcLog.info('uname -a >>', { error, stdout, stderr });
            mainWin.webContents.send("uname-a-result", { error, stdout, stderr });
        });
    });

    /* ****************** 命令 uname -m ******************* */
    ipcMain.on("uname-m", () => {
        exec("uname -m", (error, stdout, stderr) => {
            ipcLog.info('uname -m >>', { error, stdout, stderr });
            mainWin.webContents.send("uname-m-result", { error, stdout, stderr });
        });
    });

    /* ****************** 命令 dpkg -l | grep linglong ******************* */
    ipcMain.on("dpkg-linyaps", () => {
        exec("dpkg -l | grep linglong", (error, stdout, stderr) => {
            ipcLog.info('dpkg -l | grep linglong >>', { error, stdout, stderr });
            mainWin.webContents.send("dpkg-linyaps-result", { error, stdout, stderr });
        });
    });

    /* ****************** 命令 apt-cache policy linglong-bin ******************* */
    ipcMain.on("apt-linyaps-bin", () => {
        exec("apt-cache policy linglong-bin", (error, stdout, stderr) => {
            ipcLog.info('apt-cache policy linglong-bin >>', { error, stdout, stderr });
            mainWin.webContents.send("apt-linyaps-bin-result", { error, stdout, stderr });
        });
    });

    /* ****************** 命令 ll-cli --help ******************* */
    ipcMain.on("linyaps-exist", () => {
        exec("ll-cli --help", (error, stdout, stderr) => {
            ipcLog.info('ll-cli --help >>', { error, stdout, stderr });
            mainWin.webContents.send("linyaps-exist-result", { error, stdout, stderr });
        });
    });

    /* ****************** 命令 ll-cli repo show ******************* */
    ipcMain.on("linyaps-repo", () => {
        // 处理非 JSON 格式输出
        const parseRepoInfo = (output: string) => {
            const lines = output.split('\n').filter(line => line.trim() !== '');
            // 提取默认仓库名
            let defaultRepoName = lines[0].split(': ')[1].trim();
            // 跳过标题行
            const repoLines = lines.slice(2);
            let repos = repoLines.map(line => {
                const parts = line.trim().split(/\s{2,}/);
                return { name: parts[0], url: parts[1], alias: parts[2], priority: parts[3] };
            });
            return { defaultRepoName, repos };
        };
        // 初始化返回对象
        let data = {defaultRepoName: '', repos: []};
        // 执行查询脚本
        exec("ll-cli --json repo show", (error, stdout, stderr) => {
            ipcLog.info('ll-cli --json repo show >>', { error, stdout, stderr });
            if (stdout) {  // 如果 stdout 不为空，则解析响应结果
                try {
                    const tout = stripAnsi(stdout.toString());
                    const json = JSON.parse(tout);
                    data.defaultRepoName = json.defaultRepo;
                    data.repos = json.repos;
                } catch { // 解析 JSON 失败，尝试旧版解析
                    exec("ll-cli repo show", (error, stdout, stderr) => {
                        ipcLog.info('解析失败，尝试再执行旧版命令 ll-cli repo show >>', { error, stdout, stderr });
                        if (stdout) {
                            const out = stripAnsi(stdout.toString());
                            const result = parseRepoInfo(out);
                            data.defaultRepoName = result.defaultRepoName;
                            data.repos = result.repos;
                        }
                        // 在内部 exec 回调结束后处理结果
                        handleResult(data);
                    });
                    return;
                }
            } else {
                exec("ll-cli repo show", (error, stdout, stderr) => {
                    ipcLog.info('stdout 为空，尝试再执行旧版命令 ll-cli repo show >>', { error, stdout, stderr });
                    if (stdout) {
                        const out = stripAnsi(stdout.toString());
                        const result = parseRepoInfo(out);
                        data.defaultRepoName = result.defaultRepoName;
                        data.repos = result.repos;
                    }
                    // 在内部 exec 回调结束后处理结果
                    handleResult(data);
                });
                return;
            }
            // 在外部 exec 回调结束后处理结果
            handleResult(data);
        })
        // 将结果返回到渲染进程
        const handleResult = (stdout: any) => {
            ipcLog.info('linyaps-repo >>', JSON.parse(JSON.stringify(stdout)));
            const {defaultRepoName, repos} = stdout;
            let errMes = (!defaultRepoName || repos.length < 1) ? "未配置玲珑源" : '';
            mainWin.webContents.send("linyaps-repo-result", { error: null, stdout, stderr: errMes });
        }
    });

    /* ****************** 命令 ll-cli --json --version ******************* */
    ipcMain.on("linyaps-version", () => {
        exec("ll-cli --json --version", (error, stdout, stderr) => {
            ipcLog.info('ll-cli --json --version >>', { error, stdout, stderr });
            if (stdout) {
                let version = '';
                const out = stripAnsi(stdout.toString()); // 使用 stripAnsi 去除 ANSI 转义序列
                try { // 处理 {"version":"1.6.3"} json 格式
                    const json = JSON.parse(out) as { version: string }; // 类型断言
                    version = json.version;
                } catch { // 处理 "linglong cli 1.6.3" 字符串格式
                    const match = out.match(/(\d+\.\d+\.\d+)/);
                    version = match ? match[1] : '';
                }
                if (version) { // 解析stdout 成功，直接发送到渲染进程
                    mainWin.webContents.send("linyaps-version-result", { error, stdout : version, stderr });
                } else { // 解析stdout 失败，尝试再执行旧版命令
                    exec("ll-cli --version", (error, stdout, stderr) => {
                        ipcLog.info('stdout 为空，尝试再执行旧版命令 ll-cli --version >>', { error, stdout, stderr });
                        let version = '';
                        if (stdout) {
                            const out = stripAnsi(stdout.toString());
                            const match = out.match(/(\d+\.\d+\.\d+)/);
                            version = match ? match[1] : '';
                        }
                        mainWin.webContents.send("linyaps-version-result", { error, stdout : version, stderr });
                    }); 
                }
            } else { // stdout 为空，尝试再执行旧版命令
                exec("ll-cli --version", (error, stdout, stderr) => {
                    ipcLog.info('stdout 为空，尝试再执行旧版命令 ll-cli --version >>', { error, stdout, stderr });
                    let version = '';
                    if (stdout) {
                        const out = stripAnsi(stdout.toString());
                        const match = out.match(/(\d+\.\d+\.\d+)/);
                        version = match ? match[1] : '';
                    }
                    mainWin.webContents.send("linyaps-version-result", { error, stdout : version, stderr });
                });
            }
            mainWin.webContents.send("linyaps-version-result", { error, stdout : "", stderr });
        });
    });

    /* ****************** 命令 ll-cli list ******************* */
    ipcMain.on("linyaps-list", (_event, params) => {
        exec(params.command, (error, stdout, stderr) => {
            ipcLog.info(`${params.command} >> `, { error, stdout: stdout ? JSON.parse(stdout).length : 0, stderr });
            mainWin.webContents.send("linyaps-list-result", { error, stdout, stderr });
        });
    });

    /* ****************** 命令 ll-cli search ******************* */
    ipcMain.on("linyaps-search", (_event, params) => {
        exec(params.command, (error, stdout, stderr) => {
            ipcLog.info(`${params.command} >> `, { error, stdout: stdout ? JSON.parse(stdout).length : 0, stderr });
            mainWin.webContents.send("linyaps-search-result", { error, stdout, stderr });
        });
    });

    /* ****************** 命令 ll-cli update ******************* */
    ipcMain.on("linyaps-update", (_event, params) => {
        exec(params.command, (error, stdout, stderr) => {
            ipcLog.info(`${params.command} >> `, { error, stdout: stdout ? JSON.parse(stdout).length : 0, stderr });
            mainWin.webContents.send("linyaps-update-result", { error, stdout, stderr });
        });
    });

    /* ****************** 命令 ll-cli install xxx ******************* */
    ipcMain.on("linyaps-install", (_event, params) => {
        const { password, appId, version, newVersion } = params;
        // 判断最新版本号是否有值,如果有值代表更新
        const updateVersion = newVersion ? newVersion : version;
        let currentProcess: ChildProcessWithoutNullStreams;
        if (!password) {
            ipcLog.error('linyaps-install：密码为空, 使用非 sudo 安装应用');
            currentProcess = spawn("ll-cli", ["install", `${appId}/${updateVersion}`]);
        } else {
            ipcLog.info('linyaps-install：使用 sudo 安装应用');
            currentProcess = spawn("sudo", ["-S", "ll-cli", "install", `${appId}/${updateVersion}`]);
            // 自动输入密码到 sudo 的标准输入
            currentProcess.stdin.write(password + "\n");
        }
        // 捕获标准输出
        currentProcess.stdout.on("data", (data) => {
            ipcLog.info(`linyaps-install stdout: ${data}`);
            // 使用 stripAnsi 去除 ANSI 转义序列
            let result = stripAnsi(data.toString());
            mainWin.webContents.send(`linyaps-install-result`, { code: 'stdout', params, result });
        });
        // 捕获标准错误
        currentProcess.stderr.on("data", (data) => {
            ipcLog.error(`linyaps-install stderr: ${data}`);
            // 使用 stripAnsi 去除 ANSI 转义序列
            let result = stripAnsi(data.toString());
            mainWin.webContents.send(`linyaps-install-result`, { code: 'stderr', params, result });
        });
        // 捕获错误事件
        currentProcess.on('error', (data) => {
            ipcLog.error(`linyaps-install error: ${data}`);
            // 使用 stripAnsi 去除 ANSI 转义序列
            let result = stripAnsi(data.toString());
            mainWin.webContents.send(`linyaps-install-result`, { code: 'error', params, result });
        });
        // 子进程退出
        currentProcess.on("close", (code) => {
            ipcLog.info(`linyaps-install child process exited with code ${code}`);
            mainWin.webContents.send(`linyaps-install-result`, { code: 'close', params, result: code });
        });
    });

    /* ****************** 命令 ll-cli uninstall xxx ******************* */
    ipcMain.on("linyaps-uninstall", (_event, params) => {
        exec(params.command, (error, stdout, stderr) => {
            ipcLog.info('linyaps-uninstall：：error:', error, ' | stdout:', stdout, ' | stderr:', stderr);
            if (stderr) {
                mainWin.webContents.send("linyaps-uninstall-result", { code: 'stderr', params, result: stderr });
                return;
            }
            if (error) {
                mainWin.webContents.send("linyaps-uninstall-result", { code: 'error', params, result: error.message });
                return;
            }
            mainWin.webContents.send("linyaps-uninstall-result", { code: 'stdout', params, result: stdout });
        });
    });

    /* ****************** 命令 ll-cli prune ******************* */
    ipcMain.on("linyaps-prune", () => {
        exec('ll-cli prune', (error, stdout, stderr) => {
            ipcLog.info(`linyaps-prune >> `, { error, stdout, stderr });
            mainWin.webContents.send("linyaps-prune-result", { error, stdout, stderr });
        });
    });

    /* ****************** 命令 ll-cli run xxx ******************* */
    ipcMain.on('linyaps-run', (_event, params) => {
        const { appId, version } = params;
        let currentProcess = spawn("ll-cli", ["run", `${appId}/${version}`]);
        // 捕获标准输出
        currentProcess.stdout.on("data", (data) => {
            ipcLog.info(`linyaps-run stdout: ${data}`);
            // 使用 stripAnsi 去除 ANSI 转义序列
            let result = stripAnsi(data.toString());
            mainWin.webContents.send(`linyaps-run-result`, { code: 'stdout', params, result });
        });
        // 捕获标准错误
        currentProcess.stderr.on("data", (data) => {
            ipcLog.error(`linyaps-run stderr: ${data}`);
            // 使用 stripAnsi 去除 ANSI 转义序列
            let result = stripAnsi(data.toString());
            mainWin.webContents.send(`linyaps-run-result`, { code: 'stderr', params, result });
        });
        // 捕获错误事件
        currentProcess.on('error', (data) => {
            ipcLog.error(`linyaps-run error: ${data}`);
            // 使用 stripAnsi 去除 ANSI 转义序列
            let result = stripAnsi(data.toString());
            mainWin.webContents.send(`linyaps-run-result`, { code: 'error', params, result });
        });
        // 子进程退出
        currentProcess.on("close", (code) => {
            ipcLog.info(`linyaps-run child process exited with code ${code}`);
            mainWin.webContents.send(`linyaps-run-result`, { code: 'close', params, result: code });
        });
    });

    /* ****************** 命令 ll-cli --json ps ******************* */
    ipcMain.on("linyaps-ps", () => {
        exec('ll-cli --json ps', (error, stdout, stderr) => {
            ipcLog.info(`linyaps-ps >> `, { error, stdout, stderr });
            mainWin.webContents.send("linyaps-ps-result", { error, stdout, stderr });
        });
    });

    /* ****************** 命令 ll-cli kill ******************* */
    ipcMain.on("linyaps-kill", (_event, params) => {
        exec(params.command, (error, stdout, stderr) => {
            ipcLog.info(`linyaps-kill >> `, { error, stdout, stderr });
            mainWin.webContents.send("linyaps-kill-result", { error, stdout, stderr });
        });
    });

    /* ****************** 强制退出程序 ******************* */
    ipcMain.on('kill-app', (_event, params) => {
        ipcLog.info('kill-app：', JSON.stringify(params));
        const installProcess = exec(params.command, { encoding: 'utf8' });
        installProcess.stdout.on('data', (data) => {
            ipcLog.info(`stdout: ${data}`);
            mainWin.webContents.send("kill-app-result", { code: 'stdout', param: params, result: data });
        })
        installProcess.stderr.on('data', (data) => {
            ipcLog.info(`stderr: ${data}`);
            mainWin.webContents.send("kill-app-result", { code: 'stderr', param: params, result: data });
        })
        installProcess.on('close', (code) => {
            ipcLog.info(`child process exited with code ${code}`);
            mainWin.webContents.send("kill-app-result", { code: 'close', param: params, result: code });
        })
    });

    /* ****************** 打开终端并执行命令 ******************* */
    ipcMain.on('open-terminal', (_event, params) => {
        // 验证终端是否可用
        const isTerminalAvailable = (term: string) => {
            try {
                const child = spawn(term, ['--version']);
                child.kill(); // 启动后立即终止进程
                return true;
            } catch {
                return false;
            }
        };
        const terminals = ['deepin-terminal', 'gnome-terminal', 'konsole', 'xfce4-terminal', 'xterm'];
        const terminal = terminals.find(isTerminalAvailable);

        // 定义不同终端的参数配置
        const terminalArgsConfig: Record<string, string[]> = {
            'deepin-terminal': ['-e'],
            'gnome-terminal': ['--', 'bash', '-c'],
            'konsole': ['-e', 'bash', '-c'],
            'xterm': ['-e']
        };

        if (terminal) {
            // 获取对应终端的参数配置
            const arr = [...(terminalArgsConfig[terminal] || []), params.code];
            const child = spawn(terminal, arr, { detached: true,stdio: 'ignore' });
            child.unref()  // 彻底让它脱离主程序
        } else {
            ipcLog.info('open-terminal：', '没有可运行的终端应用');
        }
    });

    /* ****************** 安装本地玲珑包应用 ******************* */
    ipcMain.on('linyapss-package', (_event, params) => {
        ipcLog.info('linyapss-package：', JSON.stringify(params));
        const installProcess = exec(params.command, { encoding: 'utf8' });
        installProcess.stdout.on('data', (data) => {
            ipcLog.info(`stdout: ${data}`);
            let result = stripAnsi(data.toString());
            mainWin.webContents.send("linyapss-package-result", { code: 'stdout', params, result });
        })
        installProcess.stderr.on('data', (data) => {
            ipcLog.info(`stderr: ${data}`);
            let result = stripAnsi(data.toString());
            mainWin.webContents.send("linyapss-package-result", { code: 'stderr', params, result });
        })
        installProcess.on('close', (code) => {
            ipcLog.info(`child process exited with code ${code}`);
            mainWin.webContents.send("linyapss-package-result", { code: 'close', params, result: code });
        })
    });

    /* ********** 通过网络服务获取客户端ip ********** */
    // 使用 ipify API 获取 IPv4/IPv6 地址
    // const response = await axios.get('https://api64.ipify.org?format=json');
    // const response = await axios.get('http://ip-api.com/json');
    ipcMain.on("fetchClientIP", () => {
        axios.defaults.timeout = 1000;
        axios.get('http://ip-api.com/json').then(response => {
            const code = response.data.code;
            const dataList = response.data;
            const result = { code: code, data: dataList };
            mainWin.webContents.send("fetchClientIP-result", result);
        }).catch(error => {
            const response = error.response;
            // 添加响应存在性检查
            const result = { 
                code: response ? response.status : 500, 
                msg: response ? response.data : 'Network error or no response received'
            };
            mainWin.webContents.send("fetchClientIP-result", result);
        });
    });

    /* ********** 调用接口获取分类列表 ********** */
    ipcMain.on("ipc-categories", (_event, data) => {
        axios.defaults.timeout = 3000;
        axios.get(`${data.url}/visit/getDisCategoryList`).then(response => {
            const code = response.data.code;
            const dataList = response.data.data;
            const result = { code: code, data: dataList };
            mainWin.webContents.send("categories-result", result);
        }).catch(error => {
            const response = error.response;
            // 添加响应存在性检查
            const result = { 
                code: response ? response.status : 500, 
                msg: response ? response.data : 'Network error or no response received'
            };
            mainWin.webContents.send("categories-result", result);
        });
    });

    /* ********** 执行安装卸载操作时的记录请求 ********** */
    ipcMain.on("visit", (_event, data) => {
        ipcLog.info('ipc-visit：', JSON.stringify(data));
        axios.defaults.headers.common['Content-Type'] = 'application/json';
        axios.defaults.timeout = 30000;
        axios.post(data.url, { ...data }).then(response => {
            ipcLog.info('ipc-visit-success：', JSON.stringify(response.data))
        }).catch(error => {
            ipcLog.info('ipc-visit-error：', error.message)
        });
    });

    /* ********** 执行APP登陆时的记录请求 ********** */
    ipcMain.on("appLogin", (_event, data) => {
        ipcLog.info('ipc-appLogin：', JSON.stringify(data));
        axios.defaults.headers.common['Content-Type'] = 'application/json';
        axios.defaults.timeout = 30000;
        axios.post(data.url, { ...data }).then(response => {
            ipcLog.info('ipc-appLogin-success：', JSON.stringify(response.data));
        }).catch(error => {
            ipcLog.info('ipc-appLogin-error：', error.message);
        });
    });

    /* ********** 发送意见反馈记录请求 ********** */
    ipcMain.on("suggest", (_event, data) => {
        ipcLog.info('ipc-suggest：', JSON.stringify(data));
        axios.defaults.headers.common['Content-Type'] = 'application/json';
        axios.defaults.timeout = 30000;
        axios.post(data.url, { ...data }).then(response => {
            ipcLog.info('ipc-suggest-success：', JSON.stringify(response.data));
        }).catch(error => {
            ipcLog.info('ipc-suggest-error：', error);
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
    
    /* ************** 监听渲染进程发送的退出程序消息 *************** */
    ipcMain.on('app-quit', () => {
        mainWin?.destroy();
        otherWin?.destroy();
        app.quit();
    });

    /* ****************** 获取系统版本号 ******************* */
    ipcMain.on('app-version', (event) => {
        const appVersion = app.getVersion();
        event.sender.send('app-version-result', appVersion);
    })

    /* ************** 监听渲染进程关闭事件的响应 *************** */
    ipcMain.on('close-action', (_event, action) => {
        if (action === 'minimize') {
            // mainWin?.minimize();
            mainWin?.hide();
            otherWin?.hide();
        } else if (action === 'quit') {
            mainWin?.destroy();
            otherWin?.destroy();
            app.quit();
        }
    });
}

export default IpcHandler;