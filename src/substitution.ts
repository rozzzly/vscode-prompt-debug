const subEscape: RegExp = /(\$\{\s*\S+?(?:\s?\S?)*?\})/g
const unwrapSubEscape: RegExp = /\$\{([\s|\S]*)\}/g;

export type SimpleSubPatternHandler = {
    pattern: string;
    resolver(): string | Promise<string>;
}

export type ParameterizedSubPatternHandler = {
    pattern: RegExp;
    resolver(...value: string[]): string | Promise<string>;
}

export type SubPatternHandler = (
    | SimpleSubPatternHandler
    | ParameterizedSubPatternHandler
);

export const isSimple = (value: any): value is SimpleSubPatternHandler => typeof value.pattern === 'string';
export const isParameterized = (value: any): value is ParameterizedSubPatternHandler => !isSimple(value);

const defaultHandlers: SubPatternHandler[] = [
    {
        pattern: /command\:(\.+)/,
        async resolver(command): Promise<string> {

            return '';
        }
    }
];

export const substitute = (str: string, handlers: SubPatternHandler[] = defaultHandlers): Promise<string> => (
    Promise.all((str)
        .split(subEscape)
        .map(piece => new Promise<string>((resolve, reject) => {
            const subExpression = unwrapSubEscape.exec(piece)[1];
            const handler = handlers.find(handler => {
                if (isSimple(handler)) {
                    return subExpression === handler.pattern;
                } else {
                    return handler.pattern.test(subExpression);
                }
            });
            if (handler) {
                if (isSimple(handler)) {
                    resolve(handler.resolver())
                } else {
                    const [_, ...parameters] = handler.pattern.exec(subExpression);
                    resolve(handler.resolver(...parameters));
                }
            } else {
                console.warn('unknown substitution pattern encountered', { str, piece, handler });
                resolve(piece); // for now, just return the DERP
            }
        }))
    ).then(pieces => pieces.join())
);