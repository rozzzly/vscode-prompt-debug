export class BError<M extends {} = {}> extends Error {
    public name: string;
    public timestamp: Date;
    public message: string;
    public meta: M | undefined;
    public extMessage: string;
    public stack: string | undefined;

    public constructor(message: string, meta?: M) {
        super(message);
        // make sure Error type displays correctly
        this.name = this.constructor.name;

        this.meta = meta;
        this.timestamp = new Date();
        this.extMessage = this.getExtMessage();

        // ensure stack trace gets in there
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        } else {
            this.stack = (new Error(message)).stack;
        }

    }

    protected getExtMessage(): string {
        return this.message;
    }

    // public [ inspect.custom ](): string {
    //     return 'customized stack traces/etc';
    // }


}