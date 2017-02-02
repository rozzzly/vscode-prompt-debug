# VS Prompt Debug

Extension that allows you quickly launch a vscode debug session for a file of your choosing.


### Setup

The setup is quite simple. Simply put `${command.prompt-debug.resolve}` in the `"program"` field
of one of the configurations you specify in your `.vscode/launch.json`. When you start a debug session, vscode will
trigger the extension which prompts the user for what file to supply to the debug field.

Example `.vscode/launch.json` snippet:
```json

{
    "type": "node",
    "request": "launch",
    "name": "Launch Program",
    "program": "${command.prompt-debug.resolve}",
    "cwd": "${workspaceRoot}"
}

```


**Bonus:** ava test runner debug config

<details>
    <summary>
    [ ... Click to Expand ... ]
    </summary>

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "debug(node2/launch)",
            "type": "node2",
            "request": "launch",
            "program": "${workspaceRoot}/node_modules/ava/profile.js",
            "cwd": "${workspaceRoot}",
            "runtimeArgs": [ ],

            "args": [
                "--verbose",
                "${command.prompt-debug.resolve}"
            ],
            "env": {
                "NODE_ENV": "development"
            },
            "smartStep": true,
            "sourceMaps": true,
            "internalConsoleOptions": "openOnSessionStart",
            "stopOnEntry": false
        }
    ]
}
```

</details>


Uses the method outlined by [@weinand](https://github.com/weinand) in [Microsoft/vscode#9544](https://github.com/Microsoft/vscode/issues/9544)