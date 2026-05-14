import js from '@eslint/js';
import globals from 'globals';
import { defineConfig } from 'eslint/config';
import prettier from 'eslint-config-prettier';

export default defineConfig([
  // Base recommended rules
  js.configs.recommended,

  // Backend (Node.js) config
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node, // ✅ IMPORTANT FIX
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'off',
    },
  },

  // Disable ESLint rules that conflict with Prettier
  prettier,
]);
