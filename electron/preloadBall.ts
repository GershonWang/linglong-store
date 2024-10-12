// preload.js
const { contextBridge, ipcRenderer } = require('electron');

// 通过 contextBridge 暴露给渲染进程
contextBridge.exposeInMainWorld('electron', {
  send: (channel, data) => ipcRenderer.send(channel, data),
  receive: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args))
});
