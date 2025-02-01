// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { default as ollama } from 'ollama';
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('lyubo-deepseek-test.openAiChatPanel', () => {
		const title = 'AI Chat';

		const panel = vscode.window.createWebviewPanel(
			'aiChat',
			title,
			vscode.ViewColumn.One,
			{ enableScripts: true}
		)

		const history : any[] = []

		vscode.window.showInformationMessage('Loading webview');

		panel.webview.html = 
		/*html*/
		`
			<!DOCTYPE html>
				<html lang="en">
				<head>
					<meta charset="UTF-8">
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
					<title>${title}</title>
					<style>
						.response-box {
							border: solid 2px white;
							min-height: 200px;
							margin-top: 20px;
							color: white !important;
						}

						.container {
							display: flex;
							flex-direction: column;
							gap: 10px;
						}

						.container > button {
							max-width: 100px;
						}
					</style>
				</head>
				<body>
				<div>
					<div class="container">
						<h1> ${title} VS Code Extension </h1>
						<label for="text">Send this to the chatbot</label>
						<textarea name="text" id="text" cols="40" rows="5"> </textarea>
						<button id="submit">Send</button>
					</div>

					<div class="response-box" id='response'></div>
				</div>
				</body>

				<script>
					const vscode = acquireVsCodeApi();

					document.getElementById('submit').addEventListener('click', () => {
						const text = document.getElementById('text').value;
						vscode.postMessage({command: 'chat', text});
					})

					window.addEventListener('message', (e) => {
						const {command, text} = e.data;

						if (command == 'chatResponse') {
							document.getElementById('response').innerText = text
						}
					})
				</script>
				</html>
		`

		panel.webview.onDidReceiveMessage(async (message: any) => {
			if (message.command === 'chat') {
				const userPrompt = message.text;
				let response = '';

				try {

					const streamResponse = await ollama.chat({
						model: 'llama3.1:8b',
						messages: [...history, { role: 'user', content: userPrompt}],
						stream: true,
						options: {
							num_ctx: 4096
						}
					})

					history.push({ role: 'assistant', content: userPrompt});

					for await (const part of streamResponse) {
						response += part.message.content;
						panel.webview.postMessage({ command: 'chatResponse', text: response})
					}
				} catch (e: any) {
					panel.webview.postMessage({ command: 'chatResponse', text: `Error: ${String(e.message)}`})
				}
			}
		})
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
