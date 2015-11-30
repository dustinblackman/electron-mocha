require('./console')
var mocha = require('../mocha')
var ipc
try {
  ipc = require('electron').ipcMain
} catch(e) {
  ipc = require('ipc')
}

// Expose mocha
window.mocha = require('mocha')

window.onerror = function (message, filename, lineno, colno, err) {
  ipc.send('mocha-error', {
    message: message,
    filename: filename,
    err: err,
    stack: err.stack
  })
}

// console.log(JSON.stringify(window.__args__, null, 2))
mocha.run(window.__args__, function (failureCount) {
  ipc.send('mocha-done', failureCount)
})
