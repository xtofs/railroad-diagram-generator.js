# Publishing to npm

The package is published as [`abnf-to-railroad`](https://www.npmjs.com/package/abnf-to-railroad).

## Prerequisites

1. You must be logged in to npm:
   ```bash
   npm login
   ```

2. You must have publish rights to the `abnf-to-railroad` package.

## Publishing Steps

1. **Run tests** to ensure everything works:
   ```bash
   npm test
   ```

2. **Bump the version** (choose one):
   ```bash
   npm version patch   # 0.0.6 → 0.0.7 (bug fixes)
   npm version minor   # 0.0.6 → 0.1.0 (new features)
   npm version major   # 0.0.6 → 1.0.0 (breaking changes)
   ```
   This automatically creates a git commit and tag.

3. **Publish to npm**:
   ```bash
   npm publish
   ```

4. **Push to GitHub** with the version tag:
   ```bash
   git push --follow-tags
   ```

## What Gets Published

The `files` field in `package.json` controls what's included:
- `bin/` - CLI entry point
- `src/` - Source code
- `assets/` - Templates and CSS
- `README.md`
- `LICENSE`

## Verify Publication

After publishing, verify with:
```bash
npm info abnf-to-railroad
```

Or install globally to test:
```bash
npm install -g abnf-to-railroad
abnf-to-railroad --version
```