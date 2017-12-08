"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globalCacheHashKey = "GlobalCacheHash";
class GlobalCache {
    static getGlobalHash() {
        let globalCacheHash = Reflect.get(global, globalCacheHashKey);
        if (!globalCacheHash) {
            globalCacheHash = {};
            Reflect.set(global, globalCacheHashKey, globalCacheHash);
        }
        return globalCacheHash;
    }
    static get(key) {
        return Reflect.get(GlobalCache.getGlobalHash(), key);
    }
    static set(key, value) {
        Reflect.set(GlobalCache.getGlobalHash(), key, value);
    }
}
exports.GlobalCache = GlobalCache;
//# sourceMappingURL=GlobalCache.js.map