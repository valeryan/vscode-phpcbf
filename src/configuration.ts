"use strict";

import * as path from "path";
import { PhpcbfSettings } from "./settings";
import { PhpcbfPathResolver } from "./resolvers/path-resolver";
import { workspace, window, WorkspaceFolder, WorkspaceConfiguration } from "vscode";

export class PhpcbfConfiguration {
    /**
     * Load from configuration
     */
    public async load() {
        const editor = window.activeTextEditor;

        let config: WorkspaceConfiguration;
        let folder: WorkspaceFolder | undefined;
        let timeout: number | undefined;

        if (!editor || !workspace.workspaceFolders) {
            config = workspace.getConfiguration('phpcbf');
        } else {
            const resource = editor.document.uri;
            config = workspace.getConfiguration('phpcbf', resource);
            folder = workspace.getWorkspaceFolder(resource);
            timeout = workspace.getConfiguration('editor', resource).get('formatOnSaveTimeout');
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
            timeout: timeout ? timeout : 750
        };

        settings = await this.resolveExecutablePath(settings);

        return settings;
    }
    /**
     * Get correct executable path from resolver
     * @param settings
     */
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
