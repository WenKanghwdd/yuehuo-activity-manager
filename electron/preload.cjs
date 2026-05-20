const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,

  // 激活系统
  activation: {
    getMachineCode: () => ipcRenderer.invoke('activation:getMachineCode'),
    check: () => ipcRenderer.invoke('activation:check'),
    activate: (code) => ipcRenderer.invoke('activation:activate', code),
  },

  // 数据持久化
  data: {
    save: (jsonData) => ipcRenderer.invoke('data:save', jsonData),
    load: () => ipcRenderer.invoke('data:load'),
    info: () => ipcRenderer.invoke('data:info'),
    clear: () => ipcRenderer.invoke('data:clear'),
  },

  // 应用信息
  app: {
    info: () => ipcRenderer.invoke('app:info'),
  },
});
