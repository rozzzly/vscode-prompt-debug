import * as ajv from 'ajv';
import GlobResolverConfigSchema from './GlobResolverConfig';
import { GlobResolverConfig } from '../Resolver/GlobResolver/config';
import { valid } from 'semver';

const validator = new ajv({
    allErrors: true,
    useDefaults: true
});

validator.addMetaSchema(require('ajv/lib/refs/json-schema-draft-06.json')); // tslint:disable-line:no-var-requires

const globResolverValidator = validator.compile(GlobResolverConfigSchema);

export function validateGlobResolver(config: object): GlobResolverConfig | null;
export function validateGlobResolver(
    config: object,
    suppressErrors: false
): GlobResolverConfig;
export function validateGlobResolver(
    config: object,
    suppressErrors: true
): GlobResolverConfig | null;
export function validateGlobResolver(
    _config: object,
    suppressErrors: boolean = true
): GlobResolverConfig | null {
    const config = { ..._config }; // clone so it's safe to mutate (validator.validate() does when useDefaults: true)
    const result: boolean = globResolverValidator(config) as boolean;
    if (result) {
        return config as GlobResolverConfig;
    } else {
        if (suppressErrors) {
            console.warn({
                msg: 'validator failed',
                config,
                errors: globResolverValidator.errors
            });
            return null;
        } else {
            console.error({
                msg: 'validator failed',
                config,
                errors: globResolverValidator.errors
            });
            throw new TypeError(
                'Validation of GlobResolverConfig failed: ' +
                    validator.errorsText(globResolverValidator.errors!)
            );
        }
    }
    //  validator.validate('GlobResolverConfig')
}
