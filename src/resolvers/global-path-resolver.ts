/* --------------------------------------------------------------------------------------------
 * Copyright (c) Ioannis Kappas. All rights reserved.
 * Licensed under the MIT License. See License.md in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
"use strict";

import * as path from 'path';
import * as fs from 'fs';

import { PhpcbfPathResolverBase } from './path-resolver-base';

export class GlobalPhpcbfPathResolver extends PhpcbfPathResolverBase {
	async resolve(): Promise<string> {
		let resolvedPath: string | null = null;
		let pathSeparator = /^win/.test(process.platform) ? ";" : ":";
		const envPath = process.env.PATH === undefined ? '' : process.env.PATH;
		let globalPaths: string[] = envPath.split(pathSeparator);
		globalPaths.some((globalPath: string) => {
			let testPath = path.join(globalPath, this.phpcbfExecutableFile);
			if (fs.existsSync(testPath)) {
				resolvedPath = testPath;
				return true;
			}
			return false;
		});

		return resolvedPath === null ? '' : resolvedPath;
	}
}
