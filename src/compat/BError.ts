import chalk from 'chalk';

import { types } from 'util';
import { Rejectable, JSONifiedObject, JSONified, REJECTABLE, NOTABLE, NoteLevel } from '../misc';
import { Constructor } from '../../node_modules/make-error';

export const ansiStyleRegex: RegExp = /(\u001b\[(?:\d+;)*\d+m)/u;
export const stripAnsiEscapes = (str: string): string => (
    ((str)
        .split(ansiStyleRegex)
        .reduce((reduction, part) => (
            ((ansiStyleRegex.test(part))
                ? reduction
                : reduction + part
            )
        ), '')
    )
);

export type ExportedBError<B extends BError> = JSONified<{
    origin: B['origin'];
    stack?: string;
    meta: B['data'];
    name: string;
    timestamp: Date;
    message: string;
    detail: string;
}>;

export abstract class BError<D extends {} = {}> extends Error implements Note, Rejectable {
    public [NOTABLE]: true = true;
    public [REJECTABLE]: true = true;
    public name: string;

    public data: D;
    public level: NoteLevel = 'error';
    public timestamp: Date;
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

        // use origin's stack trace if possible
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
                this.stack = new Error().stack;
            }
        }

        this.data = this.expandData(data, this.origin);
        this.message = this.getMessage(this.origin);
        this.detail = this.getDetail(this.origin);

        if (ansiStyleRegex.test(this.message)) {
            this.messageColor = this.message;
            this.message = stripAnsiEscapes(this.message);
        } else {
            this.messageColor = chalk.red(this.message);
        }
        if (ansiStyleRegex.test(this.detail)) {
            this.detailColor = this.detail;
            this.detail = stripAnsiEscapes(this.detail);
        } else {
            this.detailColor = chalk.yellow(this.detail);
        }
    }
    protected abstract getMessage(origin: this['origin']): string;

    /// TODO ::: write a serializer
    public toJSON(): ExportedBError<this> {
        return {
            stack: this.stack,
            name: this.name,
            origin: this.origin && (this.origin as any).toJSON ? (this.origin as any).toJSON() : this.origin,
            timestamp: this.timestamp.toUTCString(),
            message: this.message,
            detail: this.detail,
            meta: this.data as any
        };
    }

    public toString(color: boolean = false): string {
        return JSON.stringify(this.toJSON());
    }

    protected getDetail(origin: this['origin']): string {
        return this.message;
    }

    protected expandData(data: D, origin: this['origin']): D {
        return data as any;
    }

    // public [ inspect.custom ](): string {
    //     return 'customized stack traces/etc';
    // }

    public static isError<E extends Error>(value: unknown): value is E {
        return value instanceof Error || types.isNativeError(value);
    }

    public static isBError<B extends BError>(value: unknown): value is B {
        return value instanceof BError;
    }
}

const { ...definitions } = BError.prototype;
BError.prototype = Object.create(Error.prototype);
BError.prototype.constructor = BError;
Object.assign(BError.prototype, definitions);

export interface RejectionMetaData {
    reason: any;
}
export class GenericRejectionWrapper extends BError<RejectionMetaData> {
    public constructor(meta: RejectionMetaData, origin?: Error) {
        super(
            {
                reason: meta.reason ? meta.reason : origin !== undefined ? origin : meta.reason
            },
            origin === undefined && BError.isError(meta.reason) ? meta.reason : origin
        );
    }
    protected getMessage(origin?: Error): string {
        return 'Promise was rejected!';
    }
    public getDetail(origin?: Error) {
        return origin
            ? `Promise rejected with an ${origin.name}: "${origin.message}"`
            : `Promise rejected with reason: "${this.data.reason}"`;
    }
}

export class SyncRejectionWrapper extends GenericRejectionWrapper {
    protected getMessage(origin?: Error): string {
        return 'Function call threw a rejection!';
    }
    public getDetail(origin?: Error) {
        return origin
            ? `Function call rejected with an ${origin.name}: "${origin.message}"`
            : `Function call rejected with reason: "${this.data.reason}"`;
    }
}