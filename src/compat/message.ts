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

export interface DisplayedErrorOpts {
    kind: MessageKind;
    modal?: boolean;
}
export class DisplayedError<M extends {}> extends BError<M> {
    public kind: MessageKind;
    public modal: boolean = false;

    public constructor(message: string, opts: DisplayedErrorOpts);
    public constructor(message: string, opts: DisplayedErrorOpts, meta: M);
    public constructor(message: string, opts: DisplayedErrorOpts, meta?: M) {
        super(message, meta);
        this.kind = opts.kind;
        this.modal = opts.modal !== undefined ? opts.modal : false;
        show(this.message, this.kind, this.modal);
    }
}