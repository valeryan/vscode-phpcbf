"use strict";

import * as path from "path";
import { PhpcbfSettings } from "./settings";
import { PhpcbfPathResolver } from "./resolvers/path-resolver";
import { workspace, window, WorkspaceConfiguration, Uri } from "vscode";

export class PhpcbfConfiguration {
    /**
     * Load from configuration
     */
    public async load() {
        const editor = window.activeTextEditor;
        let config: WorkspaceConfiguration;
        let timeout: number | undefined;
        let rootPath: string;

        if (!editor || !workspace.workspaceFolders) {
            return null;
        } else {
            const resource = editor.document.uri;
            config = workspace.getConfiguration('phpcbf', resource);
            timeout = workspace.getConfiguration('editor', resource).get('formatOnSaveTimeout');
            rootPath = this.resolveRootPath(workspace, resource);
        }
        // update settings from config
        let settings: PhpcbfSettings = {
            enable: config.get('enable', true),
            workspaceRoot: rootPath,
            executablePath: config.get('executablePath', ''),
            composerJsonPath: config.get('composerJsonPath', 'composer.json'),
            standard: config.get('standard', ''),
            autoConfigSearch: config.get('autoConfigSearch', true),
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

        if (settings.debug) {
            console.log("----- PHPCBF CONFIGURATION-----");
            console.log(settings);
            console.log("----- END PHPCBF CONFIGURATION-----");
        }

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

    /**
     * Attempt to find the root path for a workspace or resource
     * @param workspace 
     * @param resource 
     */
    private resolveRootPath(workspace: any, resource: Uri) {
        // try to get a valid folder from resource
        let folder = workspace.getWorkspaceFolder(resource);
        // try to get a folder from workspace
        if (!folder) {
            folder = workspace.workspaceFolders.shift();
        }

        // one last safety check
        return folder ? folder.uri.fsPath : '';
    }
}
