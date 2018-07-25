"use strict";

import * as fs from 'fs';

import { PhpcbfPathResolverBase } from './path-resolver-base';
import { TextDocument } from 'vscode';
import { PhpcbfSettings } from '../settings';

export class StandardsPathResolver extends PhpcbfPathResolverBase {

    constructor(private document: TextDocument, private config: PhpcbfSettings) {
        super();

    }
    async resolve(): Promise<string> {
        if (this.config.autoSearch === false) {
            if (this.config.standard !== null && fs.existsSync(this.config.standard)) {
                return this.config.standard;
            }
            return '';
        }

        let resolvedPath: string | null = null;
        let workspaceRoot = this.config.workspaceRoot + '/';
        let localPath = this.document.uri.fsPath.replace(workspaceRoot, '');
        let paths = localPath.split('/')
            .filter(path => path.includes('.php') !== true);

        let searchPaths = [];

        // create search paths based on file location
        for (let i = 0, len = paths.length; i < len; i++) {
            searchPaths.push(workspaceRoot + paths.join('/') + '/');
            paths.pop();
        }
        searchPaths.push(workspaceRoot);

        // check each search path for an allowed ruleset
        let allowed = this.config.allowedAutoRulesets;

        let files: string[] = [];

        searchPaths.map(path => {
            allowed.forEach(file => {
                files.push(path + file);
            });
        });

        for (let i = 0, len = files.length; i < len; i++) {
            let c = files[i];
            if (fs.existsSync(c)) {
                return resolvedPath = c;
            }
        }

        return resolvedPath === null ? '' : resolvedPath;
    }
}
