# React + TypeScript + Vite

Run command
cd /Users/chelseyxiao/Documents/AI/Aqalix/Marsh\ POC/Rocky/app
npm install
npm run dev -- --host 0.0.0.0

http://localhost:5173/


Main UI controller
The actual screen logic is in App.tsx.

That file is responsible for:
  the overall app layout
  the route setup
  each page:
  Deals dashboard
  New deal form
  Processing screen
  Review screen
  Export screen

The mock data that feeds the UI is in:
  mockData.ts
And the data/service layer is in:
  dealService.ts
  processingService.ts

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
