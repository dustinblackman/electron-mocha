var app = require('app')
var fs = require('fs-extra')
var ipc = require('ipc')
var path = require('path')
var os = require('os')
var window = require('electron-window')
var args = require('./args')
var mocha = require('./mocha')

// these were suppose to do something, but they don't
// https://github.com/atom/electron/blob/master/docs/api/chrome-command-line-switches.md#--vlog_level
// app.commandLine.appendSwitch('v', -1)
// app.commandLine.appendSwitch('vmodule', 'console=0')

process.on('uncaughtException', function (err) {
  console.error(err)
  console.error(err.stack)
  exit(1)
})

var opts = args.parse(process.argv)

var browserDataPath = path.join(os.tmpdir(), 'electron-mocha-' + Date.now().toString())
app.setPath('userData', browserDataPath)

app.on('ready', function () {
  if (!opts.renderer) {
    mocha.run(opts, exit)
  } else {
    var win = window.createWindow({ height: 700, width: 1200, 'web-preferences': { 'web-security': false } })
    var indexPath = path.resolve(path.join(__dirname, './renderer/index.html'))
    // undocumented call in electron-window
    win._loadUrlWithArgs(indexPath, opts, Function())
    // win.showUrl(indexPath, opts)
    ipc.on('mocha-done', function (event, code) {
      exit(code)
    })
  }
})

function exit (code) {
  fs.remove(browserDataPath, function (err) {
    if (err) console.error(err)
    // process.exit() does not work properly
    // app.quit() does not set code
    // bug in Electron, see issue: https://github.com/atom/electron/issues/1983
    console.log('Electron_Exit_Code: ' + code)
    if (process.platform == 'win32' && process.env.EXITCODE_PATH) {
      fs.writeFile(process.env.EXITCODE_PATH, code, {encoding: 'utf8'}, function(err) {
        if (err) console.log(err);
        app.quit(code);
      })
    } else {
      app.quit(code)
    }
  })
}
