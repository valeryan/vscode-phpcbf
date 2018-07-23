'use strict';

import { Phpcbf } from './phpcbf';
import { commands, ExtensionContext, workspace, languages } from 'vscode';

/**
 * Activate Extension
 * @param context 
 */
export async function activate(context: ExtensionContext) {
    let phpcbf = new Phpcbf();

    let config = await phpcbf.loadSettings();

    if (config.enable === false) {
        // just exit
        return;
    }

    context.subscriptions.push(
        workspace.onDidChangeConfiguration(async () => {
            await phpcbf.loadSettings();
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
                return phpcbf.registerDocumentProvider(document);
            }
        })
    );
}
