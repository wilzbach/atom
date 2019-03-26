const cp = require('child_process');
const path = require('path');
const {AutoLanguageClient} = require('atom-languageclient')

class StoryscriptLanguageClient extends AutoLanguageClient {
  getGrammarScopes () { return [ 'source.story' ] }
  getLanguageName () { return 'Storyscript' }
  getServerName () { return 'SLS' }

  startServerProcess () {
    const connectionType = this.getConnectionType();
    if (connectionType == 'stdio') {
      return this.spawnServer(['--stdio']);
    } else {
      return this.spawnServerSocket();
    }
  }

  spawnServer(args) {
    const slsBin = 'sls';
    const serverHome = path.join(__dirname, '..');
    this.logger.debug(`starting "${slsBin} ${args.join(' ')}"`)
    const childProcess = cp.spawn(slsBin, args, { cwd: serverHome })
    this.captureServerErrors(childProcess)
    childProcess.on('exit', exitCode => {
      if (exitCode != 0 && exitCode != null) {
        atom.notifications.addError('IDE-Storyscript language server stopped unexpectedly.', {
          dismissable: true,
          description: this.processStdErr != null ? `<code>${this.processStdErr}</code>` : `Exit code ${exitCode}`
        })
      }
    });
    return childProcess;
  }

  spawnServerWithSocket () {
    return new Promise((resolve, reject) => {
      let childProcess
      const server = net.createServer(socket => {
        this.socket = socket
        server.close()
        resolve(childProcess)
      })
      server.listen(0, '127.0.0.1', () => {
        childProcess = this.spawnServer([`--port=${server.address().port}`])
      })
    })
  }

  getConnectionType() {
    const connectionType = atom.config.get('ide-storyscript.connectionType');
    switch (connectionType) {
      case 'auto':    return process.platform === 'win32' ? 'socket' : 'stdio';
      case 'socket':  return 'socket';
      case 'stdio':   return 'stdio';
      default:
        atom.notifications.addWarning('Invalid connection type setting', {
          dismissable: true,
          buttons: [ { text: 'Set Connection Type', onDidClick: () => this.openPackageSettings() } ],
          description: 'The connection type setting should be set to "auto", "socket" or "stdio". "auto" is "socket" on Windows and "stdio" on other platforms.'
        })
    }
  }

  openPackageSettings() {
    atom.workspace.open('atom://config/packages/ide-storyscript');
  }

}

module.exports = new StoryscriptLanguageClient();
