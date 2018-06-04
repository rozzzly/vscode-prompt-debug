import { NavigationBarItem } from 'typescript';

export const fallback = <T, D, R = any>(
    promise: Promise<T>,
    defaultValue: D,
    callback: ((reason: Rejectable<R>) => void) = console.warn
): Promise<T | D> => ((promise)
    .catch(e => {
        callback(rejectify(e));
        return defaultValue;
    })
);


export const REJECTABLE: unique symbol = Symbol('RuntimeHint/REJECTABLE'); /// TODO ::: namespace this
export type REJECTABLE = typeof REJECTABLE;

export const PRIMITIVE_REJECTION: unique symbol = Symbol('RuntimeHint/PRIMITIVE_REJECTION'); /// TODO ::: namespace this
export type PRIMITIVE_REJECTION = typeof PRIMITIVE_REJECTION;


export interface Rejectable<T = any> {
    [REJECTABLE]: T;
}
export type Primitive = (
    | number
    | string
    | null
    | undefined
);
export interface PrimitiveRejection<T extends Primitive> extends Rejectable<T> {
    [PRIMITIVE_REJECTION]: true;
    reason: T;
}

export type Rejection<T> = (
    (T extends Primitive
        ? PrimitiveRejection<T>
        : Rejectable<T>
    )
);

export function rejectify<T>(value: any): Rejection<T> {
    if (isRejection(value)) {
        return value as any;
    } else {
        if (Object.isFrozen(value)) {
            return {
                [REJECTABLE]: value,
                [PRIMITIVE_REJECTION]: true,
                reason: value
            } as any;
        } else {
            value[REJECTABLE] = value;
            return value;
        }
    }
}

const isRejection = (value: any): value is Rejection<any> => (
    value && !!value[REJECTABLE]
);

const isPrimitiveRejection = (value: any): value is PrimitiveRejection<any> => (
    isRejection(value) && (value as any)[PRIMITIVE_REJECTION] === true
);

export const wrap = <P, T, R extends Rejectable<T>>(
    promise: Promise<P>
): Promise<P | R> => ((promise)
    .catch((e: any) => rejectify<T>(e));
);

export const predicateRace = <T>(
    promises: Promise<T>[],
    predicate: ((v: T) => boolean),
    suppressRejections: boolean = true
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
                    console.warn(e);
                })
            ))).then(() => {
                if (!resolved) reject('None of the promisee resolved successfully.');
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
                if (!resolved) reject('None of the promisee resolved successfully.');
            });
        }
    })
);


export const rejectionRace = <T>(promises: Promise<T>[]): Promise<T> => (
    new Promise((resolve, reject) => {
        let resolved: boolean = false;
        Promise.all(promises.map(promise => ((promise)
            .then(v => {
                resolved = true;
                resolve(v);
            })
            .catch(e => {
                console.warn(e);
            })
        ))).then(() => {
            if (!resolved) reject('None of the promisee resolved successfully.');
        });
    })
);