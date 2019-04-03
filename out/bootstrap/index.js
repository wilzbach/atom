"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
const child_process_1 = require("child_process");
const util_1 = require("util");
const lodash_1 = require("lodash");
const sls_1 = require("./sls");
function log(msg) {
    console.log("[sls] ", msg);
}
const stat = util_1.promisify(fs.stat);
// run a command asynchronously
function execAsync(cmd, options = {}) {
    return new Promise((resolve, reject) => {
        child_process_1.exec(cmd, options, (error, stdout, stderr) => {
            if (error)
                return reject(error);
            // for now, we aren't interested in stderr
            //if (stderr) return resolve(stderr);
            resolve(stdout);
        });
    });
}
/*
* Convert a promise into a Go-style plain promise:
*
* ```
* let [err, output] = await plain(myPromise);
* ```
*/
function plain(promise) {
    return promise
        .then(d => [undefined, d])
        .catch(e => [e, undefined]);
}
// allow execution with plain-promises
function exec(cmd, options = {}) {
    return plain(execAsync(cmd, options));
}
// Makes sure that an exact version of SLS is installed
function bootstrap(extensionDirectory) {
    return __awaiter(this, void 0, void 0, function* () {
        const venvFolder = path.join(extensionDirectory, 'venv');
        const slsBin = path.join(venvFolder, 'bin', 'sls');
        const progress = new Progress();
        // check the version of the installed SLS binary
        const [err, output] = yield exec(`${slsBin} --version`);
        if (err) {
            // Version checking failed. we don't know why, but now it's a good idea
            // to run the upgrade setup
            log(`[bootstrap] ERROR: ${err}`);
            return yield upgradeSLS(venvFolder, progress);
        }
        const slsVersion = output.trim();
        if (slsVersion !== sls_1.expectedSLSVersion) {
            log(`[bootstrap] Version mismatch: ${slsVersion}, expected: ${sls_1.expectedSLSVersion}`);
            return yield upgradeSLS(venvFolder, progress);
        }
        return slsBin;
    });
}
exports.bootstrap = bootstrap;
class Progress {
    report({ message }) {
        log(message);
    }
}
// Trigger the upgrade operation with a progress window
function upgradeSLS(venvFolder, progress) {
    return __awaiter(this, void 0, void 0, function* () {
        const upgrader = new SLSUpgrade(venvFolder, progress);
        return yield upgrader.run();
    });
}
// Custom upgrade error that might be thrown during the SLS upgrade process
class SLSUpgradeError extends Error {
    constructor(message) {
        super(message);
        Object.setPrototypeOf(this, SLSUpgradeError.prototype);
        this.name = this.constructor.name;
    }
}
/**
* Create or upgrade a SLS installation.
*/
class SLSUpgrade {
    constructor(venvFolder, progress) {
        this.venvFolder = venvFolder;
        this.progress = progress;
        this.slsBin = undefined;
    }
    /**
    * Runs the entire upgrade process step by step.
    * Aborts if a single step fails.
    */
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            this.report("Starting bootstrapping");
            const steps = [
                {
                    method: 'checkPython',
                    message: 'Checking Python installation',
                    error: 'No Python3 installation found',
                },
                {
                    method: 'createVenv',
                    message: 'Creating virtualenv',
                },
                {
                    method: 'installSLS',
                    message: `Installing SLS(${sls_1.expectedSLSVersion})`,
                },
            ];
            for (let i = 0; i < steps.length; i++) {
                const step = steps[i];
                try {
                    this.report(step.message);
                    yield this[step.method]();
                }
                catch (err) {
                    let errorMessage;
                    if (err instanceof SLSUpgradeError) {
                        errorMessage = err.message;
                    }
                    else if (step.error !== undefined) {
                        errorMessage = step.error;
                    }
                    else {
                        // fallback error message
                        errorMessage = `${step.message} failed`;
                    }
                    this.info(`ERROR in ${step.method}: ${err}`);
                    //Window.showErrorMessage(errorMessage);
                    return false;
                }
            }
            this.report("Bootstrapping succeeded");
            this.info(`Success -> ${this.slsBin}`);
            return this.slsBin;
        });
    }
    // Ensures that python3.6 or higher is available
    checkPython() {
        return __awaiter(this, void 0, void 0, function* () {
            const output = yield execAsync('python3 --version');
            const pythonVersion = output.replace("Python ", "").trim();
            const isOldPython = lodash_1.some(["3.0", "3.1", "3.2", "3.3", "3.4", "3.5"], e => pythonVersion.startsWith(e));
            if (isOldPython) {
                throw new SLSUpgradeError('SLS requires Python3.6 or newer');
            }
        });
    }
    // Ensures a virtualenv directory exists. Otherwise creates a new one
    createVenv() {
        return __awaiter(this, void 0, void 0, function* () {
            this.info(`Setting up virtualenv in ${this.venvFolder}`);
            const [err, _] = yield plain(stat(this.venvFolder));
            if (!err) {
                this.info('Re-using existing virtualenv');
                return;
            }
            yield execAsync(`virtualenv --python=python3 ${this.venvFolder}`);
        });
    }
    // Installs an explicit version of SLS with pip
    installSLS() {
        return __awaiter(this, void 0, void 0, function* () {
            const pipBin = path.join(this.venvFolder, 'bin', 'pip');
            yield execAsync(`${pipBin} install -U sls==${sls_1.expectedSLSVersion}`);
            this.slsBin = path.join(this.venvFolder, 'bin', 'sls');
        });
    }
    // Reports the current progress to the progress window
    report(message) {
        this.progress.report({
            message,
        });
    }
    // Logs messages with a [bootstrap] prefix
    info(message) {
        log(`[bootstrap] ${message}`);
    }
}
//# sourceMappingURL=index.js.map