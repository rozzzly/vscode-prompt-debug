import { BError, ExportedBError, GenericRejectionWrapper, SyncRejectionWrapper } from './compat/BError';


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

export type ReturnType<Fn> = (
    (Fn extends (...args: any[]) => Promise<infer P>
        ? P
        : (Fn extends (...args: any[]) => infer R
            ? R
            : never
        )
    )
);

export type SyncFn<R = any> = (...args: any[]) => R;

export type AsyncFn<R = any> = (...args: any[]) => Promise<R>;

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
export type SyncFnWithDefault<Fn, DefaultValue> = (
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
export type AsyncFnOverwriteReturn<Fn, R> = (
    (Fn extends () => Promise<any>
        ? () => Promise<R>
        : (Fn extends (a: infer A) => Promise<any>
            ? (a: A) => Promise<R>
            : (Fn extends (a: infer A, b: infer B) => Promise<any>
                ? (a: A, b: B) => Promise<R>
                : (Fn extends (a: infer A, b: infer B, C: infer C) => Promise<any>
                    ? (a: A, b: B, c: C) => Promise<R>
                    : (Fn extends (a: infer A, b: infer B, c: infer C, d: infer D) => Promise<any>
                        ? (a: A, b: B, c: C, d: D) => Promise<R>
                        : (Fn extends (a: infer A, b: infer B, c: infer C, d: infer D, e: infer E) => Promise<any>
                            ? (a: A, b: B, c: C, d: D, e: E) => Promise<R>
                            : (Fn extends (a: infer A, b: infer B, c: infer C, d: infer D, e: infer E, f: infer F) => Promise<any>
                                ? (a: A, b: B, c: C, d: D, e: E, f: F) => Promise<R>
                                : (Fn extends (...n: (infer N)[]) => Promise<any>
                                    ? (...n: N[]) => Promise<R>
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
export type SyncFnOverwriteReturn<Fn, R> = (
    (Fn extends () => any
        ? () => R
        : (Fn extends (a: infer A) => any
            ? (a: A) => R
            : (Fn extends (a: infer A, b: infer B) => any
                ? (a: A, b: B) => R
                : (Fn extends (a: infer A, b: infer B, C: infer C) => any
                    ? (a: A, b: B, c: C) => R
                    : (Fn extends (a: infer A, b: infer B, c: infer C, d: infer D) => any
                        ? (a: A, b: B, c: C, d: D) => R
                        : (Fn extends (a: infer A, b: infer B, c: infer C, d: infer D, e: infer E) => any
                            ? (a: A, b: B, c: C, d: D, e: E) => R
                            : (Fn extends (a: infer A, b: infer B, c: infer C, d: infer D, e: infer E, f: infer F) => any
                                ? (a: A, b: B, c: C, d: D, e: E, f: F) => R
                                : (Fn extends (...n: (infer N)[]) => any
                                    ? (...n: N[]) => R
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

// export type ExtractNames<Bank extends DrainBank<any> = (
//     (Bank extends DrainBank<infer Names>
//         ? NamedDrains<Names>
//         : BaseDrains
//     )
// );


// export interface Drain2<Names extends string> {
//     // <N extends Notable = Notable>(item: Notable, drains: DrainBank<Names>): void;
//     // <R extends Rejectable = Rejectable>(reason: R, drains: DrainBank<Names>): void;
//     <T extends Notable | Rejectable = Notable | Rejectable>(note: T, drains: DrainBank<Names>): void | Drain<Names> | Writable;
// }

// export interface Sink2<Names extends string> {
//     drains: DrainBank<Names>;
//     passThru<P>(promise: Promise<P>): Promise<P>;
//     passThru<P>(promise: Promise<P>, drain: Drain<Names> | Names): Promise<P>;
//     passThru<P>(promise: Promise<P>, defaultWrapper: Constructor<Rejectable>): Promise<P>;
//     passThru<P>(promise: Promise<P>, drain: Drain<Names> | Names, defaultWrapper: Constructor<Rejectable>): Promise<P>;
//     fallback<P, D>(promise: Promise<P>, defaultValue: D): Promise<P | D>;
//     fallback<P, D>(promise: Promise<P>, defaultValue: D, defaultWrapper: Constructor<Rejectable>): Promise<P | D>;
//     fallback<P, D>(promise: Promise<P>, defaultValue: D, drain: Drain<Names> | Names): Promise<P | D>;
//     fallback<P, D>(promise: Promise<P>, defaultValue: D, drain: Drain<Names> | Names, defaultWrapper: Constructor<Rejectable>): Promise<P | D>;
//     fallbackSilent<P, D>(promise: Promise<P>, defaultValue: D): Promise<P | D>;
//     paired<P, R extends Rejectable>(promise: Promise<P>): Promise<[P, null] | [null, R]>;
//     paired<P, R extends Rejectable>(promise: Promise<P>, defaultWrapper: Constructor<Rejectable>): Promise<[P, null] | [null, R]>;
//     paired<P, R extends Rejectable>(promise: Promise<P>, drain: Drain<Names> | Names): Promise<[P, null] | [null, R]>;
//     paired<P, R extends Rejectable>(promise: Promise<P>, drain: Drain<Names> | Names, defaultWrapper: Constructor<Rejectable>): Promise<[P, null] | [null, R]>;
//     pairedSilent<P, R extends Rejectable>(promise: Promise<P>): Promise<[P, null] | [null, R]>;
//     pairedSilent<P, R extends Rejectable>(promise: Promise<P>, defaultWrapper: Constructor<Rejectable>): Promise<[P, null] | [null, R]>;
//     either<P, R extends Rejectable>(promise: Promise<P>): Promise<P | R>;
//     either<P, R extends Rejectable>(promise: Promise<P>, drain: Drain<Names> | Names): Promise<P | R>;
//     either<P, R extends Rejectable>(promise: Promise<P>, defaultWrapper: Constructor<Rejectable>): Promise<P | R>;
//     either<P, R extends Rejectable>(promise: Promise<P>, drain: Drain<Names> | Names, defaultWrapper: Constructor<Rejectable>): Promise<P | R>;
//     eitherSilent<P, R extends Rejectable>(promise: Promise<P>): Promise<P | R>;
//     eitherSilent<P, R extends Rejectable>(promise: Promise<P>, defaultWrapper: Constructor<Rejectable>): Promise<P | R>;
// }


export type DrainSet<Names extends string> = {
    [KnownDrain in Names]: Drain<Names>;
};

export interface DrainBank {
    [X: string]: Drain;
}

export interface Drain<Names extends string = string> {
    <T extends Notable | Rejectable = Notable | Rejectable>(note: T, drains: DrainSet<Names>): void;
}


export type BaseDrains = (
    | 'smother'
    | 'catchAll'
    | 'interceptAll'
);

export type NamedDrains<Names> = (
    (string extends Names
        ? BaseDrains
        : BaseDrains | Names
    )
);


export type Outlet<Bank extends DrainBank> = (
    | Drain
    | (
        | StringKeys<Bank>
        | BaseDrains
    )
    | undefined // shortcut to router
);

export interface SinkRouter<Names extends string> {
    <T extends Notable | Rejectable = Notable | Rejectable>(note: T, drains: DrainSet<Names>): undefined | Names | Drain;
}

const noop: Drain = (note, drains) => {
    // noop();
};
export class Sink<Bank extends DrainBank> {
    public drains: DrainSet<StringKeys<Bank> | BaseDrains>;
    private router: SinkRouter<StringKeys<Bank> | BaseDrains>;
    public constructor(drains: Bank, router: SinkRouter<StringKeys<Bank> | BaseDrains>) {
        this.drains = {
            interceptAll: noop,
            catchAll: noop,
            ...drains as any,
            smother: noop // ensure smother is never overwritten
        };
        this.router = router;
    }


    public reboundSync<Fn extends SyncFn, R extends Rejectable = SyncRejectionWrapper>(
        operation: Fn
    ): SyncFnWithDefault<Fn, R>;
    public reboundSync<Fn extends SyncFn, R extends Rejectable = SyncRejectionWrapper>(
        operation: Fn,
        opts?: {
            drain?: Drain | (StringKeys<Bank> | BaseDrains);
            defaultWrapper?: Constructor<RejectionWrapper>;
        }
    ): SyncFnWithDefault<Fn, R>;
    public reboundSync<Fn extends SyncFn, R extends Rejectable = SyncRejectionWrapper>(
        operation: Fn,
        opts: {
            drain?: Drain | (StringKeys<Bank> | BaseDrains);
            defaultWrapper: Constructor<RejectionWrapper>;
        } = { defaultWrapper: SyncRejectionWrapper }
    ): SyncFnWithDefault<Fn, R> {
        return ((...args: any[]): ReturnType<Fn> | R => {
            try {
                const result = operation(...args);
                return result;
            } catch (reason) {
                const rejection = rejectify(reason, opts.defaultWrapper);
                this.drain(rejection, opts.drain);
                return rejection;
            }
        }) as SyncFnWithDefault<Fn, R>;
    }


    public rebound<P, R extends Rejectable = GenericRejectionWrapper>(
        promise: Promise<P>
    ): Promise<P | R>;
    public rebound<Fn extends AsyncFn, R extends Rejectable = GenericRejectionWrapper>(
        operation: Fn,
    ): AsyncFnWithDefault<Fn, R>;
    public rebound<P, R extends Rejectable = GenericRejectionWrapper>(
        promise: Promise<P>,
        opts?: {
            drain?: Drain | (StringKeys<Bank> | BaseDrains);
            defaultWrapper?: Constructor<RejectionWrapper>;
        }
    ): Promise<P | R>;
    public rebound<Fn extends AsyncFn, R extends Rejectable = GenericRejectionWrapper>(
        operation: Fn,
        opts?: {
            drain?: Drain | (StringKeys<Bank> | BaseDrains);
            defaultWrapper?: Constructor<RejectionWrapper>;
        }
    ): AsyncFnWithDefault<Fn, R>;
    public rebound<P, Fn extends AsyncFn<P>, R extends Rejectable = GenericRejectionWrapper>(
        operation: Promise<P> | Fn,
        opts: {
            drain?: Drain | (StringKeys<Bank> | BaseDrains);
            defaultWrapper: Constructor<RejectionWrapper>;
        } = { defaultWrapper: GenericRejectionWrapper }
    ): Promise<P | R> | AsyncFnWithDefault<Fn, R> {
        if (typeof operation === 'function') {
            return (async (...args: any[]): Promise<P | R> => {
                try {
                    const result = await operation(...args);
                    return result;
                } catch (reason) {
                    const rejection = rejectify(reason, opts.defaultWrapper);
                    this.drain(rejection, opts.drain);
                    return rejection;
                }
            }) as AsyncFnWithDefault<Fn, R>;
        } else {
            return ((operation)
                .catch(reason => {
                    const rejection = rejectify(reason, opts.defaultWrapper);
                    this.drain(rejection, opts.drain);
                    return rejection;
                })
            );
        }
    }


    public eitherSync<Fn extends SyncFn, R extends Rejectable = SyncRejectionWrapper>(
        operation: Fn
    ): SyncFnOverwriteReturn<Fn, [ReturnType<Fn>, null] | [null, R]>;
    public eitherSync<Fn extends SyncFn, R extends Rejectable = SyncRejectionWrapper>(
        operation: Fn,
        opts?: {
            drain?: Drain | (StringKeys<Bank> | BaseDrains);
            defaultWrapper?: Constructor<RejectionWrapper>;
        }
    ): SyncFnOverwriteReturn<Fn, [ReturnType<Fn>, null] | [null, R]>;
    public eitherSync<Fn extends SyncFn, R extends Rejectable = SyncRejectionWrapper>(
        operation: Fn,
        opts: {
            drain?: Drain | (StringKeys<Bank> | BaseDrains);
            defaultWrapper: Constructor<RejectionWrapper>;
        } = {
            defaultWrapper: SyncRejectionWrapper
        }
    ): SyncFnOverwriteReturn<Fn, [ReturnType<Fn>, null] | [null, R]> {
        return ((...args: any[]): [ReturnType<Fn>, null] | [null, R] => {
            try {
                const result = operation(...args);
                return [result, null] as [ReturnType<Fn>, null];
            } catch (reason) {
                const rejection = rejectify(reason, opts.defaultWrapper);
                this.drain(rejection, opts.drain);
                return [null, rejection] as [null, R];
            }
        }) as SyncFnOverwriteReturn<Fn, [ReturnType<Fn>, null] | [null, R]>;
    }

    public either<P, R extends Rejectable = GenericRejectionWrapper>(
        promise: Promise<P>
    ): Promise<[P, null] | [null, R]>;
    public either<P, R extends Rejectable = GenericRejectionWrapper>(
        promise: Promise<P>,
        opts?: {
            drain?: Drain | (StringKeys<Bank> | BaseDrains);
            defaultWrapper?: Constructor<RejectionWrapper>;
        }
    ): Promise<[P, null] | [null, R]>;
    public either<P, Fn extends AsyncFn<P>, R extends Rejectable = GenericRejectionWrapper>(
        operation: Fn,
        opts?: {
            drain?: Drain | (StringKeys<Bank> | BaseDrains);
            defaultWrapper?: Constructor<RejectionWrapper>;
        }
    ): AsyncFnOverwriteReturn<Fn, [P, null] | [null, R]>;
    public either<P, Fn extends AsyncFn<P>, R extends Rejectable = GenericRejectionWrapper>(
        operation: Promise<P> | Fn,
        opts: {
            drain?: Drain | (StringKeys<Bank> | BaseDrains);
            defaultWrapper: Constructor<RejectionWrapper>;
        } = { defaultWrapper: GenericRejectionWrapper }
    ): Promise<[P, null] | [null, R]> | AsyncFnOverwriteReturn<Fn, [P, null] | [null, R]> {
        if (typeof operation === 'function') {
            return (async (...args: any[]): Promise<[P, null] | [null, R]> => {
                try {
                    const result = await operation(...args);
                    return [result, null] as [P, null];
                } catch (reason) {
                    const rejection = rejectify(reason, opts.defaultWrapper);
                    this.drain(rejection, opts.drain);
                    return [null, rejection] as [null, R];
                }
            }) as AsyncFnOverwriteReturn<Fn, [P, null] | [null, R]>;
        } else {
            return ((operation)
                .then(p => [p, null] as [P, null])
                .catch(reason => {
                    const rejection = rejectify(reason, opts.defaultWrapper);
                    this.drain(rejection, opts.drain);
                    return [null, rejection] as [null, R];
                })
            );
        }
    }


    public fallbackSync<Fn extends SyncFn, D>(operation: Fn, defaultValue: D): SyncFnWithDefault<Fn, D>;
    public fallbackSync<Fn extends SyncFn, D>(
        operation: Fn,
        defaultValue: D,
        opts?: {
            drain?: Drain | (StringKeys<Bank> | BaseDrains);
            defaultWrapper?: Constructor<RejectionWrapper>;
        }
    ): SyncFnWithDefault<Fn, D>;
    public fallbackSync<Fn extends SyncFn, D>(
        operation: Fn,
        defaultValue: D,
        opts: {
            drain?: Drain | (StringKeys<Bank> | BaseDrains);
            defaultWrapper: Constructor<RejectionWrapper>;
        } = { defaultWrapper: SyncRejectionWrapper }
    ): SyncFnWithDefault<Fn, D> {
        return ((...args: any[]): any => {
            try {
                const result = operation(...args);
                return result;
            } catch (reason) {
                const rejection = rejectify(reason, opts.defaultWrapper);
                this.drain(rejection, opts.drain);
                return defaultValue;
            }
        }) as SyncFnWithDefault<Fn, D>;
    }

    public fallback<P, D>(promise: Promise<P>, defaultValue: D): Promise<P | D>;
    public fallback<Fn extends AsyncFn, D>(operation: Fn, defaultValue: D): AsyncFnWithDefault<Fn, D>;
    public fallback<P, D>(
        promise: Promise<P>,
        defaultValue: D,
        opts?: {
            drain?: Drain | (StringKeys<Bank> | BaseDrains);
            defaultWrapper?: Constructor<RejectionWrapper>;
        }
    ): Promise<P | D>;
    public fallback<Fn extends AsyncFn, D>(
        operation: Fn,
        defaultValue: D,
        opts?: {
            drain?: Drain | (StringKeys<Bank> | BaseDrains);
            defaultWrapper?: Constructor<RejectionWrapper>;
        }
    ): AsyncFnWithDefault<Fn, D>;
    public fallback<P, D>(
        operation: Promise<P> | AsyncFn<P>,
        defaultValue: D,
        opts: {
            drain?: Drain | (StringKeys<Bank> | BaseDrains);
            defaultWrapper: Constructor<RejectionWrapper>;
        } = { defaultWrapper: GenericRejectionWrapper }
    ): Promise<P | D> | AsyncFn<P | D> {
        if (typeof operation === 'function') {
            return async(...args: any[]): Promise<P | D> => {
                try {
                    const result = operation(...args);
                    return result;
                } catch (reason) {
                    const rejection = rejectify(reason, opts.defaultWrapper);
                    this.drain(rejection, opts.drain);
                    return defaultValue;
                }
            };
        } else {
            return operation.catch(reason => {
                const rejection = rejectify(reason, opts.defaultWrapper);
                this.drain(rejection, opts.drain);
                throw rejection;
            });
        }
    }



    public passThruSync<Fn extends SyncFn>(
        operation: Fn
    ): Fn;
    public passThruSync<Fn extends SyncFn>(
        operation: Fn,
        opts?: {
            drain?: Drain | (StringKeys<Bank> | BaseDrains);
            defaultWrapper?: Constructor<RejectionWrapper>;
        }
    ): Fn;
    public passThruSync<Fn extends SyncFn>(
        operation: Fn,
        opts: {
            drain?: Drain | (StringKeys<Bank> | BaseDrains);
            defaultWrapper: Constructor<RejectionWrapper>;
        } = { defaultWrapper: SyncRejectionWrapper }
    ): Fn {
        return ((...args: any[]): any => {
            try {
                const result = operation(...args);
                return result;
            } catch (reason) {
                const rejection = rejectify(reason, opts.defaultWrapper);
                this.drain(rejection, opts.drain);
                throw rejection;
            }
        }) as Fn;
    }

    public passThru<P>(promise: Promise<P>): Promise<P>;
    public passThru<Fn extends AsyncFn>(promise: Fn): Fn;
    public passThru<P>(
        promise: Promise<P>,
        opts?: {
            drain?: Drain | (StringKeys<Bank> | BaseDrains);
            defaultWrapper?: Constructor<RejectionWrapper>;
        }
    ): Promise<P>;
    public passThru<Fn extends AsyncFn>(
        promise: Fn,
        opts?: {
            drain?: Drain | (StringKeys<Bank> | BaseDrains);
            defaultWrapper?: Constructor<RejectionWrapper>;
        }
    ): Fn;
    public passThru<P>(
        operation: Promise<P> | AsyncFn<P>,
        opts: {
            drain?: Drain | (StringKeys<Bank> | BaseDrains);
            defaultWrapper: Constructor<RejectionWrapper>;
        } = { defaultWrapper: GenericRejectionWrapper }
    ): Promise<P> | AsyncFn<P> {
        if (typeof operation === 'function') {
            return async(...args: any[]): Promise<P> => {
                try {
                    const result = await operation(...args);
                    return result;
                } catch (reason) {
                    const rejection = rejectify(reason, opts.defaultWrapper);
                    this.drain(rejection, opts.drain);
                    throw rejection;
                }
            };
        } else {
            return operation.catch(reason => {
                const rejection = rejectify(reason, opts.defaultWrapper);
                this.drain(rejection, opts.drain);
                throw rejection;
            });
        }
   }


    private drain(note: Notable | Rejectable, outlet?: Outlet<Bank>): void {
        let routed: Outlet<Bank>;
        if (outlet === undefined) {
            routed = this.router(note, this.drains);
        } else {
            routed = outlet;
        }

        if (typeof routed === 'function') {
            routed(note, this.drains);
        } else if (routed === undefined) {
            this.drains.catchAll(note, this.drains);
        } else if (routed === null) {
            this.drains.smother(note, this.drains);
        } else if (typeof routed === 'string') {
            if (Object.keys(this.drains).includes(routed)) {
                this.drains[routed](note, this.drains);
            } else {
                // do not have a drain by that name
                /// TODO throw an error instead
                this.drains.catchAll(note, this.drains);
            }
        }
        if (this.drains.interceptAll !== noop) {
            this.drains.interceptAll(note, this.drains);
        }
    }
}

const s2 = new Sink({
    derp(n, d) {
        return d.foo;
    },
    lol(n, d) {
        return;
    }
}, (note, z) => {
    return z.lol;
});

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
    | 'plain'
);

export interface Notable {
    [NOTABLE]: true;
    timestamp: Date;
    level: NoteLevel;
    message: string;
    messageColor: string;

}

export interface Rejectable extends Notable {
    [REJECTABLE]: true;
}


export type Constructor<I> =  new (...args: any[]) => I;
export type RejectionWrapper = BError<{ reason: any }>;

export function rejectify<
    R extends Rejectable
>(value: R): R;
export function rejectify<
    R extends Rejectable,
    W extends RejectionWrapper
>(value: R, wrapper: Constructor<W>): R | W;
export function rejectify(value: unknown): Rejectable | GenericRejectionWrapper;
export function rejectify<
    W extends RejectionWrapper
>(value: unknown, wrapper: Constructor<W>): Rejectable | W;
export function rejectify<
    W extends RejectionWrapper
>(value: unknown, wrapper: Constructor<W> = GenericRejectionWrapper as any): Rejectable | W {
    if (isRejectable(value)) {
        return value;
    } else {
        return new wrapper({ reason: value });
    }
}

export function isNotable<L extends Notable>(value: L): value is L;
export function isNotable<L extends Notable = Notable>(value: any): value is L;
export function isNotable(value: any): value is Notable {
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
        isNotable(value)
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