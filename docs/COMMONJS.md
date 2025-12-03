# VS Code Configuration

This project includes VS Code workspace configuration to suppress various warnings and provide better IntelliSense support.

## Files

- **`.vscode/settings.json`** - Main workspace settings
- **`.vscode/css-custom-data.json`** - Custom CSS property definitions for SVG attributes
- **`jsconfig.json`** - JavaScript project configuration for IntelliSense

## Suppressions

### TypeScript/JavaScript
- Disables `ts(80001)` "convert to ES module" warnings (we intentionally use CommonJS)
- Reduces TypeScript interference in JavaScript files

### CSS
- Recognizes SVG attributes (`rx`, `ry`) as valid CSS properties
- Suppresses browser compatibility warnings for SVG-specific properties

## Manual suppression:

If you still see `ts(80001)` warnings in specific files, add this comment at the top:

```javascript
// @ts-ignore ts(80001)
```

Or to disable all TypeScript checking for a file:

```javascript
// @ts-nocheck
```

## Why CommonJS?

- Compatibility with Node.js without requiring build steps
- Simpler for CLI tools and direct execution
- Consistent with existing ecosystem tooling
- No transpilation needed for deployment