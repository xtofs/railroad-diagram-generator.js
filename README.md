# ABNF to Railroad Diagram Generator

A command-line tool that converts ABNF (Augmented Backus-Naur Form) grammar files to HTML pages with embedded SVG railroad diagrams.

## Example Output

Here's an example railroad diagram for a rule that one might find in a JSON-like grammar:

![Example Railroad Diagram](assets/example-diagram.svg)

## Features

- **Standalone SVG Generation**: Renders railroad diagrams as static SVG without browser dependencies
- **ABNF Parser**: Full support for ABNF syntax including alternatives, sequences, optionals, and repetitions
- **HTML Templates**: Uses Handlebars for clean, maintainable HTML generation
- **CLI Interface**: Simple command-line interface with npm script integration
- **Static HTML Generation**: Generate clean HTML with embedded SVG diagrams

## Installation

```bash
npm install
```

## Usage

### Basic Usage

Convert an ABNF file to HTML:

```bash
npm run generate input.abnf
```

This creates `input.html` with embedded SVG diagrams.

### Specify Output File

```bash
npm run generate input.abnf output.html
```

### CLI Commands

The tool provides several CLI commands:

```bash
# Generate static HTML with embedded SVG
node bin/cli.js generate input.abnf [output.html]

# List all rules in an ABNF file
node bin/cli.js list input.abnf

# Set custom document title
node bin/cli.js generate input.abnf --title "My Grammar"
```

## ABNF Format Support

The parser supports standard ABNF syntax as defined in RFC 5234:

- **Rule definitions**: `rule = definition`
- **Alternatives**: `rule = option1 / option2 / option3`
- **Sequences**: `rule = element1 element2 element3`
- **Optional elements**: `rule = element1 [optional] element2`
- **Repetition**: `rule = *element` or `1*element` or `1*5element`
- **Grouping**: `rule = (group1 / group2) element`
- **Terminal strings**: `rule = "literal"` or `'literal'`
- **Comments**: `; This is a comment`

## Project Structure

```plain
├── bin/
│   └── cli.js              # Command-line interface
├── src/
│   ├── index.js           # Main application logic
│   ├── abnf-parser.js     # ABNF parser implementation
│   ├── svg-renderer.js    # Standalone SVG diagram renderer
│   └── html-generator.js  # HTML template generator with Handlebars
├── assets/
│   └── diagram.css        # CSS styles for railroad diagrams
├── test/
│   ├── simple.abnf        # Test ABNF file
│   └── test.js           # Test suite
└── package.json
```

## Output

The generated HTML includes:

- **Clean Structure**: Same layout as reference implementations with `<div class="syntax-rule">` containers
- **Embedded SVG**: Static SVG diagrams generated server-side
- **Responsive Design**: CSS that works across different screen sizes
- **Semantic HTML**: Proper heading hierarchy and code elements

### Example Output Structure

```html
<div class="syntax-rule" id="syntax-rule-expression">
    <h2>expression</h2>
    <p><code>expression := term ["+" expression]</code></p>
    <div class="diagram-container">
        <svg width="..." height="..." viewBox="...">
            <!-- SVG railroad diagram content -->
        </svg>
    </div>
</div>
```

## Dependencies

- **commander**: CLI argument parsing
- **fs-extra**: Enhanced file system operations
- **handlebars**: HTML templating

## License

MIT
