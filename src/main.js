const { app, BrowserWindow, ipcMain, shell, Menu } = require('electron');
const { autoUpdater } = require('electron-updater');
const { join } = require('path');
const log = require('electron-log');
const { startProcess } = require('.');

log.transports.file.resolvePathFn = () => join(app.getPath('userData'), 'logs', 'main.log');
log.info('App starting...');

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

let mainWindow,
    isUpdate = false;

const productName = 'BEM AutoSend Certificate',
    icon = `./src/logos.png`,
    START_EVENT = 'startEvent',
    STOP_EVENT = 'stopEvent',
    logEvent = 'log',
    updateProggressEvent = 'update-proggress';

const windowSize = [800, 800];

function createMainWindow() {
    let window = new BrowserWindow({
        width: windowSize[0],
        height: windowSize[1],
        minWidth: windowSize[0],
        minHeight: windowSize[1],
        maxWidth: windowSize[0],
        maxHeight: windowSize[1],
        title: productName,
        icon: icon,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            devTools: !app.isPackaged
        }
    });

    window.loadFile(join(__dirname, 'index.html'));

    window.show();
    window.focus();

    app.isPackaged && Menu.setApplicationMenu(null);

    autoUpdater.checkForUpdatesAndNotify((error, result) => {
        if (error) {
            log.error('Error in auto-updater. ' + error);
            return;
        }

        if (result) {
            isUpdate = true;
        }
    }, 1000 * 60 * 60 * 24);

    autoUpdater.on('download-progress', progress => {
        const speed = (progress.bytesPerSecond / 1024).toFixed(2);
        const percent = progress.percent.toFixed(2);
        const transferred = (progress.transferred / 1024 / 1024).toFixed(2);
        const total = (progress.total / 1024 / 1024).toFixed(2);

        log.info(`Download speed: ${speed} KB/s`);
        log.info(`Downloaded ${transferred} MB of ${total} MB (${percent}%)`);

        const progresst = {
            speed: speed,
            percent: percent,
            transferred: transferred,
            total: total
        };

        window.webContents.send('update_progress', progresst);
    });

    autoUpdater.on('update-available', () => {
        log.info('Update available.');
        window.webContents.send('update_available');
    });

    autoUpdater.on('update-downloaded', () => {
        log.info('Update downloaded.');
        window.webContents.send('update_downloaded');
    });

    autoUpdater.on('error', error => {
        log.error('Error in auto-updater. ' + error);
        window.webContents.send('update_error', error);
    });

    window.webContents.setWindowOpenHandler(edata => {
        shell.openExternal(edata.url);
        return {
            action: 'deny'
        };
    });

    window.on('closed', () => {
        window = null;
    });

    return window;
}

function createWindow() {
    mainWindow = createMainWindow();
}

app.on('ready', createWindow);
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

ipcMain.on('app_version', event => {
    event.reply('app_version', {
        version: app.getVersion()
    });
});

ipcMain.on('restart_app', () => {
    autoUpdater.quitAndInstall();
});

ipcMain.on(START_EVENT, async (event, arg) => {
    const logger = [];

    const log = msg => {
        logger.push(msg);
        event.reply(logEvent, logger.join('\n'));
    };

    const progress = progress => {
        event.reply(updateProggressEvent, progress);
    };

    log('[INFO] Process started');
    event.reply(START_EVENT);
    await startProcess(log, progress, arg);
    event.reply(STOP_EVENT);
    log('[INFO] Process completed');
});
