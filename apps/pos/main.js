const { app, BrowserWindow, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
app.name = 'RestroOS Terminal';

// Configure logging & auto-updates
autoUpdater.logger = console;
autoUpdater.autoDownload = true;

const path = require('path');
const http = require('http');
const fs = require('fs');
const { parse } = require('url');
const { fork } = require('child_process');

let mainWindow;
let serverProcess = null;

// We check if the app is packaged (running from .exe) or in development
const isDev = !app.isPackaged;
const PORT = 3002;

async function checkPortReady() {
  console.log(`Checking if port ${PORT} is ready...`);
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      const req = http.get(`http://localhost:${PORT}`, (res) => {
        if (res.statusCode === 200) {
          console.log(`Port ${PORT} is ready!`);
          clearInterval(interval);
          resolve();
        }
      });
      req.on('error', (err) => {
        console.log(`Port ${PORT} not ready yet... (${err.message})`);
      });
    }, 1000);
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,      // Hidden until maximized — avoids layout flash
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
  });

  // DevTools auto-open is removed. We do not call closeDevTools() on did-finish-load 
  // because that causes a blank white screen bug in Electron when the view fails to resize.

  // Maximize the window automatically
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.maximize();
  });

  // Load a loading screen while Next.js boots
  mainWindow.loadFile(path.join(__dirname, 'loading.html'));

  if (isDev) {
    console.log('Running in Dev mode. Waiting for Next.js...');
    // DevTools auto-open removed to prevent screen split
    mainWindow.webContents.closeDevTools();
    await checkPortReady();
    mainWindow.loadURL(`http://localhost:${PORT}`);
  } else {
    console.log('Running in Production mode. Spawning Next.js server in child process...');
    
    // Add a safety timeout for the boot process
    const bootTimeout = setTimeout(() => {
      console.log('Boot taking too long, attempting forced load...');
      mainWindow.loadURL(`http://localhost:${PORT}`);
    }, 20000);

    try {
      const runnerPath = path.join(__dirname, 'server-runner.js');
      console.log('Spawning runner:', runnerPath);
      
      const userDataPath = app.getPath('userData');
      const dbPath = path.join(userDataPath, 'pos.db');
      
      // Initialize database if it doesn't exist
      if (!fs.existsSync(dbPath)) {
        console.log('Database not found in user data, copying pre-seeded database...');
        try {
          // In packaged app, prisma is usually unpacked
          const sourceDb = path.join(process.resourcesPath, 'app.asar.unpacked', 'prisma', 'pos.db');
          if (fs.existsSync(sourceDb)) {
            fs.copyFileSync(sourceDb, dbPath);
          } else {
            // Fallback for development or if not unpacked
            const devDb = path.join(__dirname, 'prisma', 'pos.db');
            if (fs.existsSync(devDb)) {
              fs.copyFileSync(devDb, dbPath);
            } else {
              console.warn('WARNING: Could not find source pos.db to copy!');
            }
          }
        } catch (err) {
          console.error('Failed to copy database:', err);
        }
      }
      
      console.log('Using Production Database Path:', dbPath);

      const unpackedPrismaDir = path.join(process.resourcesPath, 'app.asar.unpacked', 'prisma');
      const enginePath = path.join(unpackedPrismaDir, 'query_engine-windows.dll.node');

      serverProcess = fork(runnerPath, [], {
        env: {
          PORT: String(PORT),
          NODE_ENV: 'production',
          DATABASE_URL: `file:${dbPath.replace(/\\/g, '/')}`,
          PRISMA_QUERY_ENGINE_LIBRARY: enginePath,
          NEXT_DIR: __dirname,
          ...process.env
        },
        stdio: 'inherit'
      });

      serverProcess.on('error', (err) => {
        console.error('Child process startup error:', err);
      });

      serverProcess.on('exit', (code) => {
        console.log(`Next.js server child process exited with code: ${code}`);
      });

      await checkPortReady();
      clearTimeout(bootTimeout);
      mainWindow.loadURL(`http://localhost:${PORT}`);
    } catch (err) {
      clearTimeout(bootTimeout);
      console.error('Failed to start Next.js server inside Electron:', err);
      mainWindow.webContents.executeJavaScript(`
        document.querySelector('p').style.color = '#f43f5e';
        document.querySelector('p').innerText = 'CRITICAL ERROR: ' + ${JSON.stringify(err.message)};
      `);
    }
  }

  // Allow manual reload for debugging
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F5') {
      console.log('Manual reload triggered');
      mainWindow.loadURL(`http://localhost:${PORT}`);
    }
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    if (errorCode === -3) return; // Ignore ERR_ABORTED when switching from loading.html to local URL
    console.error(`Failed to load URL: ${errorDescription} (${errorCode})`);
    mainWindow.webContents.executeJavaScript(`
      document.querySelector('p').style.color = '#f43f5e';
      document.querySelector('p').innerText = 'LOAD ERROR: ' + ${JSON.stringify(errorDescription)};
    `);
  });

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  try {
    autoUpdater.checkForUpdatesAndNotify();
  } catch (err) {
    console.error('Failed to initiate update check:', err);
  }
  createWindow();
});

app.on('window-all-closed', function () {
  if (serverProcess) {
    console.log('Terminating Next.js server child process...');
    serverProcess.kill('SIGINT');
  }
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  if (mainWindow === null) createWindow();
});

// Register IPC handlers once at the app level (NOT inside createWindow)
// to prevent duplicate listeners if the window is ever re-created.
ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.close();
});
