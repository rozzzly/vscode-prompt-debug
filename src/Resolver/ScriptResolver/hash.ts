import { Uri, ExtensionContext } from 'vscode';
import { LooseUri } from '../../fsTools';
import { isArray } from 'util';
import { isCaseInsensitive } from '../../compat';

const HISTORY_LIMIT: number = 25;
const HISTORY_KEY: string = 'AutoResolver:hashStore';

export interface ScriptHash {
    uri: Uri;
    mtime: number;
    hash: string;
}
export interface ScriptHashRecord  extends ScriptHash {
    lastUse: number;
}

export type ParsedScriptHash =  (
    & Pick<
        ScriptHashRecord,
        Exclude<
            keyof ScriptHashRecord,
            'uri'
        >
    >
    & {
        uri: string
    }
);

const serialize = (hashes: ScriptHashRecord[]): string => (
    JSON.stringify((hashes)
        .map(h => ({
            ...h,
            uri: h.uri.toString()
        }))
        .sort((a, b) => b.lastUse - a.lastUse)
        .slice(0, HISTORY_LIMIT)
    )
);

function parse(serialized: string): ScriptHashRecord[] {
    let deserialized: ParsedScriptHash[];
    try {
        deserialized = JSON.parse(serialized);
    } catch (e) {
        console.log('failed to parse json', e);
        return [];
    }
    if (!Array.isArray(deserialized)) {
        console.log('Unexpected stored value!', deserialized);
        return [];
    } else {
        return deserialized.map(h => ({
            ...h,
            uri: Uri.parse(h.uri)
        }));
    }
}

function getIndex(hashes: ScriptHashRecord[], resource: ScriptHash): number | null;
function getIndex(hashes: ScriptHashRecord[], _resource: ScriptHash): number | null {
    const resource = (isCaseInsensitive) ? _resource.uri.toString() : _resource.uri.toString().toLowerCase();
    const idx = hashes.findIndex(((isCaseInsensitive)
        ? (hash => (
            resource === hash.uri.toString().toLowerCase()
        ))
        : (hash => (
            resource === hash.uri.toString()
        ))
    ));
    if (idx === -1) {
        return null;
    } else {
        return idx;
    }
}
export function isFresh(context: ExtensionContext, resource: ScriptHash): boolean {
    const stored = context.globalState.get<string | null>(HISTORY_KEY, null);
    if (stored === null) {
        return true;
    } else {
        const hashes: ScriptHashRecord[] = parse(stored);
        const idx = getIndex(hashes, resource);
        if (idx === null) {
            return true;
        } else {
            const hash = hashes[idx];
            return !!(
                hash.hash === resource.hash
                &&
                hash.mtime === resource.mtime
            );
        }
    }
}

export function store(context: ExtensionContext, resource: ScriptHash): void {
    const stored = context.globalState.get<string | null>(HISTORY_KEY, null);
    const hashes: ScriptHashRecord[] = ((stored === null)
        ? []
        : parse(stored)
    );
    const idx = getIndex(hashes, resource);
    if (idx !== null) {
        hashes.splice(idx, 1);
    }
    const serialized = serialize([{...resource, lastUse: Date.now() }, ...hashes]);
    context.globalState.update(HISTORY_KEY, serialized);
}