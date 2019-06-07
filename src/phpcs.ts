"use strict";

import { Disposable, workspace, DiagnosticCollection, languages, Uri, CancellationTokenSource, ConfigurationChangeEvent, TextDocumentChangeEvent, TextDocument, Diagnostic, Range, DiagnosticSeverity, window } from "vscode";
import { debounce } from "lodash";
import { Settings } from "./settings";
import { Configuration } from "./configuration";
import { StandardsPathResolver } from "./resolvers/standards-path-resolver";
import { PHPCSReport, PHPCSMessageType } from "./phpcs-report";
import { ChildProcess, spawn, exec } from "child_process";

const enum runConfig {
    save = 'onSave',
    type = 'onType',
}

/**
 * Kills PHP CLIs.
 *
 * @param command
 *   The process to kill.
 */
function phpCliKill(command: ChildProcess) {
    // exec("for pid in $(ps -ef | awk '/phpcs/ {print $2}'); do kill -9 $pid; done");
    exec(`ps -ef | awk '/phpcs/ {print $2" "$8" "$4" "$7}'`,
    (err, stdout) => {
        let processes = stdout.split("\n");
        processes.forEach(($process) => {
            const killable = $process.split(" ");
            if (killable[1] === "php" && parseInt(killable[2]) > 90) {
                exec(`kill ${killable[0]}`);
            }
        });
    });
    command.kill();
}

export class Phpcs {
    public config!: Settings;

    private diagnosticCollection: DiagnosticCollection = languages.createDiagnosticCollection('php');

    /**
     * The active validator listener.
     */
    private validatorListener?: Disposable;

    /**
     * Token to cancel a current validation runs.
     */
    private runnerCancellations: Map<Uri, CancellationTokenSource> = new Map();

    constructor(subscriptions: Disposable[], config: Settings) {
        this.config = config;
        workspace.onDidChangeConfiguration(this.onConfigChange, this, subscriptions);
        workspace.onDidOpenTextDocument(this.validate, this, subscriptions);
        workspace.onDidCloseTextDocument(this.clearDocumentDiagnostics, this, subscriptions);
        workspace.onDidChangeWorkspaceFolders(this.refresh, this, subscriptions);

        this.refresh();
        this.setValidatorListener();
    }

    /**
     * Dispose this object.
     */
    public dispose(): void {
        this.diagnosticCollection.clear();
        this.diagnosticCollection.dispose();
    }

    /**
     * Reacts on configuration change.
     *
     * @param event - The configuration change event.
     */
    protected async onConfigChange(event: ConfigurationChangeEvent) {
        if (!event.affectsConfiguration('phpcbf')) {
            return;
        }

        let configuration = new Configuration();
        let config = await configuration.load();
        this.config = config;

        if (event.affectsConfiguration('phpcbf.snifferMode') || event.affectsConfiguration('phpcbf.snifferTypeDelay')) {
            this.setValidatorListener();
        }

        this.refresh();
    }

    /**
     * Sets the validation event listening.
     */
    protected setValidatorListener(): void {
        if (this.validatorListener) {
            this.validatorListener.dispose();
        }
        const run: runConfig = this.config.snifferMode as runConfig;
        const delay: number = this.config.snifferTypeDelay;

        if (run === runConfig.type as string) {
            const validator = debounce(
                ({ document }: TextDocumentChangeEvent): void => { this.validate(document); },
                delay,
            );
            this.validatorListener = workspace.onDidChangeTextDocument(validator);
        }
        else {
            this.validatorListener = workspace.onDidSaveTextDocument(this.validate, this);
        }
    }

    /**
     * Refreshes validation on any open documents.
     */
    protected refresh(): void {
        this.diagnosticCollection!.clear();

        workspace.textDocuments.forEach(this.validate, this);
    }

