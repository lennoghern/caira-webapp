// The one Vite feature the harness uses. `vite/client` types are not reachable
// from this package: Vite is installed only as a peer of the test tooling.
interface ImportMeta {
  glob<T>(pattern: string, options: { eager: true }): Record<string, T>;
}
