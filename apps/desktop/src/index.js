// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

const { app, dialog, BrowserWindow } = require('electron');
const path = require('node:path');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    icon: 'images/icon.png',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.setMenu(null)

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.webContents.on('will-prevent-unload', (event) => {
    const options = {
        type: 'question',
        buttons: ['Avbryt', 'Avsluta utan att spara'],
        message: 'Osparade ändringar',
        detail: 'Du har osparade ändringar. Vill du spara dina ändringar innan du avslutar?',
    };
    const response = dialog.showMessageBoxSync(null, options)
    if (response === 1) event.preventDefault();
});
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
