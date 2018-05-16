/**
 * #!/usr/bin/env bash
 *
 * ROOT_DIR=$(cd -P -- "$(dirname -- "$0")/.." && pwd -P)
 * GEN_BIN="$ROOT_DIR/node_modules/.bin/ts-json-schema-generator"
 * FORMAT_BIN="$ROOT_DIR/node_modules/.bin/prettier"

 * TYPES=(
 *     "GlobResolverConfig"
 * )
 *
 * for TYPE in "${TYPES[@]}"
 * do
 *     rm -fr $ROOT_DIR/src/configSchema/$TYPE.ts
 *     rm -fr $ROOT_DIR/src/configSchema/$TYPE.ts.tmp
 *     echo 'export default {};' >> $ROOT_DIR/src/configSchema/$TYPE.ts
 *     echo 'export default ' >> $ROOT_DIR/src/configSchema/$TYPE.ts.tmp
 *     eval "$GEN_BIN --path $ROOT_DIR/tsconfig.json --type $TYPE >> $ROOT_DIR/src/configSchema/$TYPE.ts.tmp"
 *     echo ';' >> $ROOT_DIR/src/configSchema/$TYPE.ts.tmp
 *     rm -fr $ROOT_DIR/src/configSchema/$TYPE.
 *     mv $ROOT_DIR/src/configSchema/$TYPE.ts.tmp $ROOT_DIR/src/configSchema/$TYPE.ts
 * done
 *
 * eval "$FORMAT_BIN --single-quote --tab-width 4 --write $ROOT_DIR/src/configSchema/*.ts"
 *
 *
 * ### TODO
 * ## @see https: *code.visualstudio.com/docs/extensionAPI/extension-points#_contributesjsonvalidation
 */

const exportedTypes: string[] = [
    'GlobResolverConfig'
];