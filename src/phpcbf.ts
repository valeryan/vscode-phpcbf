"use strict";

import * as spawn from "cross-spawn";
import * as fs from "fs";
import * as os from "os";
import { PhpcbfConfiguration } from "./configuration";
import { PhpcbfSettings } from "./settings";
import { StandardsPathResolver } from "./resolvers/standards-path-resolver";
import { ConsoleError } from "./console-error";
import { window, TextDocument, Range, Position, TextEdit, ProviderResult } from "vscode";

export class Phpcbf {
    public config!: PhpcbfSettings;

    /**
     * Load Configuration from editor
     */
    public async loadSettings() {
        let configuration = new PhpcbfConfiguration();
        let config = await configuration.load();

        if (config === null) {
            throw new Error('Unable to validate configuration.');
        }

        this.config = config;

        return config;
    }

    /**
     * Build the arguments needed to execute phpcbf
     * @param fileName
     * @param standard 
     */
    private getArgs(fileName: string, standard: string) {
        let args = [];
        args.push("-lq");
        args.push(fileName);
        if (standard !== '') {
            args.push("--standard=" + standard);
        }
        return args;
    }

    /**
     * Get the relevant standard.
     * @param document 
     */
    private async resolveStandard(document: TextDocument) {
        let standardsPathResolver = new StandardsPathResolver(document, this.config);
        const configured = this.config.standard !== null ? this.config.standard : '';
        const resolved = await standardsPathResolver.resolve();
        // just return the value of config.standard if nothings was resolved.
        return resolved === '' ?  configured : resolved; 
    }

    /**
     * run the phpcbf process
     * @param document 
     */
    private async format(document: TextDocument) {
        if (this.config.debug) {
            console.time("phpcbf");
        }

        // grab original text and create a temp file
        let originalText = document.getText();

        let fileName =
            os.tmpdir() +
            "/temp-" +
            Math.random()
                .toString(36)
                .replace(/[^a-z]+/g, "")
                .substr(0, 10) +
            ".php";

        fs.writeFileSync(fileName, originalText);

        // setup and spawn phpcbf process
        const standard = await this.resolveStandard(document);

        const lintArgs = this.getArgs(fileName, standard);

        const options = {
            cwd: this.config.workspaceRoot !== null ? this.config.workspaceRoot : undefined,
            env: process.env,
            encoding: "utf8",
            timeout: this.config.timeout,
            tty: true
        };

        if (this.config.debug) {
            console.log("----- PHPCBF -----");
            console.log("PHPCBF args: " + this.config.executablePath + " " + lintArgs.join(" "));
        }

        const phpcbf = spawn.sync(this.config.executablePath, lintArgs, options);
        const stdout = phpcbf.stdout.toString().trim();
        const stderr = phpcbf.stderr.toString().trim();

        // grab the fixed file and cleanup
        let fixed = fs.readFileSync(fileName, "utf-8");
        fs.unlink(fileName, () => { });

        let errors: { [key: number]: string } = {
            3: "PHPCBF: A general script execution error occurred.",
            16: "PHPCBF: Configuration error of the application.",
            32: "PHPCBF: Configuration error of a Fixer.",
            64: "PHPCBF: Exception raised within the application.",
            255: "PHPCBF: A Fatal execution error occurred."
        };

        let error: string = '';
        let result: string = '';

        /**
        * phpcbf exit codes:
        * Exit code 0 is used to indicate that no fixable errors were found, so nothing was fixed
        * Exit code 1 is used to indicate that all fixable errors were fixed correctly
        * Exit code 2 is used to indicate that PHPCBF failed to fix some of the fixable errors it found
        * Exit code 3 is used for general script execution errors
        */
        switch (phpcbf.status) {
            case null: {
                // deal with some special case errors
                error = 'A General Execution error occurred.';
                const execError: ConsoleError = phpcbf.error;

                if (execError.code === 'ETIMEDOUT') {
                    error = 'PHPCBF: Formating the document is taking longer than the configured formatOnSaveTimeout. Consider setting to at least 2 seconds (2000).';
                }

                if (execError.code === 'ENOENT') {
                    error = 'PHPCBF: ' + execError.message + '. executablePath not found.';
                }
                break;
            }
            case 0: {
                if (this.config.debug) {
                    window.showInformationMessage(stdout);
                }
                result = '';
                break;
            }
            case 1:
            case 2: {
                if (fixed.length > 0 && fixed !== originalText) {
                    result = fixed;
                }
                break;
            }
            default:
                error = errors[phpcbf.status];
        }

        if (this.config.debug) {
            if (stderr !== '') {
                console.log(stderr);
            } else {
                console.log(stdout);
            }
            console.timeEnd("phpcbf");
            console.log("----- END PHPCBF -----");
        }

        if (error !== '') {
            return Promise.reject(error);
        }

        return result;
    }

    /**
     * Setup wrapper for format for extension
     * @param document 
     */
    public registerDocumentProvider(document: TextDocument): ProviderResult<TextEdit[]> {
        return new Promise((resolve, reject) => {
            let lastLine = document.lineAt(document.lineCount - 1);
            let range = new Range(
                new Position(0, 0),
                lastLine.range.end
            );

            this.format(document)
                .then(text => {
                    if (text.length > 0) {
                        resolve([new TextEdit(range, text)]);
                    }
                    resolve();
                })
                .catch(err => {
                    window.showErrorMessage(err);
                    reject();
                });
        });
    }
}
