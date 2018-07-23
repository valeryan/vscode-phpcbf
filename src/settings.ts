"use strict";

export interface PhpcbfSettings {
    enable: boolean;
    workspaceRoot: string;
    executablePath: string;
    composerJsonPath: string;
    standard: string | null;
    autoSearch: boolean;
    allowedAutoRulesets: string[];
    debug: boolean;
    timeout: number;
}
