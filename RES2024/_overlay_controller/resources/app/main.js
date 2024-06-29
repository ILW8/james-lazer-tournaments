// include the Node.js 'path' module at the top of your file
const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");
// const fs = require("fs");
const isDev = require("electron-is-dev");

// require("electron-reload")(__dirname, {
//     // Note that the path to electron may vary according to the main file
//     electron: require(`${__dirname}/node_modules/electron`),
// });

// console.log(app.getPath("userData"));
// if (!fs.existsSync(`${app.getPath("userData")}/config.json`))
//     fs.writeFileSync(
//         `${app.getPath("userData")}/config.json`,
//         JSON.stringify({
//             location: "",
//         })
//     );

require("./server.js");

const createWindow = () => {
    const win = new BrowserWindow({
        width: 1280,
        height: 960,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
        icon: path.join(__dirname, "/src/assets/a.ico"),
    });

    win.removeMenu();
    // win.loadURL(isDev ? `http://localhost:5173/#/controller` : `file://${path.join(__dirname, "./dist/index.html")}`);
    win.loadURL(isDev ? `http://localhost:5173/#/controller` : `http://127.0.0.1:24050/ResCupOverlay/#/controller`);

    // Open the DevTools.
    if (isDev) {
        win.webContents.openDevTools({ mode: "detach" });
    }

    // win.webContents.openDevTools({ mode: "detach" });

    ipcMain.on("openDevTools", (event, arg) => {
        win.webContents.openDevTools({ mode: "detach" });
    });
};

app.whenReady().then(() => {
    createWindow();

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});

// Event handler for asynchronous incoming messages
ipcMain.on("openFolder", (event, arg) => {
    shell.openPath(app.getPath("userData"));
});
