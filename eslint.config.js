import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // Data fetching on mount is a legit pattern here; the compiler-era rule
      // flags it because loaders flip `loading` synchronously inside the effect.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    // Context providers export their hooks alongside the provider component,
    // which is fine for this app.
    files: ['src/contexts/*.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
