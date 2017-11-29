const globalCacheHashKey = "GlobalCacheHash";

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
    return Reflect.get(GlobalCache.getGlobalHash(), key);
  }
  public static set(key: string, value: any) {
    Reflect.set(GlobalCache.getGlobalHash(), key, value);
  }
}
