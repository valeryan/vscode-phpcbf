"use strict";

import * as path from "path";

import { workspace, window, WorkspaceFolder, WorkspaceConfiguration } from "vscode";
import { PhpcbfSettings } from "./settings";
import { PhpcbfPathResolver } from "./resolvers/path-resolver";

export class PhpcbfConfiguration {

    public async load() {
        const editor = window.activeTextEditor;

        let config: WorkspaceConfiguration;
        let folder: WorkspaceFolder | undefined;

        if (!editor || !workspace.workspaceFolders) {
            config = workspace.getConfiguration('phpcbf');
        } else {
            const resource = editor.document.uri;
            config = workspace.getConfiguration('phpcbf', resource);
            folder = workspace.getWorkspaceFolder(resource);
        }


        // update settings from config
        let settings: PhpcbfSettings = {
            enable: config.get('enable', true),
            workspaceRoot: folder ? folder.uri.fsPath : '',
            executablePath: config.get('executablePath', ''),
            composerJsonPath: config.get('composerJsonPath', 'composer.json'),
            standard: config.get('standard', ''),
            autoSearch: config.get('autoSearch', true),
            allowedAutoRulesets: config.get('allowedAutoRulesets', [
                ".phpcs.xml",
                "phpcs.xml",
                "phpcs.dist.xml",
                "ruleset.xml"
            ]),
            debug: config.get('debug', false),
        };

        settings = await this.resolveExecutablePath(settings);

        return settings;
    }

    protected async resolveExecutablePath(settings: PhpcbfSettings): Promise<PhpcbfSettings> {
        if (settings.executablePath === null) {
            let executablePathResolver = new PhpcbfPathResolver(settings);
            settings.executablePath = await executablePathResolver.resolve();
        } else if (!path.isAbsolute(settings.executablePath) && settings.workspaceRoot !== null) {
            settings.executablePath = path.join(settings.workspaceRoot, settings.executablePath);
        }
        return settings;
    }
}