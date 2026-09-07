// Allow plain TypeScript tooling to resolve Vue single-file component imports.
// vue-tsc provides the component-specific types when checking the tests.
declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent<Record<string, unknown>>
  export default component
}
