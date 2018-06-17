import { SemVer, Range as SemVerRange } from 'semver';
import { Constructor } from '../misc';

export type skillful = typeof skillful;
export const skillful: unique symbol = Symbol.for('@rozzzly/skillful');

function canLearnSkills(value: any) {
    return (
        !!value
            &&
        !Object.isFrozen(value)
    );
}

type ExtractSkillInterface<S extends Skill> = (
    (S extends Skill<infer I>
        ? I
        : never
    )
);

export function createNamedFunction<F extends Function>(name: string, func: F): F {
    const wrapper = {
        [name]: (...args: any[]) => func(...args)
    };
    return wrapper[name] as any;
}

export interface Skill<I extends {} = {}, H extends {} = {}, SkillName extends string = string> {
    name: SkillName;
    version: SemVer;
    prerequisites: PrerequisiteSkill<any>[];
    toString(): string;
    getHandle<B extends I>(value: B): H;
    teach<B>(value: B): value is (B & I);
    teach<B>(value: B, force: boolean): value is (B & I);
    teach<B>(value: B, force?: boolean): value is (B & I);
}

export const nominalMentor = <T, I extends {} = {}>(student: T): (T & I) => student as any;
export function defineSkill<I extends {}, SkillName extends string, H extends {} = {}>(
    name: SkillName,
    version: SemVer | string,
): Skill<I, H, SkillName>;
export function defineSkill<I extends {}, H extends {}, SkillName extends string>(
    name: SkillName,
    version: SemVer | string,
    defineHandle: <V>(value: V) => H
): Skill<I, H, SkillName>;
export function defineSkill<I extends {}, H extends {}, SkillName extends string>(
    name: SkillName,
    version: SemVer | string,
    defineHandle: <V>(value: V) => H,
    mentor: <V>(student: V) => V & I
): Skill<I, H, SkillName>;
export function defineSkill<I extends {}, H extends {}, SkillName extends string>(
    name: SkillName,
    version: SemVer | string,
    defineHandle: <V>(value: V) => H,
    mentor: <V>(student: V) => V & I,
    prerequisites: SkillRequirement[]
): Skill<I, H, SkillName>;
export function defineSkill<I extends {}, H extends {}, SkillName extends string>(
    name: SkillName,
    version: SemVer | string = '0.0.0',
    defineHandle: <V>(value: V) => H = (value): H => ({} as H),
    mentor: <T>(student: T) => (T & I) = nominalMentor as any,
    prerequisites: SkillRequirement[] = []
): Skill<I, H, SkillName> {

    return {
        name,
        prerequisites: [],
        version: new SemVer(version),
        toString(): string {
            return `${name}@${version.toString()}`;
        },
        getHandle(value: any): H {
            
        }
        teach<B>(value: B, force: boolean = false): value is (B & I) {
            if (value[skillful]) {

            }
            return false;
        }

    };
}

export function teach<S extends Skill<any, any>, B extends {}>(skill: S, value: B): B & ExtractSkillInterface<S>;
export function teach<S extends Skill<any, any>, B extends {}>(skill: S, value: B, force: boolean): B & ExtractSkillInterface<S>;
export function teach<S extends Skill<any, any>, B extends {}>(skill: S, value: B, force: boolean = false): B & ExtractSkillInterface<S> {
    const target: any = value;
    if (!target[skillful] || !Array.isArray(target[skillful])) {
        Object.defineProperty(target, skillful, {
            value: [],
            enumerable: false,
        });
        if (!target[skillful] || !Array.isArray(target[skillful])) {
            throw new Error(); /// TODO ::: can't mutate it (it's either not extensible or sealed/frozen, or a primitive)
        }
    }
    const skillset = target[skillful];
    if (force || skill.prerequisites.length > 0) {
        skill.prerequisites.forEach(requiredSkill => {
            if (typeof requiredSkill === 'string') {

            }
        });
    }
    return value as any;
}

export type SkillRequirement = (
    | {
        name: string
        version: SemVerRange | string;
    }
    | string
);

interface CanRun {
    run(): void;
}
interface CanDie {
    die(): boolean;
}
const Runnable = defineSkill('Runnable', '4.0.0';
const Killable = defineSkill('Runnable', '4.0.0');

if (Runnable.teach(derp)) {
    derp.run();
    Runnable.getHandle()
}


export const enum BErrorSeverity {
    fatal,
    warning,
    notice,
    info
}

export const ansiStyleRegex: RegExp = /(\u001b\[(?:\d+;)*\d+m)/u;
export const stripAnsiEscapes = (str: string): string => (
    str.split(ansiStyleRegex).reduce((reduction, part) => (
        ((ansiStyleRegex.test(part))
            ? reduction
            : reduction + part
        )
    ), '')
);