"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Utils {
    static getDbObjectName(database, chema, objectName) {
        if (!database && !chema) {
            return `[${objectName}]`;
        }
        else if (!chema) {
            return `[${database}]..[${objectName}]`;
        }
        else if (!database) {
            return `[${chema}].[${objectName}]`;
        }
        return `[${database}].[${chema}].[${objectName}]`;
    }
    static getDataBaseFromConnection(conn) {
        let config = Reflect.get(conn, "config");
        return config.database;
    }
}
exports.Utils = Utils;
//# sourceMappingURL=Utils.js.map