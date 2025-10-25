'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onNewTab: (handler) => ipcRenderer.on('new-tab', handler),
  onCloseTab: (handler) => ipcRenderer.on('close-tab', handler),
  onNavBack: (handler) => ipcRenderer.on('nav-back', handler),
  onNavForward: (handler) => ipcRenderer.on('nav-forward', handler),
  onNavReload: (handler) => ipcRenderer.on('nav-reload', handler),
  onFocusAddress: (handler) => ipcRenderer.on('focus-address', handler)
});
