import * as vscode from 'vscode';

const initialConfigurations = {
	version: '0.2.0',
	configurations: [
	{
		type: 'mock',
		request: 'launch',
		name: 'Mock-Debug',
		program: '${workspaceRoot}/${command.AskForProgramName}',
		stopOnEntry: true
	}
]}

export function activate(context: vscode.ExtensionContext) {

	const disposable = vscode.commands.registerCommand('extension.mock-debug.getProgramName', config => {
		return vscode.window.showInputBox({
			placeHolder: "Please enter the name of a markdown file in the workspace folder",
			value: "readme.md"
		});
	});
	context.subscriptions.push(disposable);
}

export function deactivate() { }
