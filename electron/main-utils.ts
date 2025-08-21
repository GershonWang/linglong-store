import fs from "fs-extra";
import { app } from "electron";
import { join } from "node:path";
import { mainLog } from "./main-logger";
import { protocolState } from "./main-main-win";

export function clearCacheFiles() {
    // 清理升级缓存
    const homePath = app.getPath('home');
    clearPathFile(homePath, '/.cache/linglong-store-updater');
    // 清理日志文件
    const logPath = app.getPath('logs');
    clearPathFile(logPath, 'main.log');
    clearPathFile(logPath, 'main');
    clearPathFile(logPath, 'print-updater');
}

function clearPathFile(logPath: string, logFile: string) {
    try {
        const logFilePath = join(logPath, logFile);
        mainLog.log('要清除的文件目录:', logFilePath);
        // 检测目录是否存在
        fs.pathExists(logFilePath, (err, exists) => {
            if (err) {
                mainLog.error('检测目录是否存在时出现错误:', err);
                return;
            }
            if (exists) {
                try {
                    fs.rmSync(logFilePath, { recursive: true }); // recursive: true 递归删除的参数
                } catch (rmError) {
                    mainLog.error('删除文件目录时出现错误:', rmError);
                }
            }
        });
    } catch (error) {
        mainLog.error('清除文件目录时出现异常:', error);
    }
}

/**
 * 处理接收到的自定义协议请求
 * 1.以layer、uab结尾的文件安装(home/Jokul/Downloads/org.tencent.wechat.linyaps_4.0.1.12_x86_64_binary.layer)
 * 2.以自定义协议开头的文件下载(linyapsss://install/org.tencent.wechat.linyaps) 自定义协议://采取的方式/APPID
 * @param args 自定义协议传入的参数
 * @param mainWindow 主窗口
 */
export function handleCustomProtocol(args, mainWindow) {
    mainLog.log('自定义协议传入的参数:', args);
    const layerFile = args.find(arg => arg.endsWith('.layer') || arg.endsWith('.uab') || arg.startsWith('linyapsss://'));
    if (layerFile) {
        mainLog.log('处理自定义协议请求:', layerFile);
        // 修改：通过对象属性访问状态
        if (mainWindow && protocolState.isMainWindowReady) {
            mainWindow.webContents.send('custom-protocol', layerFile);
        } else if (mainWindow) {
            protocolState.pendingProtocolMessage = layerFile;
            mainLog.log('窗口未就绪，消息已存入队列:', layerFile);
        }
    }
}