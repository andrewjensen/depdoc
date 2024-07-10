# depdoc

Module dependency visualizer

## Running locally

### Step 0: Install system dependencies

- Install Rust through [Rustup](https://rustup.rs/)
- Install [NodeJS](https://nodejs.org/en)

### Step 1: Configure depdoc to read your project

Create a `depdoc-your-project-name.config.yaml`:

```yaml
title: "My App" # Human-readable title to display in the viewer
language: "typescript" # More languages coming soon
path: "/absolute/path/to/my-app"
moduleResolution:
  # Tell depdoc how to resolve modules, the same way that build tools like Webpack resolves them
  - pattern: "~/"
    replacement: "src/"
```

### Step 2: Create the graph in JSON form

In the root directory:

```bash
cargo run -- generate --config ./depdoc-your-project-name.config.yaml
```

Once this completes successfully, you will have a `graph.json` file containing nodes and edges.

### Step 3: Run the interactive visualizer

Install and run the viewer's dev server in the `viewer/` directory:

```bash
npm install
npm start
```

In a second terminal, in the root directory, run a static file server like [sfz](https://github.com/weihanglo/sfz) on port 5000, with CORS enabled. This will serve the `graph.json` file to the viewer.

(TODO: sfz has been archived, recommend a different option)

```bash
sfz --port 5000 --cors .
```

Once both servers are running, navigate to http://localhost:1234 and use the viewer.
