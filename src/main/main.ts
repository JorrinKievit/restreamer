import path from "path";
import { app, BrowserWindow, nativeImage, shell } from "electron";
import { autoUpdater } from "electron-updater";
import log from "electron-log";
import electronDl from "electron-dl";
import { createIPCHandler } from "electron-trpc/main";
import installer, { REACT_DEVELOPER_TOOLS } from "electron-devtools-installer";
import { resolveHtmlPath } from "./util";
import { router } from "./api";
import { fork } from "child_process";

log.scope("main");
log.initialize();
log.transports.file.level = "info";
log.transports.file.resolvePathFn = () =>
  path.join(process.resourcesPath, "assets", "log.log");

electronDl({
  saveAs: true,
  openFolderWhenDone: true,
});

let mainWindow: BrowserWindow | null = null;

class AppUpdater {
  constructor() {
    autoUpdater.logger = log;
    autoUpdater.fullChangelog = true;
    autoUpdater.autoInstallOnAppQuit = false;
    autoUpdater.autoDownload = false;
    autoUpdater.checkForUpdates();

    autoUpdater.on("checking-for-update", () => {
      log.info("checking-for-update");
    });

    autoUpdater.on("error", (err) => {
      log.error("error", err);
    });

    autoUpdater.on("update-available", () => {
      autoUpdater.downloadUpdate();
    });

    autoUpdater.on("update-downloaded", (info) => {
      mainWindow!.webContents.send("app-update-available", info);
    });
  }
}

async function getSourceMapSupport() {
  const mod = await import("source-map-support");
  return mod.default;
}

if (process.env.NODE_ENV === "production") {
  getSourceMapSupport().then((sourceMap) => {
    sourceMap.install();
  });
}

const isDebug =
  process.env.NODE_ENV === "development" || process.env.DEBUG_PROD === "true";

if (isDebug) {
  import("electron-debug").then((mod) => mod.default());
}

const installExtensions = async () => {
  try {
    const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
    const extensions = [REACT_DEVELOPER_TOOLS];

    await installer(extensions, forceDownload);
  } catch (error) {
    log.error(error);
  }
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, "assets")
    : path.join(__dirname, "../../assets");

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    minWidth: 1360,
    minHeight: 900,
    width: 1500,
    height: 900,
    icon: nativeImage
      .createFromPath(getAssetPath("icon.png"))
      .resize({ width: 24, height: 24 }),
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true,
      preload: app.isPackaged
        ? path.join(__dirname, "preload.js")
        : path.join(__dirname, "../../.erb/dll/preload.js"),
    },
  });
  mainWindow.webContents.setUserAgent(app.userAgentFallback);
  mainWindow.removeMenu();

  mainWindow.loadURL(resolveHtmlPath("index.html"));

  createIPCHandler({ router, windows: [mainWindow] });

  mainWindow.on("ready-to-show", () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: "deny" };
  });
};

/**
 * Add event listeners...
 */

app.on("window-all-closed", () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    // eslint-disable-next-line no-new
    new AppUpdater();
    createWindow();
    app.on("activate", () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
