// Vite's `import.meta.glob`, which Vitest transforms in test files. Typed here because `vite`
// is not a direct dependency, so `vite/client` cannot be referenced from the project.
interface ImportMeta {
  glob<Module = unknown>(pattern: string | string[]): Record<string, () => Promise<Module>>;
}
