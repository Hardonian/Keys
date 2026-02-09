# Hello World Pack

A simple example pack demonstrating the Keys pack format.

## Usage

```bash
# Add this pack to your workspace
keys add ./examples/hello-world

# List your packs
keys list

# Run the hello action
keys run hello-world hello
```

## Actions

### hello

Prints a greeting to the console.

```bash
keys run hello-world hello
# Output: Hello from Keys!
```

### info

Display pack documentation.

```bash
keys run hello-world info
```

## Pack Structure

```
hello-world/
├── keys.pack.json    # Pack manifest (required)
├── README.md         # This file
├── prompts/          # Prompt templates
│   └── greet.md
└── assets/           # Static assets
    └── config.json
```

## Creating Your Own Pack

1. Create a directory for your pack
2. Add a `keys.pack.json` manifest:

```json
{
  "id": "my-pack",
  "name": "My Pack",
  "version": "1.0.0",
  "description": "What this pack does",
  "tags": ["tag1", "tag2"],
  "actions": [
    {
      "name": "my-action",
      "kind": "shell",
      "command": "echo",
      "args": ["Hello!"]
    }
  ]
}
```

3. Register with Keys:

```bash
keys add ./my-pack
```
