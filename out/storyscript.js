"use strict";
const cp = require("child_process");
const path = require("path");
const net = require("net");
const atom_languageclient_1 = require("atom-languageclient");
const bootstrap_1 = require("./bootstrap");
class StoryscriptLanguageClient extends atom_languageclient_1.AutoLanguageClient {
    getGrammarScopes() { return ['source.story']; }
    getLanguageName() { return 'Storyscript'; }
    getServerName() { return 'SLS'; }
    constructor() {
        super();
        this.serverHome = path.join(__dirname, '..');
    }
    startServerProcess() {
        return bootstrap_1.bootstrap(this.serverHome).then((slsBinary) => {
            this.slsBinary = slsBinary;
            const connectionType = this.getConnectionType();
            if (connectionType == 'stdio') {
                return this.spawnServer(['stdio']);
            }
            else {
                return this.spawnServerSocket();
            }
        });
    }
    spawnServer(args) {
        console.log(`[sls] starting "${this.slsBinary}" [${args.join(' ')}]`);
        const childProcess = cp.spawn(this.slsBinary, args, { cwd: this.serverHome });
        childProcess.on('exit', exitCode => {
            if (exitCode != 0 && exitCode != null) {
                atom.notifications.addError('IDE-Storyscript language server stopped unexpectedly.', {
                    dismissable: true,
                    description: this.processStdErr != null ? `<code>${this.processStdErr}</code>` : `Exit code ${exitCode}`
                });
            }
        });
        return childProcess;
    }
    spawnServerSocket() {
        return new Promise((resolve, reject) => {
            let childProcess;
            const server = net.createServer(socket => {
                this.socket = socket;
                server.close();
                resolve(childProcess);
            });
            server.listen(0, '127.0.0.1', () => {
                childProcess = this.spawnServer(['tcp', `--port=${server.address().port}`]);
            });
        });
    }
    getConnectionType() {
        const connectionType = atom.config.get('ide-storyscript.connectionType');
        switch (connectionType) {
            case 'auto': return process.platform === 'win32' ? 'socket' : 'stdio';
            case 'socket': return 'socket';
            case 'stdio': return 'stdio';
            default:
                atom.notifications.addWarning('Invalid connection type setting', {
                    dismissable: true,
                    buttons: [{ text: 'Set Connection Type', onDidClick: () => this.openPackageSettings() }],
                    description: 'The connection type setting should be set to "auto", "socket" or "stdio". "auto" is "socket" on Windows and "stdio" on other platforms.'
                });
        }
    }
    openPackageSettings() {
        atom.workspace.open('atom://config/packages/ide-storyscript');
    }
}
const client = new StoryscriptLanguageClient();
module.exports = client;
//# sourceMappingURL=storyscript.js.map