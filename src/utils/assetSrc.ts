export function assetSrc(mod: string | { src: string }): string {
  return typeof mod === "string" ? mod : mod.src;
}
