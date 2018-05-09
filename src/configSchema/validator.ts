import * as ajv from 'ajv';
import GlobResolverConfigSchema from './GlobResolverConfig';
import { GlobResolverConfig, GlobResolver } from '../Resolver/GlobResolver/schema';
import { valid } from 'semver';

const schemaValidator = new ajv({
    allErrors: true,
    useDefaults: true
});

schemaValidator.addMetaSchema(require('ajv/lib/refs/json-schema-draft-06.json')); // tslint:disable-line:no-var-requires

const globResolverValidator = schemaValidator.compile(GlobResolverConfigSchema);

export interface Validator<T extends object> {
    (config: object): T | null;
    (config: object, suppressErrors: true): T | null;
    (config: object, suppressErrors: false): T;
    (config: object, suppressErrors: boolean): T | null;
}

const makeValidator = <T extends object>(validateFunction: ajv.ValidateFunction): Validator<T> => (
    ((
        _config: object,
        suppressErrors: boolean = true
    ): T | null  => {
        const config = { ..._config }; // clone so it's safe to mutate (validator.validate() does when useDefaults: true)
        const result: boolean = validateFunction(config) as boolean;
        if (result) {
            return config as T;
        } else {
            if (suppressErrors) {
                console.warn({
                    msg: 'validator failed',
                    config,
                    errors: validateFunction.errors
                });
                return null;
            } else {
                console.error({
                    msg: 'validator failed',
                    config,
                    errors: validateFunction.errors
                });
                throw new TypeError(
                    'Validation of GlobResolverConfig failed: ' +
                    schemaValidator.errorsText(validateFunction.errors!)
                );
            }
        }
    }) as any
);

export const validateGlobResolverConfig = makeValidator<GlobResolverConfig>(globResolverValidator);

