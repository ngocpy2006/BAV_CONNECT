import js from '@eslint/js';
import next from '@next/eslint-plugin-next';
import prettier from 'eslint-config-prettier';
import { defineConfig, globalIgnores } from 'eslint/config';
import hooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['.next/**', 'coverage/**', 'next-env.d.ts']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      next.configs['core-web-vitals'],
      hooks.configs.flat.recommended,
      prettier,
    ],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
]);
