import * as chalk from 'chalk';

import { types } from 'util';
import { Rejectable, REJECTABLE } from '../misc';


export type ExportedBError<B extends BError<any>> = (
    (B['origin'] extends Error
        ? { origin: B['origin'] }
        : { }
    ) & {
        stack?: string;
        name: B['name'];
        timestamp: Date;
        message: string;
        detail: string;
    };
)

export abstract class BError<D extends {} = {}> extends Error implements Rejectable {
    public [REJECTABLE]: true = true;
    public timestamp: Date;
    public name: string;

    public data: D;
    public origin?: Error;
    public stack?: string;
    public message: string;
    public messageColor: string;
    // public messageCSS: string; -- create a CSS equivalent for css-console styling a la chrome dev tools
    public detail: string;
    public detailColor: string;
    // public detailCSS: string;

    public constructor(data: D, origin?: Error) {
        super('UNIMPLEMENTED'); // NOTE: message might be undefined but will be set later with `this.getMessage()`
        // make sure Error type displays correctly
        this.name = this.constructor.name;
        this.timestamp = new Date();

        // ensure stack trace gets in there
        if (origin && BError.isError(origin)) {
            this.origin = origin;
            if (origin.stack) {
                this.stack = origin.stack;
            }
        }
        if (!this.stack) {
            // ensure stack trace gets in there
            if (Error.captureStackTrace) {
                Error.captureStackTrace(this, this.constructor);
            } else {
                this.stack = (new Error()).stack;
            }
        }

        this.data = this.expandMeta(data);
        this.message = this.getMessage(this.origin);
        this.detail = this.getDetail(this.origin);

        if (ansiStyleRegex.test(this.message)) {
            this.messageColor = this.message;
            this.message = stripAnsiEscapes(this.message);
        } else {
            this.messageColor = chalk.red(this.message)
        }
        if (ansiStyleRegex.test(this.detail)) {
            this.detailColor = this.detail;
            this.detail = stripAnsiEscapes(this.detail);
        } else {
            this.detailColor = chalk.warn(this.detail)
        }

        
        // adopt origin error's stack if it's set
        
    }

    protected abstract getMessage(origin?: Error): string;

    public export<D extends Partial<D>>(color: boolean = false ): ExportedBError<this> {

        return {
            ...this.data as any
        };
    }
    public toJSON() {
        return this.export(false);
    }

    public toString(color: boolean = false): string {
        return Object.toString.call(this);
    }

    protected getDetail(origin?: Error): string {-
        return this.message;
    }

    protected expandMeta(meta: D, origin?: Error): D {
        return meta as any;
    }

    // public [ inspect.custom ](): string {
    //     return 'customized stack traces/etc';
    // }

    public static isError<E extends Error>(value: any): value is E {
        return (
            value instanceof Error
            ||
            types.isNativeError(value)
        );
    }

    public static isBError<B extends BError>(value: any): value is B {
        return value instanceof BError;
    }
}

const { ...definitions } = BError.prototype;
BError.prototype = Object.create(Error.prototype);
BError.prototype.constructor = BError;
Object.assign(BError.prototype, definitions);



class Foo<O extends Error> extends BError<O> {
    public getMessage(): string {
        return '';
    }
}
const z = new Foo({});
z.export()