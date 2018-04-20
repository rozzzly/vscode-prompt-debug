import { Substitution, defaultSubstitutions } from '../substitution';
export interface PatternResolver {
    inPattern: string;
    baseDir: string;
    outPattern: string;
}

const substitutions: Substitution[] = [
    ...defaultSubstitutions,
    substitutions(): derp {        
    }
]