    /**
     * Clears diagnostics from a document.
     *
     * @param document - The document to clear diagnostics of.
     */
    protected clearDocumentDiagnostics({ uri }: TextDocument): void {
        this.diagnosticCollection.delete(uri);
    }

    /**
     * Build the arguments needed to execute phpcbf
     * @param fileName
     * @param standard
     */
    private getArgs(document: TextDocument, standard: string) {
        // Process linting paths.
        let filePath = document.fileName;

        let args = [];
        args.push('--report=json');
        args.push("-q");
        if (standard !== '') {
            args.push("--standard=" + standard);
        }
        args.push(`--stdin-path=${filePath}`);
        args.push("-");
        return args;
    }

    /**
   * Lints a document.
   *
   * @param document - The document to lint.
   */
    protected async validate(document: TextDocument) {
        if (document.languageId !== 'php') {
            return;
        }

        if (this.config.debug) {
            console.time("phpcs");
        }

        const oldRunner = this.runnerCancellations.get(document.uri);
        if (oldRunner) {
            oldRunner.cancel();
            oldRunner.dispose();
        }

        const runner = new CancellationTokenSource();
        this.runnerCancellations.set(document.uri, runner);
        const { token } = runner;

        const standard = await new StandardsPathResolver(document, this.config).resolve();
        const lintArgs = this.getArgs(document, standard);

        let fileText = document.getText();

        const options = {
            cwd: this.config.workspaceRoot !== null ? this.config.workspaceRoot : undefined,
            env: process.env,
            encoding: "utf8",
            timeout: this.config.timeout,
            tty: true
        };

        if (this.config.debug) {
            console.log("----- PHPCS -----");
            console.log("PHPCS args: " + this.config.executablePathCBF + " " + lintArgs.join(" "));
        }

        const phpcs = spawn(this.config.executablePathCS, lintArgs, options);

        phpcs.stdin.write(fileText);
        phpcs.stdin.end();

        let stdout = '';
        let stderr = '';

        phpcs.stdout.on('data', data => stdout += data);
        phpcs.stderr.on('data', data => stderr += data);

        token.onCancellationRequested(() => !phpcs.killed && phpCliKill(phpcs));

        const done = new Promise((resolve, reject) => {
            phpcs.on('close', () => {
                if (token.isCancellationRequested || !stdout) {
                    resolve();
                    return;
                }
                const diagnostics: Diagnostic[] = [];
                try {
                    const { files }: PHPCSReport = JSON.parse(stdout);
                    for (const file in files) {
                        files[file].messages.forEach(({ message, line, column, type, source }) => {
                            const zeroLine = line - 1;
                            const ZeroColumn = column - 1;

                            const range = new Range(zeroLine, ZeroColumn, zeroLine, ZeroColumn);
                            const severity = type === PHPCSMessageType.ERROR ? DiagnosticSeverity.Error : DiagnosticSeverity.Warning;
                            let output = message;
                            if (this.config.snifferShowSources) {
                                output += `\n(${source})`;
                            }
                            const diagnostic = new Diagnostic(range, output, severity);
                            diagnostic.source = 'phpcs';
                            diagnostics.push(
                                diagnostic
                            );
                        });
                    }
                    resolve();
                } catch (error) {
                    let message = '';
                    if (stdout) {
                        message += `${stdout}\n`;
                    }
                    if (stderr) {
                        message += `${stderr}\n`;
                    }
                    message += error.toString();

                    console.error(`PHPCS: ${message}`);
                    reject(message);
                }
                this.diagnosticCollection.set(document.uri, diagnostics);
                runner.dispose();
                this.runnerCancellations.delete(document.uri);
            });

        });
        setTimeout(() => !phpcs.killed && phpCliKill(phpcs), 3000);

        window.setStatusBarMessage('PHP Sniffer: validating…', done);

        if (this.config.debug) {
            console.log(phpcs);
            console.timeEnd("phpcs");
            console.log("----- END PHPCS -----");
        }
    }
}
