const { ipcRenderer } = require('electron');

/**
 * @description Declare global function of electron to send and receive event
 * @param {String} eventName : name of the event
 * @param {String} data : data to send
 * @returns {void}
 */

const sendEvent = (eventName, data = '') => ipcRenderer.send(eventName, data);
const receiveEvent = (eventName, callback) => ipcRenderer.on(eventName, callback);
const receiveOnceEvent = (eventName, callback) => ipcRenderer.once(eventName, callback);
const removeAllEvent = (eventName) => ipcRenderer.removeAllListeners(eventName);
const removeListener = (eventName, callback) => ipcRenderer.removeListener(eventName, callback);

const saveData = data => ipcRenderer.send('save-data', data);
const getData = () => ipcRenderer.send('get-data');
const removeData = () => ipcRenderer.send('remove-data');

module.exports = {
    sendEvent,
    receiveEvent,
    receiveOnceEvent,
    saveData,
    getData,
    removeData,
    removeAllEvent,
    removeListener
};
