'use strict';

import { commands, ExtensionContext, workspace, languages } from 'vscode';
import { Phpcbf } from './phpcbf';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: ExtensionContext) {
    let phpcbf = new Phpcbf();

    let config = await phpcbf.loadSettings();

    if (config.enable === false) {
        // just exit
        return;
    }

    context.subscriptions.push(
        workspace.onDidChangeConfiguration(() => {
            phpcbf.loadSettings();
        })
    );

    // register format from command pallet
    context.subscriptions.push(
        commands.registerTextEditorCommand("phpcbf.fix", textEditor => {
            if (textEditor.document.languageId === "php") {
                commands.executeCommand("editor.action.formatDocument");
            }
        })
    );

    // register as document formatter for php
    context.subscriptions.push(
        languages.registerDocumentFormattingEditProvider({ scheme: 'file', language: 'php' }, {
            provideDocumentFormattingEdits: (document) => {
                return new Promise((resolve, reject) => {
                    phpcbf.format(document);
                });
            }
        })
    );
}

// this method is called when your extension is deactivated
export function deactivate() {
}
