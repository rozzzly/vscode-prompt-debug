import { BError, WrappedBError } from './compat/BError';

export type JSONified<T> = (
    (T extends string | number | boolean | null 
        ? T
        : (T extends undefined | Function
            ? undefined
            : (T extends { toJSON(): infer R }
                ? R
                : (T extends object 
                    ? JSONifiedObject<T>
                    : never
                )
            )
        )
    )
);

type JSONifiedObject<T extends object> = { [K in keyof T]: JSONified<T[K]> };

export type AsyncFn<P = any> = (...args: any[]) => Promise<P>;

export type AsyncFnWithDefault<Fn, DefaultValue> = (
    (Fn extends () => Promise<infer T>
        ? () => Promise<T | DefaultValue>
        : (Fn extends (a: infer A) => Promise<infer T>
            ? (a: A) => Promise<T | DefaultValue>
            : (Fn extends (a: infer A, b: infer B) => Promise<infer T>
                ? (a: A, b: B) => Promise<T | DefaultValue>
                : (Fn extends (a: infer A, b: infer B, C: infer C) => Promise<infer T>
                    ? (a: A, b: B, c: C) => Promise<T | DefaultValue>
                    : (Fn extends (a: infer A, b: infer B, c: infer C, d: infer D) => Promise<infer T>
                        ? (a: A, b: B, c: C, d: D) => Promise<T | DefaultValue>
                        : (Fn extends (a: infer A, b: infer B, c: infer C, d: infer D, e: infer E) => Promise<infer T>
                            ? (a: A, b: B, c: C, d: D, e: E) => Promise<T | DefaultValue>
                            : (Fn extends (a: infer A, b: infer B, c: infer C, d: infer D, e: infer E, f: infer F) => Promise<infer T>
                                ? (a: A, b: B, c: C, d: D, e: E, f: F) => Promise<T | DefaultValue>
                                : (Fn extends (...n: (infer N)[]) => Promise<infer T>
                                    ? (...n: N[]) => Promise<T | DefaultValue>
                                    : never
                                )
                            )
                        )
                    )
                )
            )
        )
    )
);
export type FnWithDefault<Fn, DefaultValue> = (
    (Fn extends () => infer T
        ? () => T | DefaultValue
        : (Fn extends (a: infer A) => infer T
            ? (a: A) => T | DefaultValue
            : (Fn extends (a: infer A, b: infer B) => infer T
                ? (a: A, b: B) => T | DefaultValue
                : (Fn extends (a: infer A, b: infer B, C: infer C) => infer T
                    ? (a: A, b: B, c: C) => T | DefaultValue
                    : (Fn extends (a: infer A, b: infer B, c: infer C, d: infer D) => infer T
                        ? (a: A, b: B, c: C, d: D) => T | DefaultValue
                        : (Fn extends (a: infer A, b: infer B, c: infer C, d: infer D, e: infer E) => infer T
                            ? (a: A, b: B, c: C, d: D, e: E) => T | DefaultValue
                            : (Fn extends (a: infer A, b: infer B, c: infer C, d: infer D, e: infer E, f: infer F) => infer T
                                ? (a: A, b: B, c: C, d: D, e: E, f: F) => T | DefaultValue
                                : (Fn extends (...n: (infer N)[]) => infer T
                                    ? (...n: N[]) => T | DefaultValue
                                    : never
                                )
                            )
                        )
                    )
                )
            )
        )
    )
);

export type RejectionListener<R = any> = (
    | undefined
    | ((reason: Rejection<R>) => void)
);

export type RejectionWrapper<W extends { origin: Error } = { origin: Error }> = (
    | undefined
    | Constructor<WrappedBError<W>>
);

export interface WrapDefault {
    <P, D>(
        promise: Promise<P>,
        defaultValue: D,
    ): Promise<P | D>;
    <P, D, R = any>(
        promise: Promise<P>,
        defaultValue: D,
        callback?: RejectionListener<R>
    ): Promise<P | D>;
    <P, D, W extends { origin: Error } = { origin: Error }>(
        promise: Promise<P>,
        defaultValue: D,
        callback?: RejectionListener<W>,
        rejectionWrapper?: RejectionWrapper<W>
    ): Promise<P | D>;
    <F extends AsyncFn, D>(
        asyncFunc: F,
        defaultValue: D,
    ): AsyncFnWithDefault<F, D>;
    <F extends AsyncFn, D, R = any>(
        asyncFunc: F,
        defaultValue: D,
        callback: RejectionListener<R>
    ): AsyncFnWithDefault<F, D>;
    <F extends AsyncFn, D, W extends { origin: Error } = { origin: Error }>(
        asyncFunc: F,
        defaultValue: D,
        callback: RejectionListener<W>,
        rejectionWrapper: RejectionWrapper<W>
    ): AsyncFnWithDefault<F, D>;
}

