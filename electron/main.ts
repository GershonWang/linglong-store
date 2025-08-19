import { app, BrowserWindow } from "electron";
import { mainLog } from "./main-logger";
import trayMenu from "./main-tray";
import IpcHandler from "./main-ipc";
import { mainWin, createMainWindow } from "./main-main-win";
import { otherWin, createOtherWindow } from "./main-myapps-win";
import { updateHandle } from "./electron-update";
import { clearCacheFiles, handleCustomProtocol } from "./main-utils";

// 确保单实例
if (app.requestSingleInstanceLock()) {
  // 应用监听开启第二个窗口事件
  app.on('second-instance', (_event, argv) => {
    // Linux 会通过 argv 传递 URL
    mainLog.info('应用监听开启第二个窗口事件:', argv);
    handleCustomProtocol(argv, mainWin);
    if (mainWin) {
      if (mainWin.isMinimized()) {
        mainWin.restore();
      }
      if (!mainWin.isVisible()) {
        mainWin.show();
      }
      mainWin.focus();
    }
  });
  app.whenReady().then(() => {
    // createOtherWindow(); // 创建我的应用窗口
    createMainWindow(); // 创建商店主窗口
    trayMenu(mainWin, otherWin); // 加载托盘
    IpcHandler(mainWin, otherWin); // 加载IPC服务
    updateHandle(mainWin); // 自动更新
    // 处理首次启动时的协议调用
    mainLog.info('处理首次启动时的协议调用:', process.argv);
    handleCustomProtocol(process.argv, mainWin);
    // macOS事件(应用被激活时触发)
    app.on('activate', () => {
      const allWindows = BrowserWindow.getAllWindows();
      mainLog.info('活跃窗口个数：', allWindows.length);
      if (allWindows.length) {
        allWindows[0].focus()
      } else {
        createMainWindow()
      }
    })
  });

  app.on('open-url', (event, url) => {
    event.preventDefault();
    mainLog.info('自定义协议打开的地址：', url);
    console.log('Protocol URL:', url);
    handleCustomProtocol([url], mainWin);
  });
} else {
  app.quit();
}

// 应用监听所有关闭事件，退出程序
app.on("window-all-closed", () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 处理应用程序关闭事件（在这里进行必要的清理操作，如果有未完成的更新，取消它）
app.on('before-quit', () => clearCacheFiles());