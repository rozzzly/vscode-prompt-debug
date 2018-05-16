import { window as vsWindow } from 'vscode';

export type MessageKind = (
    | 'error'
    | 'info'
    | 'warning'
);

export const showInfo = (text: string, modal: boolean = true) => show(text, 'info', modal);
export const showError = (text: string, modal: boolean = true) => show(text, 'error', modal);
export const showWarning = (text: string, modal: boolean = true) => show(text, 'warning', modal);

export function show(text: string, kind: MessageKind): void;
export function show(text: string, kind: MessageKind, modal: boolean): void;
export function show(text: string, kind: MessageKind, modal: boolean = true): void {
    switch (kind) {
        case 'error':
            vsWindow.showErrorMessage(text, { modal: modal });
            break;
        case 'info':
            vsWindow.showInformationMessage(text, { modal: modal });
            break;
        case 'warning':
            vsWindow.showWarningMessage(text, { modal: modal });
            break;
        default:
            console.error(TypeError('Unexpected MessageKind!'));
            break;
    }
}