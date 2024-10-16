/**
 * @description Handle backsite from UI to comunicate with main process
 * @event startEvent : send to main process when the app is started
 * @event stopEvent : send to main process when the app is stopped
 *
 * DOCS:
 * sendEvent(eventName, data) : send data to main process
 * receiveEvent(eventName, callback) : receive data from main process
 * handleClass(el, isAdd, className) : handle classList
 * resolveFiles(path) : resolve path to root directory
 * updateUI(event) : handle the UI when the event is triggered
 * proggress(prog) : update the progress bar
 * dispatchCustomEvent(eventName) : dispatch custom event
 * mainComunicate(eventName, data) : main communication
 * handleElement(el, condition, className) : handle the element
 */

const START_EVENT = 'startEvent',
    STOP_EVENT = 'stopEvent',
    logEvent = 'log',
    updateProggressEvent = 'update-proggress';

const { sendEvent, receiveEvent, removeAllEvent, receiveOnceEvent, removeListener } = require('./utils/electron');
const { resolveFiles } = require('./utils/tools');

const version = document.getElementById('version');
const startBtn = document.getElementById('start');
const stopBtn = document.getElementById('stop');
const logArea = document.getElementById('log');
const progs = document.getElementById('progs');
const progsDown = document.getElementById('download-progress');
const warp = document.getElementById('warp');
const message = document.getElementById('message');
const restartButton = document.getElementById('restart-button');
const loaderDownload = document.getElementById('warp-loader');
const fileData = document.getElementById('data');
const composeEmail = document.getElementById('file_peserta');
const pathCertificate = document.getElementById('certificate');
const headingEmail = document.getElementById('heading_email');
const bodyText = document.getElementById('body_email');

function dispatchCustomEvent(eventName) {
    document.dispatchEvent(new CustomEvent(eventName));
}

function mainComunicate(eventName, data = {}) {
    sendEvent(eventName, data);
}

receiveEvent(START_EVENT, () => {
    updateUI(START_EVENT);
});

receiveEvent(STOP_EVENT, () => {
    updateUI(STOP_EVENT);
});

const allELement = [fileData, composeEmail, pathCertificate, headingEmail, bodyText];

function updateUI(event) {
    if (event === START_EVENT) {
        handleElement(startBtn, true);
        handleElement(stopBtn, false);
        allELement.forEach(el => el.disabled = true);
    } else if (event === STOP_EVENT) {
        handleElement(startBtn, false);
        handleElement(stopBtn, true);
        allELement.forEach(el => el.disabled = false);
    }
}

function handleElement(el, condition, className = 'hidden') {
    el.disabled = condition;
    el.classList.toggle(className, condition);
}

receiveEvent(logEvent, (event, logs) => {
    logArea.value = logs;
    logArea.scrollTop = logArea.scrollHeight;
});

receiveEvent(updateProggressEvent, (event, prog) => {
    progs.style.width = `${prog}%`;
    progs.innerHTML = `${prog}%`;
});

document.addEventListener('change', () => {
    if (fileData.files.length > 0 && composeEmail.files.length > 0) {
        handleElement(startBtn, false);
    } else {
        handleElement(startBtn, true);
    }
})

window.addEventListener('load', () => {
    document.addEventListener(START_EVENT, () => {
        mainComunicate(START_EVENT, {
            _data: resolveFiles(fileData),
            composeEmail: resolveFiles(composeEmail),
            pathCertificate: pathCertificate.value,
            subject: headingEmail.value,
            body: (bodyText.value).replace(/\n/g, '<br>')
        })
    });

    startBtn.addEventListener('click', () => dispatchCustomEvent(START_EVENT));
    document.addEventListener(STOP_EVENT, () => mainComunicate(STOP_EVENT));

    stopBtn.addEventListener('click', () => {
        const confirmUser = confirm('Are you realy want to stop this proccess ?');
        if (confirmUser) {
            dispatchCustomEvent(STOP_EVENT);
        }
    });
});

sendEvent('app_version');
receiveEvent('app_version', (event, arg) => {
    version.innerText = 'v' + arg.version;
});

receiveEvent('update_available', () => {
    removeAllEvent('update_available');
    message.innerText = 'A new update is available. Downloading now...';
    warp.classList.remove('hidden');
    loaderDownload.classList.remove('hidden');
    document.getElementById('spinner').classList.add('d-none');
});

receiveEvent('update_progress', (event, progress) => {
    message.innerText = `Downloaded as ${progress.transferred} MB of ${progress.total} MB at ${progress.speed} KB/s`;
    progsDown.style.width = progress.percent + '%';
    progsDown.setAttribute('aria-valuenow', progress.percent);
});

receiveEvent('update_downloaded', () => {
    removeAllEvent('update_downloaded');
    message.innerText = 'Update Downloaded. It will be installed on restart. Restart now?';
    restartButton.classList.remove('hidden');
    warp.classList.remove('hidden');

    loaderDownload.classList.add('hidden');
});

restartButton.addEventListener('click', e => {
    sendEvent('restart_app');
});

receiveEvent('update_error', error => {
    removeAllEvent('update_error');
    message.innerText = 'Error in downloading the update. Please try again later.';
    warp.classList.remove('hidden');
    loaderDownload.classList.add('hidden');
});
