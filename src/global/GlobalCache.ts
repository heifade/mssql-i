const globalCacheHashKey = "MSSQL-i-GlobalCacheHash";

export class GlobalCache {
  private static getGlobalHash() {
    let globalCacheHash = Reflect.get(global, globalCacheHashKey);
    if (!globalCacheHash) {
      globalCacheHash = {};
      Reflect.set(global, globalCacheHashKey, globalCacheHash);
    }
    return globalCacheHash;
  }

  public static get(key: string) {
    return GlobalCache.getGlobalHash()[key];
  }
  public static set(key: string, value: any) {
    GlobalCache.getGlobalHash()[key] = value;
  }
}