export interface CustomSafeAsyncFunc<Fn extends AsyncFn> {
    <DefaultValue>(
        defaultValue: DefaultValue,
    ): AsyncFnWithDefault<Fn, DefaultValue>;
    <DefaultValue, R = any>(
        defaultValue: DefaultValue,
        callback: RejectionListener<R>
    ): AsyncFnWithDefault<Fn, DefaultValue>;
    <DefaultValue, W extends { origin: Error } = { origin: Error }>(
        defaultValue: DefaultValue,
        callback: RejectionListener<W>,
        rejectionWrapper: RejectionWrapper<W>
    ): AsyncFnWithDefault<Fn, DefaultValue>;
}

export type SafeAsyncFunction<
    Fn extends AsyncFn,
    DefaultValue,
    SafeFn extends AsyncFnWithDefault<Fn, DefaultValue> = AsyncFnWithDefault<Fn, DefaultValue>
> = (
    & Fn
    & {
        safe: SafeFn;
        safeCustom: CustomSafeAsyncFunc<Fn>;
    }
);
export function makeSafe<
    Fn extends AsyncFn,
    DefaultValue,
    SafeFn extends AsyncFnWithDefault<Fn, DefaultValue> = AsyncFnWithDefault<Fn, DefaultValue>
>(
    unsafe: Fn,
    defaultValue: DefaultValue
): SafeAsyncFunction<Fn, DefaultValue, SafeFn> {
    const ret: any = unsafe;
    ret.safe = wrapDefault(unsafe, defaultValue);
    ret.safeCustom = (customDefault: any, callback: any, rejectionWrapper: any) => (
        wrapDefault(unsafe, customDefault, callback, rejectionWrapper)
    );
    return ret;
}

export const wrapDefault: WrapDefault = <P, D>(
    operation: Promise<P> | AsyncFn<P>,
    defaultValue: D,
    callback: RejectionListener = console.warn,
    rejectionWrapper?: RejectionWrapper
): any => (
    ((typeof operation === 'function')
        ? (...args: any[]) => (
            wrapDefault(
                operation(...args),
                defaultValue,
                callback,
                rejectionWrapper
            )
        ) : ((operation)
            .then(ret => {
                if (isRejection(ret)) {
                    return defaultValue;
                } else {
                    return ret;
                }
            })
        )
    )
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

export type Constructor<I = any> = new (...args: any[]) => I;
export type Instance<C extends Constructor> = C extends new (...args: any[]) => infer I ? I : never;

export function rejectify<T>(value: T, errorWrapper?: RejectionWrapper): Rejection<T>;
export function rejectify<T extends Primitive>(value: T): Rejection<T>;
export function rejectify<E extends Error, B extends Constructor<WrappedBError<any>>>(value: E, errorClass: B): B;
export function rejectify(value: any, errorWrapper?: RejectionWrapper): Rejection<any> {
    if (isRejection(value)) {
        return value as any;
    } else {
        if (isPrimitive(value)) {
            return {
                [REJECTABLE]: true,
                [PRIMITIVE_REJECTION]: true,
                reason: value
            };
        } else if (value instanceof Error && errorWrapper) {
            return new errorWrapper({ origin: value });
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

export const returnRejection = <P, R, W extends Constructor<WrappedBError<any>>>(
    promise: Promise<P>,
    callback: RejectionListener<R> = console.warn,
    rejectionWrapper?: RejectionWrapper
): Promise<P | Rejection<R>> => ((promise)
    .catch((e: any) => {
        const rejection = rejectify(e, rejectionWrapper);
        if (callback) callback(rejection);
        return rejection;
    })
);

export interface UnresolvedRaceErrorMeta {
    predicate?: (v: any) => boolean;
    promises: Promise<any>[];
}
export class UnresolvedRaceError extends BError<UnresolvedRaceErrorMeta> {
    protected getMessage(): string {
        return ((this.data.predicate)
            ? 'None of the supplied promises resolved successfully.'
            : 'None of the supplied promises resolved successfully and passed the predicate.'
        );
    }
}

export const predicateRace = <T, R>(
    promises: Promise<T>[],
    predicate: ((v: T) => boolean),
    suppressRejections: boolean = true,
    callback: RejectionListener<R> = console.warn
): Promise<T> => (
    new Promise((resolve, reject) => {
        let resolved: boolean = false;
        if (suppressRejections) {
            Promise.all(promises.map(promise => (
                returnRejection(promise, callback)
                    .then(v => {
                        if (!isRejection(v) && predicate(v)) {
                            resolved = true;
                            resolve(v);
                        }
                    })
            )
            )).then(() => {
                if (!resolved) {
                    reject(new UnresolvedRaceError({ promises, predicate }));
                } // else (already resolved)
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
                    reject(new UnresolvedRaceError({ promises, predicate }));
                }
            });
        }
    })
);


export const rejectionRace = <T, R>(
    promises: Promise<T>[],
    callback: RejectionListener = console.warn
): Promise<T> => (
    new Promise((resolve, reject) => {
        let resolved: boolean = false;
        Promise.all(promises.map(promise => (
            returnRejection(promise, callback)
                .then(v => {
                    if (!isRejection(v)) {
                        resolved = true;
                        resolve(v);
                    }
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