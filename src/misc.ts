import { BError, ExportedBError, GenericRejectionWrapper, RejectionMetaData } from './compat/BError';
import { BaseError } from '../node_modules/make-error';



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

export type StringKeys<T> = Extract<keyof T, string>;
export type MakeOptional<T, K extends keyof T> = (
    Pick<T, Exclude<keyof T, K>>
    // & {
    //     [O in K] +?: T[O]
    // }
);


export type BaseDrains = (
    | 'catchAll'
    | 'discard'
);

export type NamedDrains<Names extends string> = (
    BaseDrains | Names
);

// export type DrainBank<Names extends string> = {
//     [Name in Names]: Drain<Name, Names>;
// };
export interface DrainBank2 {
    [N: string]: Drain<StringKeys<this>>;
    discard?: Drain<StringKeys<this>>;
    catchAll?: Drain<StringKeys<this>>;
}



export interface Drain<Names extends string = string> {
    <N extends Notable = Notable>(item: Notable, drains: DrainBank2<Names>): void;
    <R extends Rejectable = Rejectable>(reason: R, drains: DrainBank2<Names>): void;
    <T extends Notable | Rejectable = Notable | Rejectable>(reason: T, drains: DrainBank2<Names>): void;
}

export interface Sink<Bank extends DrainBank2> {
    drains: Bank;
    safe<P>(promise: Promise<P>): P;
    safe<P, Name extends keyof Bank>(promise: Promise<P>, drain: Name): P;
    safe<P, CustomDrain extends Drain<keyof Bank>>(promise: Promise<P>, drain: CustomDrain): P;
}

export interface SinkRouter<Bank extends DrainBank2> {
    <N extends Notable = Notable>(note: N, drains: Bank): void | keyof Bank | Drain<keyof Bank>;
    <R extends Rejectable = Rejectable>(reason: R, drains: Bank):  void | keyof Bank | Drain<keyof Bank>;
    <T extends Notable | Rejectable = Notable | Rejectable>(note: T, drains: Bank):  void | keyof Bank | Drain<keyof Bank>;
}
export function Sinked<CustomDrains extends DrainBank2>(bank: CustomDrains, router: SinkRouter<CustomDrains>): Sink<CustomDrains> {
    return undefined as any;
}

const drained = Sinked(false);




export interface WrapDefault {
    <P, D>(
        promise: Promise<P>,
        defaultValue: D,
    ): Promise<P | D>;
    <P, D, R = any>(
        promise: Promise<P>,
        defaultValue: D,
        callback?: Drain<R>
    ): Promise<P | D>;
    <P, D, W extends { origin: Error } = { origin: Error }>(
        promise: Promise<P>,
        defaultValue: D,
        callback?: Drain<W>,
        rejectionWrapper?: RejectionWrapper<W>
    ): Promise<P | D>;
    <F extends AsyncFn, D>(
        asyncFunc: F,
        defaultValue: D,
    ): AsyncFnWithDefault<F, D>;
    <F extends AsyncFn, D, R = any>(
        asyncFunc: F,
        defaultValue: D,
        callback: Drain<R>
    ): AsyncFnWithDefault<F, D>;
    <F extends AsyncFn, D, W extends { origin: Error } = { origin: Error }>(
        asyncFunc: F,
        defaultValue: D,
        callback: Drain<W>,
        rejectionWrapper: RejectionWrapper<W>
    ): AsyncFnWithDefault<F, D>;
}

export interface CustomSafeAsyncFunc<Fn extends AsyncFn> {
    <DefaultValue>(
        defaultValue: DefaultValue,
    ): AsyncFnWithDefault<Fn, DefaultValue>;
    <DefaultValue, R = any>(
        defaultValue: DefaultValue,
        callback: Drain<R>
    ): AsyncFnWithDefault<Fn, DefaultValue>;
    <DefaultValue, W extends { origin: Error } = { origin: Error }>(
        defaultValue: DefaultValue,
        callback: Drain<W>,
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
    callback: Drain | false = console.warn,
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
                if (isRejectable(ret)) {
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
export const NOTABLE: unique symbol = Symbol('RuntimeHint/NOTABLE'); /// TODO ::: namespace this
export type NOTABLE = typeof NOTABLE;


export type NoteLevel = (
    | 'info'
    | 'warn'
    | 'debug'
    | 'error'
);

export interface Notable {
    [REJECTABLE]: true;
    timestamp: Date;
    level: NoteLevel;
    message: string;
    messageColor: string;

}

export interface Rejectable extends Notable {
    [REJECTABLE]: true;
}


export type Constructor<I> =  new (...args: any[]) => I;
export type Instance<C> = C extends new (...args: any[]) => infer I ? I : never;
export type RejectionWrapper = BError<{ reason: any }>;


export function rejectify<
    R extends Rejectable,
    W extends RejectionWrapper = GenericRejectionWrapper
>(value: R, wrapper: Constructor<W>): R;
export function rejectify<
    R = Rejectable,
    W extends RejectionWrapper = GenericRejectionWrapper
>(value: unknown, wrapper: Constructor<W>): R | W;
export function rejectify<
    R = Rejectable,
    W extends RejectionWrapper = GenericRejectionWrapper
>(value: R, wrapper: Constructor<W> = GenericRejectionWrapper as any): R | W {
    if (isRejectable(value)) {
        return value;
    } else {
        return new wrapper({ reason: value });
    }
}



export function isLoggable<L extends Notable>(value: L): value is L;
export function isLoggable<L extends Notable = Notable>(value: any): value is L;
export function isLoggable(value: any): value is Notable {
    return (
        value
            &&
        value[NOTABLE] === true
    );
}

export function isRejectable<R extends Rejectable>(value: R): value is R;
export function isRejectable<R extends Rejectable = Rejectable>(value: any): value is R;
export function isRejectable(value: any): value is Rejectable {
    return (
        isLoggable(value)
            &&
        value[REJECTABLE] === true
    );
}


export const returnRejection = <P, R>(
    promise: Promise<P>,
    callback: Drain = console.warn,
    rejectionWrapper?: RejectionWrapper
): Promise<P | Rejectable<R>> => ((promise)
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
    callback: Drain = console.warn
): Promise<T> => (
    new Promise((resolve, reject) => {
        let resolved: boolean = false;
        if (suppressRejections) {
            Promise.all(promises.map(promise => (
                returnRejection(promise, callback)
                    .then(v => {
                        if (!isRejectable(v) && predicate(v)) {
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
    callback: Drain = console.warn
): Promise<T> => (
    new Promise((resolve, reject) => {
        let resolved: boolean = false;
        Promise.all(promises.map(promise => (
            returnRejection(promise, callback)
                .then(v => {
                    if (!isRejectable(v)) {
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