import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig } from 'eslint/config'

const reactHooksRules = reactHooks.configs['recommended-latest']?.rules ?? {}
const reactRefreshRules = reactRefresh.configs.vite?.rules ?? {}

export default defineConfig([
  {
    ignores: ['dist', 'coverage', 'coverage/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooksRules,
      ...reactRefreshRules,
    },
  },
])
