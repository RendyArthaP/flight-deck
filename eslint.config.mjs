import withNuxt from './.nuxt/eslint.config.mjs'
import prettier from 'eslint-config-prettier'
export default withNuxt(
  { ignores: ['coverage/**', 'playwright-report/**', 'test-results/**'] },
  prettier,
)
