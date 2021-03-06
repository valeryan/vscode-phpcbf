/* --------------------------------------------------------------------------------------------
 * Copyright (c) Ioannis Kappas. All rights reserved.
 * Licensed under the MIT License. See License.md in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
"use strict";

export abstract class PhpcbfPathResolverBase {
	protected phpcbfExecutableFile: string;
	protected pathSeparator: string;

	constructor() {
		let extension = /^win/.test(process.platform) ? ".bat" : "";
		this.pathSeparator = /^win/.test(process.platform) ? "\\" : "/";
		this.phpcbfExecutableFile = `phpcbf${extension}`;
	}

	abstract async resolve(): Promise<string>;
}
