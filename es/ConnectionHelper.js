"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mssql_1 = require("mssql");
class ConnectionHelper {
    static create(connConfig) {
        let pool = new mssql_1.ConnectionPool(connConfig);
        return pool.connect();
    }
    static close(conn) {
        return conn.close();
    }
}
exports.ConnectionHelper = ConnectionHelper;
//# sourceMappingURL=ConnectionHelper.js.map