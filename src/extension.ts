'use strict';

import { Phpcbf } from './phpcbf';
import { commands, ExtensionContext, languages } from 'vscode';
import { Phpcs } from './phpcs';
import { Configuration } from './configuration';

/**
 * Activate Extension
 * @param context
 */
export async function activate(context: ExtensionContext) {
    let configuration = new Configuration();
    let config = await configuration.load();

    if (config.enable === false) {
        // just exit
        return;
    }

    let phpcbf = new Phpcbf(context.subscriptions, config);

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

    // register a document validator
    if (config.snifferEnable === true) {
        context.subscriptions.push(new Phpcs(context.subscriptions, config));
    }

}
