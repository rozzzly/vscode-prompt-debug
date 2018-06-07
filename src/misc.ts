import { BError } from './compat/BError';

export type AsyncFunctionWithDefault<D, F> = (
    (F extends (arg0: infer A0) => Promise<infer P>
        ? (arg0: A0) => Promise<P | D>
        : (F extends (arg0: infer A0, arg1: infer A1) => Promise<infer P>
            ? (arg0: A0, arg1: A1) => Promise<P | D>
            : (F extends (arg0: infer A0, arg1: infer A1, arg2: infer A2) => Promise<infer P>
                ? (arg0: A0, arg1: A1, arg2: A2) => Promise<P | D>
                : (F extends (...args: (infer A)[]) => Promise<infer P>
                    ? (...args: A[]) => Promise<P | D>
                    : never
                )
    )
);

export const wrapDefaultFunction = <F extends (...args: any[]) => Promise<any>, D, R = any>(
    asyncFunc: F,
    defaultValue: D,
    callback: ((reason: Rejection<R>) => void) = console.warn
): AsyncFunctionWithDefault<D, F> => (
    (...args: any[]) => wrapDefault(
        asyncFunc(...args), defaultValue, callback
    )
) as any;


export const wrapDefault = <T, D, R = any>(
    promise: Promise<T>,
    defaultValue: D,
    callback: ((reason: Rejection<R>) => void) = console.warn
): Promise<T | D> => ((wrapRejection(promise, callback))
    .then(ret => {
        if (isRejection(ret)) {
            return defaultValue;
        } else {
            return ret;
        }
    })
);


export const REJECTABLE: unique symbol = Symbol('RuntimeHint/REJECTABLE'); /// TODO ::: namespace this
export type REJECTABLE = typeof REJECTABLE;

export const PRIMITIVE_REJECTION: unique symbol = Symbol('RuntimeHint/PRIMITIVE_REJECTION'); /// TODO ::: namespace this
export type PRIMITIVE_REJECTION = typeof PRIMITIVE_REJECTION;


export interface Rejectable {
    [REJECTABLE]: true;
}
export type ExoticRejection<T> = (
    & T
    & Rejectable
);

export type Primitive = (
    | number
    | string
    | null
    | undefined
);
export interface PrimitiveRejection<T extends Primitive> extends Rejectable {
    [PRIMITIVE_REJECTION]: true;
    reason: T;
}

export type Rejection<T> = (
    (T extends Primitive
        ? PrimitiveRejection<T>
        : ExoticRejection<T>
    )
);

export function rejectify<T>(value: T): Rejection<T>;
export function rejectify<T extends Primitive>(value: T): Rejection<T>;
export function rejectify(value: any): Rejection<any> {
    if (isRejection(value)) {
        return value as any;
    } else {
        if (isPrimitive(value)) {
            return {
                [REJECTABLE]: true,
                [PRIMITIVE_REJECTION]: true,
                reason: value
            };
        } else {
            value[REJECTABLE] = true;
            if (value[REJECTABLE] === true) {
                return value;
            } else {
                return {
                    [REJECTABLE]: true,
                    [PRIMITIVE_REJECTION]: true,
                    reason: value
                };
            }
        }
    }
}

const isPrimitive = (value: any): value is Primitive => (
    Object.isFrozen(value)
);

const isRejection = (value: any): value is Rejectable => (
    value && value[REJECTABLE] === true
);

const isPrimitiveRejection = (value: any): value is PrimitiveRejection<any> => (
    isRejection(value) && (value as any)[PRIMITIVE_REJECTION] === true
);

const isExoticRejection = (value: any): value is PrimitiveRejection<any> => (
    isRejection(value) && !(value as any)[PRIMITIVE_REJECTION]
);

export const wrapRejection = <P, T>(
    promise: Promise<P>,
    logCallback: ((reason: Rejection<T>) => void) = console.warn
): Promise<P | Rejection<T>> => ((promise)
    .catch((e: T) => {
        const rejection = rejectify(e);
        logCallback(rejection);
        return rejection;
    })
);

export interface UnresolvedRaceErrorMeta {
    predicate?: (v: any) => boolean;
    promises: Promise<any>[];
}
export class UnresolvedRaceError extends BError<UnresolvedRaceErrorMeta> {
    protected getMessage(): string {
        return ((this.meta.predicate)
            ? 'None of the supplied promises resolved successfully.'
            : 'None of the supplied promises resolved successfully and passed the predicate.'
        );
    }
}

export const predicateRace = <T, R>(
    promises: Promise<T>[],
    predicate: ((v: T) => boolean),
    suppressRejections: boolean = true,
    logCallback: ((reason: Rejection<R>) => void) = console.warn
): Promise<T> => (
    new Promise((resolve, reject) => {
        let resolved: boolean = false;
        if (suppressRejections) {
            Promise.all(promises.map(promise => ((promise)
                .then(v => {
                    if (predicate(v)) {
                        resolved = true;
                        resolve(v);
                    }
                })
                .catch(e => {
                    logCallback(rejectify(e));
                })
            ))).then(() => {
                if (!resolved) {
                    throw new UnresolvedRaceError({ promises, predicate });
                }
            });
        } else {
            Promise.all(promises.map(promise => ((promise)
                .then(v => {
                    if (predicate(v)) {
                        resolved = true;
                        resolve(v);
                    }
                })
            ))).then(() => {
                if (!resolved) {
                    throw new UnresolvedRaceError({ promises, predicate });
                }
            });
        }
    })
);


export const rejectionRace = <T, R>(
    promises: Promise<T>[],
    logCallback: ((reason: Rejection<R>) => void) = console.warn
): Promise<T> => (
    new Promise((resolve, reject) => {
        let resolved: boolean = false;
        Promise.all(promises.map(promise => ((promise)
            .then(v => {
                resolved = true;
                resolve(v);
            })
            .catch(e => {
                logCallback(e);
            })
        ))).then(() => {
            if (!resolved) {
                reject(new UnresolvedRaceError({
                    promises
                }));
            }
        });
    })
);