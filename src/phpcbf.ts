"use strict";

import { window, TextDocument, Range, Position } from "vscode";
import * as spawn from "cross-spawn";
import * as fs from "fs";
import * as os from "os";
import { PhpcbfConfiguration } from "./configuration";
import { PhpcbfSettings } from "./settings";
import { StandardsPathResolver } from "./resolvers/standards-path-resolver";

export class Phpcbf {
    public config!: PhpcbfSettings;

    public async loadSettings() {
        let configuration = new PhpcbfConfiguration();
        this.config = await configuration.load();

        return this.config;
    }

    public async format(document: TextDocument) {
        let originalText = document.getText();
        let lastLine = document.lineAt(document.lineCount - 1);
        let range = new Range(
            new Position(0, 0),
            lastLine.range.end
        );

        let fileName =
            os.tmpdir() +
            "/temp-" +
            Math.random()
                .toString(36)
                .replace(/[^a-z]+/g, "")
                .substr(0, 10) +
            ".php";

        fs.writeFileSync(fileName, originalText);

        let standardsPathResolver = new StandardsPathResolver(document, this.config);
        this.config.standard = await standardsPathResolver.resolve();

        const forcedKillTime = 1000 * 60 * 5; // ms * s * m: 5 minutes
        const options = {
            cwd: this.config.workspaceRoot !== null ? this.config.workspaceRoot : undefined,
            env: process.env,
            encoding: "utf8",
            timeout: forcedKillTime,
            tty: true
        };

        const lintArgs = this.getArgs(fileName, this.config.standard);
        const phpcbf = spawn.sync(this.config.executablePath, lintArgs, options);
        const stdout = phpcbf.stdout.toString().trim();
        const stderr = phpcbf.stderr.toString().trim();

        console.log(phpcbf);

    }

    getArgs(fileName: string, standard: string) {
        let args = [];
        args.push("-lq");
        args.push(fileName);
        args.push("--standard=" + standard);
        return args;
    }
}
