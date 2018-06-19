import { BError, ExportedBError, GenericRejectionWrapper, RejectionMetaData } from './compat/BError';
import { deprecate } from 'util';

export interface OmittedJSON {
    functions: boolean;
    prototype: boolean;
    symbolKeys: boolean;
}

export type JSONified<Value, Omitted extends OmittedJSON = { functions: false, prototype: true, symbolKeys: false }> = (
    (Value extends string | number | boolean | null | undefined
        ? Value
        : (Value extends symbol
            ? string
            : (Value extends Function
                ? (Omitted['functions'] extends true
                    ? undefined
                    : string
                ) : (Value extends { toJSON(): infer R }
                    ? R
                    : (Value extends Array<any>
                        ? Value
                        : (Value extends RegExp | Date
                            ? string
                            : (Value extends object
                                ? JSONifiedObject<Value, Omitted>
                                : never
                            )
                        )
                    )
                )
            )
        )
    )
);

/// TODO ::: obey Omitted.symbolKeys, Omitted.prototype when true
export type JSONifiedObject<Value extends object, Omitted extends OmittedJSON = { functions: false, prototype: true, symbolKeys: false }> = {
    [K in keyof Value]: JSONified<Value[K], Omitted>
};


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

export type RejectionListener = (reason: Rejection) => void;

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
    callback: RejectionListener | false = console.warn,
    rejectionWrapper?: RejectionWrapper
): any => (
    ((typeof operation === 'function')
        ? (...args: any[]) => ( // operation is AsyncFn
            wrapDefault(
                operation(...args),
                defaultValue,
                callback,
                rejectionWrapper
            )
        ) : ((operation) // operation is promise
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


export interface Rejection {
    [REJECTABLE]: true;
}


export type Constructor<I> =  new (...args: any[]) => I;
export type Instance<C> = C extends new (...args: any[]) => infer I ? I : never;
export type RejectionWrapper = BError<{ reason: any }>;

export type RejectionOrWrapper<R, W extends RejectionWrapper> = (
    (R extends Rejection
        ? R
        : W
    )
);


export function rejectify<
    R extends Rejection,
    W extends RejectionWrapper = GenericRejectionWrapper
>(value: R, wrapper: Constructor<W>): R;
export function rejectify<
    R = Rejection,
    W extends RejectionWrapper = GenericRejectionWrapper
>(value: any, wrapper: Constructor<W>): R | W;
export function rejectify<
    R = Rejection,
    W extends RejectionWrapper = GenericRejectionWrapper
>(value: R, wrapper: Constructor<W> = GenericRejectionWrapper as any): R | W {
    if (isRejection(value)) {
        return value;
    } else {
        return new wrapper({ reason: value });
    }
}


export function isRejection<R extends Rejection>(value: R): value is R;
export function isRejection<R extends Rejection = Rejection>(value: any): value is R;
export function isRejection(value: any): value is Rejection {
    return (
        value
            &&
        value[REJECTABLE] === true
    );
}

export const returnRejection = <P, R>(
    promise: Promise<P>,
    callback: RejectionListener = console.warn,
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
        return ((this.meta.predicate)
            ? 'None of the supplied promises resolved successfully.'
            : 'None of the supplied promises resolved successfully and passed the predicate.'
        );
    }
    public toJSON(): ExportedBError<this> {
        const json = super.toJSON();
        return {
            ...json,
            meta: {
                ...(json.meta as any),
                predicate: json.meta.predicate ? json.meta.predicate.toString() : undefined
            }
        };
    }
}

export const predicateRace = <T, R>(
    promises: Promise<T>[],
    predicate: ((v: T) => boolean),
    suppressRejections: boolean = true,
    callback: RejectionListener = console.warn
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