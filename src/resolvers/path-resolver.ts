/* --------------------------------------------------------------------------------------------
 * Copyright (c) Ioannis Kappas. All rights reserved.
 * Licensed under the MIT License. See License.md in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
"use strict";

import { PhpcbfPathResolverBase } from './path-resolver-base';
import { ComposerPhpcbfPathResolver } from './composer-path-resolver';
import { GlobalPhpcbfPathResolver } from './global-path-resolver';

export interface PhpcbfPathResolverOptions {
	workspaceRoot: string | null;
	composerJsonPath: string;
}

export class PhpcbfPathResolver extends PhpcbfPathResolverBase {

	private resolvers: PhpcbfPathResolverBase[] = [];

	constructor(options: PhpcbfPathResolverOptions) {
		super();
		if (options.workspaceRoot !== null) {
			this.resolvers.push(new ComposerPhpcbfPathResolver(options.workspaceRoot, options.composerJsonPath));
		}
		this.resolvers.push(new GlobalPhpcbfPathResolver());
	}

	async resolve(): Promise<string> {
		let resolvedPath: string | null = null;
		for (var i = 0, len = this.resolvers.length; i < len; i++) {
			let resolverPath = await this.resolvers[i].resolve();
			if (resolvedPath !== resolverPath) {
				resolvedPath = resolverPath;
				break;
			}
		}

		if (resolvedPath === null) {
			throw new Error('Unable to locate phpcbf. Please add phpcbf to your global path or use composer dependency manager to install it in your project locally.');
		}

		return resolvedPath;
	}
}
