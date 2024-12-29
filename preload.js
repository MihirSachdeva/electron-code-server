// preload.js
const { contextBridge, ipcRenderer } = require('electron');


contextBridge.exposeInMainWorld('electronAPI', {
    startContainer: async (repoUrl) => {
        // window.electronAPI.startContainer(repoUrl)
        return ipcRenderer.invoke('start-container', repoUrl);
    },
    showCodeServerUI: (callback) => {
        ipcRenderer.on('open-code-server-iframe', (event, url) => callback(url));
    }
});
