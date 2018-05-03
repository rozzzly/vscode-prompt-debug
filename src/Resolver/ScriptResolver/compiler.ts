import * as ts from 'typescript';

let compiler: null | ts.CompilerHost = null;

export function getCompiler() {
    if (compiler) return compiler;
    else {
        compiler = ts.createCompilerHost({
            allowJs: true,
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES5,
            inlineSourceMap: true,
            inlineSources: true
        });
        return compiler;
    }
}