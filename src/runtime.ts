import { ExtensionContext, Disposable, commands, workspace } from 'vscode';
import { findUserConfig } from './compat';
import { COMMAND_CANONICAL_IDs } from './constants';
import { registerCmds } from './commands';

const TAG_DisposableHandle: unique symbol = Symbol('TaggedTypes/DisposableHandle'); /// TODO ::: namespace this
type TAG_DisposableHandle = typeof TAG_DisposableHandle;
const TAG_DisposableHandleGroup: unique symbol = Symbol('TaggedTypes/DisposableHandleGroup'); /// TODO ::: namespace this
type TAG_DisposableHandleGroup = typeof TAG_DisposableHandle;

export type Disposer = (suppressErrors?: boolean) => void;

export const isDisposer = (value: any): value is Disposer => (
    typeof value === 'function'
);

export const isDisposable = (value: any): value is Disposable => (
    typeof value === 'object'
    &&
    'dispose' in value
    &&
    isDisposer(value.dispose)
);

export const isDisposableHandle = (value: any): value is DisposableHandle => (
    isDisposable(value)
    &&
    (value as any)[TAG_DisposableHandle] === true
);

export const isDisposableHandleGroup = (value: any): value is DisposableHandleGroup => (
    isDisposableHandle(value)
    &&
    (value as any)[TAG_DisposableHandleGroup] === true
);

export interface DisposableHandle extends Disposable {
    isDisposed: boolean;
    dispose: Disposer;
}

export interface DisposableHandleGroup extends DisposableHandle {
    // ---[ INHERITS ]-----------
    //      isDisposed: boolean;
    //      dispose: Disposer;
    children: DisposableHandle[];
}

export function getHandleGroup(ctx: ExtensionContext, ...disposables: Disposable[]): DisposableHandleGroup {
    const handle: DisposableHandleGroup = getHandle(
        ctx,
        (suppressErrors?: boolean) => (
            handle.children.forEach(child => (
                child.dispose((suppressErrors !== undefined)
                    ? suppressErrors
                    : true
                )
            ))
        )
    ) as DisposableHandleGroup;
    handle.children = disposables.map(disposable => ({
        ...(isDisposableHandle(disposable)
            ? disposable
            : getHandle(ctx, disposable)
        )
    }));
    (handle as any)[TAG_DisposableHandleGroup] = true;
    return handle;
}

export function getHandle(ctx: ExtensionContext, disposer: Disposer): DisposableHandle;
export function getHandle(ctx: ExtensionContext, disposable: Disposable): DisposableHandle;
export function getHandle(ctx: ExtensionContext, disposable: Disposer | Disposable): DisposableHandle;
export function getHandle(ctx: ExtensionContext, obj: Disposer | Disposable): DisposableHandle {
    const disposable = (isDisposable(obj)
        ? obj
        : { dispose: obj }
    );
    const handle = {
        isDisposed: false,
        [TAG_DisposableHandle]: true,
        dispose(suppressErrors: boolean = false): void {
            if (handle.isDisposed) {
                if (!suppressErrors) {
                    console.error({ disposable, handle, obj, subscriptions: ctx.subscriptions });
                    throw new ReferenceError('Already disposed!');
                } else {
                    console.warn({
                        msg: 'Already disposed.',
                        obj,
                        subscriptions: ctx.subscriptions,
                        handle
                    });
                    return;
                }
            } else {
                const idx = ctx.subscriptions.indexOf(handle);
                if (idx !== -1) {
                    disposable.dispose();
                    ctx.subscriptions.splice(idx, 1);
                    handle.isDisposed = true;
                } else {
                    if (!suppressErrors) {
                        console.error({ disposable, handle, obj, subscriptions: ctx.subscriptions });
                        throw new ReferenceError('Could not find among disposables');
                    } else {
                        console.warn({
                            msg: 'Could not find among disposables.',
                            obj,
                            subscriptions: ctx.subscriptions,
                            handle
                        });
                        return;
                    }
                }
            }
        }
    };
    ctx.subscriptions.push(handle);
    return handle;
}

export default (ctx: ExtensionContext): void => {
    findUserConfig(ctx).then(uri => {
        if (!uri) {
            console.error('could not find user config');
            const sub = getHandle(ctx, workspace.onDidChangeConfiguration(() => {
                console.info('config changed: user config could not be found before, lets try again now');
                findUserConfig(ctx).then(_uri => {
                    if (_uri) {
                        console.info('user config found!');
                        sub.dispose();
                    } else {
                        console.warn('still cannot find user config');
                    }
                });
            }));
        }
    });
    registerCmds(ctx);
};