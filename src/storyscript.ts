import * as cp from 'child_process';
import * as path from 'path';
import * as net from 'net';
import {
    AutoLanguageClient,
    ConnectionType,
    LanguageServerProcess
} from 'atom-languageclient';

class StoryscriptLanguageClient extends AutoLanguageClient {
  getGrammarScopes(): string[] { return [ 'source.story' ] }
  getLanguageName(): string { return 'Storyscript' }
  getServerName(): string { return 'SLS' }

  public activate(): void {
    super.activate();
    console.log("activated");
  }

  startServerProcess(): LanguageServerProcess | Promise<LanguageServerProcess> {
    const connectionType = this.getConnectionType();
    if (connectionType == 'stdio') {
      return this.spawnServer(['--stdio']);
    } else {
      return this.spawnServerSocket();
    }
  }

  spawnServer(args) : LanguageServerProcess {
    const slsBin = 'sls';
    const serverHome = path.join(__dirname, '..');
    this.logger.debug(`starting "${slsBin} ${args.join(' ')}"`)
    const childProcess = cp.spawn(slsBin, args, { cwd: serverHome })
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

  spawnServerSocket(): Promise<LanguageServerProcess> {
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

  getConnectionType() : ConnectionType {
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

console.log("fo2");
const client = new StoryscriptLanguageClient();
export = client;
