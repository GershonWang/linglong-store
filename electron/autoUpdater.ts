import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import log from './logger'
import { autoUpdater } from 'electron-updater'
const fs = require('fs-extra')
const path = require('path')
 
// 检测更新，在你想要检查更新的时候执行，renderer事件触发后的操作自行编写
export function updateHandle(mainWindow: BrowserWindow) {
  console.log('updateHandle',mainWindow);
  //                            清除每次更新下载的文件，否则无法进行更新
  //= ==============================================================================================================
  // updaterCacheDirName的值与src/main/app-update.yml中的updaterCacheDirName值一致，在windows中会创建一个类似
  // C:\Users\Administrator\AppData\Local\slient-print-updater\pending文件存储更新下载后的文件"*.exe"和"update-info.json"
  // let updaterCacheDirName = 'slient-print-updater'
  // const updatePendingPath = path.join(app.baseCachePath, updaterCacheDirName, 'pending')
  // log.warn('updatePendingPath:' + updatePendingPath)
  // fs.emptyDir(updatePendingPath)
  let message = {
    error: '检查更新出错',
    checking: '正在检查更新……',
    updateAva: '检测到新版本，正在下载……',
    updateNotAva: '现在使用的就是最新版本，不用更新'
  }
   // 也可以通过代码配置文件服务地址
  autoUpdater.setFeedURL({
    provider: 'generic',
    url: '服文件地址'
  })
  // 设置是否自动下载，默认是true,当点击检测到新版本时，会自动下载安装包，所以设置为false
  autoUpdater.autoDownload = false
  autoUpdater.logger = log
  // 正在检查更新
  autoUpdater.on('error', function (error) {
    sendUpdateMessage(message.error, mainWindow)
  })
  autoUpdater.on('checking-for-update', function () {
    sendUpdateMessage(message.checking, mainWindow)
  })
  // 有新的可用更新
  autoUpdater.on('update-available', function (info) {
    sendUpdateMessage(message.updateAva, mainWindow)
  })
  //  没有可用的更新，也就是当前是最新版本
  autoUpdater.on('update-not-available', function (info) {
    sendUpdateMessage(message.updateNotAva, mainWindow)
  })
 
  // 更新下载进度事件
  autoUpdater.on('download-progress', function (progressObj) {
    mainWindow.webContents.send('downloadProgress', progressObj)
  })
  // 新安装包下载完成
  autoUpdater.on('update-downloaded', function (_event:any) {
    console.log('update-downloaded', _event);
    ipcMain.on('isUpdateNow', (e, arg) => {
      log.warn('开始更新')
      autoUpdater.quitAndInstall()
    })
    mainWindow.webContents.send('isUpdateNow')
  })
 
  ipcMain.on('checkForUpdate', () => {
    // 执行自动更新检查
    log.warn('执行自动更新检查, isDestroyed:', mainWindow.isDestroyed())
    // 解决mac重启App 报错 的问题: object has been destroyed
    if (mainWindow &&!mainWindow.isDestroyed()) {
      autoUpdater.checkForUpdates()
    }
  })
 
  ipcMain.on('downloadUpdate', () => {
    // 下载
    log.warn('执行下载')
    autoUpdater.downloadUpdate()
  })
}
 
// 通过main进程发送事件给renderer进程，提示更新信息
function sendUpdateMessage(text, mainWindow: BrowserWindow) {
  mainWindow.webContents.send('message', text)
}