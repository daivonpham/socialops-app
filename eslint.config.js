import importPlugin from 'eslint-plugin-import'
import tseslint from 'typescript-eslint'

/**
 * Architecture boundaries (frontend-admin-architecture):
 *   shared/adapters -> shared/ui -> features -> app
 * UI kits (antd) are only reachable through shared/adapters; features consume
 * '@/shared/ui'. These rules are the automated version of that contract.
 */
const KIT_IMPORT_PATTERNS = [
  {
    group: ['antd', 'antd/*', '@ant-design/*'],
    message:
      "UI kit imports live behind the adapter layer. Import from '@/shared/ui' instead (antd is allowed only in src/shared/adapters/** and app/providers/ThemeProvider).",
  },
]

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'public/**'] },
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { import: importPlugin },
    rules: {
      'import/no-duplicates': 'error',
    },
  },
  {
    files: ['src/app/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: KIT_IMPORT_PATTERNS }],
    },
  },
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            ...KIT_IMPORT_PATTERNS,
            {
              group: ['@/shared/adapters/*'],
              message:
                "Adapters are internal to shared/ui — features import '@/shared/ui'.",
            },
            {
              group: ['@/features/*/*'],
              message:
                "No deep imports across features — use the feature's public API '@/features/<name>' (inside a feature, use relative paths).",
            },
            {
              group: ['@/app/*'],
              message:
                'Features must not depend on app/. Read scope/permissions from shared/, or let app compose props in.',
            },
          ],
        },
      ],
    },
  },
  {
    // The single sanctioned antd entry point outside adapters: the app-level
    // ThemeProvider that wires ConfigProvider + StyleProvider (task Step 3).
    files: ['src/app/providers/ThemeProvider.tsx'],
    rules: { 'no-restricted-imports': 'off' },
  },
)
