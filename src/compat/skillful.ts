import { SemVer, Range as SemVerRange } from 'semver';

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

export interface Skill<I extends {} = {}, H extends {} = {}, SkillName extends string = string> {
    name: SkillName;
    version: SemVer;
    prerequisites: PrerequisiteSkill<any>[];
    toString(): string;
    getHandle<B extends I>(value: B): H;
    can<B>(value: B): value is (B & I);
    teach<B>(value: B): value is (B & I);
    teach<B>(value: B, force: boolean): value is (B & I);
    teach<B>(value: B, force?: boolean): value is (B & I);
}

export const nominalMentor = <T, I extends {} = {}>(student: T): (T & I) => student as any;
export function defineSkill<SkillName extends string, H extends {}, I extends {} = {}>(
    name: SkillName,
    version: SemVer | string,
): Skill<I, H, SkillName>;
export function defineSkill<SkillName extends string, H extends {}, I extends {} = {}>(
    name: SkillName,
    version: SemVer | string,
    defineHandle: <V>(value: V) => H
): Skill<I, H, SkillName>;
export function defineSkill<SkillName extends string, H extends {}, I extends {} = {}>(
    name: SkillName,
    version: SemVer | string,
    defineHandle: <V>(value: V) => H,
    mentor: <V>(student: V) => V & I
): Skill<I, H, SkillName>;
export function defineSkill<SkillName extends string, H extends {}, I extends {} = {}>(
    name: SkillName,
    version: SemVer | string,
    defineHandle: <V>(value: V) => H,
    mentor: <V>(student: V) => V & I,
    prerequisites: SkillRequirement[]
): Skill<I, H, SkillName>;
export function defineSkill<SkillName extends string, H extends {}, I extends {} = {}>(
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
        can<B>(value: B): value is (B & I) {
            return false;
        },
        teach<B>(value: B, force: boolean = false): value is (B & I) {
            return false;
        }

    };
}
export interface PrerequisiteSkill<S extends Skill<any, any>> {
    name: S['name'];
    version: SemVerRange;
    satisfies(value: any): value is ExtractSkillInterface<S>;
}
export type SkillRequirement = (
    | PrerequisiteSkill<Skill<any, any>>
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