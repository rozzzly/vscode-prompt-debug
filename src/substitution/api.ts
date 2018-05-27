import { Uri } from 'vscode';
import { getOpenFiles, getActiveFileUri } from '../compat';

export interface SubstitutionContext<D extends {} = {}> {
    activeFile: Uri | null;
    openFiles: Uri[];
    visibleFiles: Uri[];
    data: D;
}

export interface Substitution<D extends {} = {}> {
    pattern: string | RegExp;
    identifier: string;
    resolver(ctx: SubstitutionContext<D>, ...value: string[]): string | Promise<string>;
}

export interface SimpleSubstitution<D extends {} = {}> extends Substitution<D> {
    pattern: string;
    resolver(ctx: SubstitutionContext<D>): string | Promise<string>;
}

export interface ParameterizedSubstitution<D extends {} = {}> extends Substitution<D> {
    pattern: RegExp;
    resolver(ctx: SubstitutionContext<D>, ...value: string[]): string | Promise<string>;
}

export const isSimple = (value: any): value is SimpleSubstitution => typeof value.pattern === 'string';
export const isParameterized = (value: any): value is ParameterizedSubstitution => value.pattern instanceof RegExp;

export function createContext<D extends {} = {}>(): SubstitutionContext<D>;
export function createContext<D extends {} = {}>(overrides: Partial<SubstitutionContext<D>>): SubstitutionContext<D>;
export function createContext<D extends {} = {}>(overrides: Partial<SubstitutionContext<D>> = {}): SubstitutionContext<D> {
    const { data, ...extra } = overrides as any;
    return {
        openFiles: getOpenFiles(),
        activeFile: getActiveFileUri(),
        visibleFiles: getOpenFiles(true),
        ...extra,
        data: ((data)
            ? data
            : {}
        )
    };
}

export const createVariations = (substitutions: Substitution[], mutations: Record<string, Substitution>): Substitution[] => (
    substitutions.reduce((reduction, sub) => (
        ((mutations[sub.identifier])
            ? [...reduction, mutations[sub.identifier]]
            : reduction
        )
    ), [])
);