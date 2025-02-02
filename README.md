
# npm Package Dependency Explorer

## Overview

The npm Package Dependency Explorer is a graphical tool designed to help developers visualize and explore the dependencies of npm packages. This tool provides an interactive interface to understand the relationships and hierarchies within the npm ecosystem.

## Features

- Visual representation of npm package dependencies
- Interactive graph with zoom and pan capabilities
- Search functionality to find specific packages
- Detailed information on each package and its dependencies

## Installation

To install the npm Package Dependency Explorer, follow these steps:

1. Clone the repository:
   ```bash
   git clone https://github.com/pasiones/npm-dependency-explorer.git
   ```

2. Navigate to the project directory:
   ```bash
   cd npm-dependency-explorer
   ```

3. Install the required dependencies:
   ```bash
   npm install
   ```

## Usage

To start the tool, run the following command:
```bash
npm run dev
```

Once the tool is running, navigate to localhost given in the terminal. You will be presented with the graphical interface of the npm Package Dependency Explorer.

Currently, the tool reads a json file which can be obtained by running the following command:
```bash
npm list --all --json > directory/where/you/want/to/save/your/file/dependencies.json
```
After obtaining the json file, place it in the public folder and replace the default file. The default file is the dependencies network of this project.

### Exploring Dependencies

1. **Search for a Package**: Use the search bar to find a specific npm package. (Not yet developed)
2. **View Dependencies**: Click on a package node to view its dependencies and related information. (Not yet developed)
3. **Navigate the Graph**: Use the mouse to zoom and pan around the graph to explore different parts of the dependency tree.




