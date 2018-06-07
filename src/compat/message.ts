import { window as vsWindow } from 'vscode';
import { DISPLAY_NAME } from '../constants';
import { BError } from './BError';

export type MessageKind = (
    | 'error'
    | 'info'
    | 'warning'
);

export const showInfo = (text: string, modal: boolean = false) => show(text, 'info', modal);
export const showError = (text: string, modal: boolean = false) => show(text, 'error', modal);
export const showWarning = (text: string, modal: boolean = false) => show(text, 'warning', modal);

export function show(text: string, kind: MessageKind): void;
export function show(text: string, kind: MessageKind, modal: boolean): void;
export function show(text: string, kind: MessageKind, modal: boolean = false): void {
    switch (kind) {
        case 'error':
            vsWindow.showErrorMessage(`${DISPLAY_NAME}: ${text}`, { modal: modal });
            break;
        case 'info':
            vsWindow.showInformationMessage(`${DISPLAY_NAME}: ${text}`, { modal: modal });
            break;
        case 'warning':
            vsWindow.showWarningMessage(`${DISPLAY_NAME}: ${text}`, { modal: modal });
            break;
        default:
            console.error(new TypeError('Unexpected MessageKind!'));
            break;
    }
}

export const DisplayableErrorOpts: unique symbol = Symbol('DisplayableErrorOpts');
export type DisplayableErrorOpts = typeof DisplayableErrorOpts;

export interface DisplayableErrorOptions {
    kind: MessageKind;
    modal: boolean;
}

export abstract class DisplayableError<M extends {}> extends BError<M> {
    protected [DisplayableErrorOpts]: DisplayableErrorOptions;
}

export const isDisplayableError = (error: any): error is DisplayableError<any> => (
    error && !!error[DisplayableErrorOpts]
);

export const displayError = (error: Error) => (
    ((isDisplayableError(error))
        ? show(error.message, error[DisplayableErrorOpts].kind, error[DisplayableErrorOpts].modal)
        : show(error.toString(), 'error', false) // assume this generic error should just be displayed with the highest priority
    )
);