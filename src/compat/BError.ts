import { Rejectable, REJECTABLE } from '../misc';


export abstract class BError<M extends {} = {}> extends Error implements Rejectable {
    public [REJECTABLE]: true = true;
    public timestamp: Date;
    public name: string;

    public meta: M;
    public stack?: string;
    public message: string;
    public extMessage: string;

    public constructor(meta: M = {} as any) {
        super('UNIMPLEMENTED'); // NOTE: message might be undefined but will be set later with `this.getMessage()`
        // make sure Error type displays correctly
        this.name = this.constructor.name;
        this.timestamp = new Date();
        this.meta = this.expandMeta(meta);
        this.message = this.getMessage();
        this.extMessage = this.getExtMessage();

        // ensure stack trace gets in there
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        } else {
            this.stack = (new Error(this.message)).stack;
        }
    }

    protected abstract getMessage(): string;

    protected getExtMessage(): string {
        return this.message;
    }

    protected expandMeta(meta: M): M {
        return meta;
    }

    // public [ inspect.custom ](): string {
    //     return 'customized stack traces/etc';
    // }


}

const { ...definitions } = BError.prototype;
BError.prototype = Object.create(Error.prototype);
BError.prototype.constructor = BError;
Object.assign(BError.prototype, definitions);


export abstract class WrappedBError<M extends { origin: Error }> extends BError<M> {
    public constructor(meta: M) {
        super(meta);
        // adopt origin error's stack if it's set
        if (this.meta.origin && this.meta.origin instanceof Error && this.meta.origin.stack) {
            this.stack = this.meta.origin.stack;
        }
    }

    protected getMessage(): string {
        return `[${this.name} >> ${this.meta.origin.name}]: ${this.meta.origin.message}`;
    }
}
