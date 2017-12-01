"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mssql_1 = require("mssql");
const Schema_1 = require("./schema/Schema");
const Where_1 = require("./util/Where");
const Utils_1 = require("./util/Utils");
class Delete {
    static delete(conn, pars, tran) {
        return __awaiter(this, void 0, void 0, function* () {
            let database = pars.database;
            let where = pars.where;
            let table = pars.table;
            if (!table) {
                return Promise.reject(new Error(`pars.table can not be null or empty!`));
            }
            let schemaModel = yield Schema_1.Schema.getSchema(conn, database);
            let tableSchemaModel = schemaModel.getTableSchemaModel(table);
            if (!tableSchemaModel) {
                return Promise.reject(new Error(`table '${table}' is not exists!`));
            }
            let { whereSQL, whereList, wherePars } = Where_1.Where.getWhereSQL(where, tableSchemaModel);
            let tableName = Utils_1.Utils.getDbObjectName(database, pars.chema, table);
            let sql = `delete from ${tableName} ${whereSQL}`;
            let request;
            if (tran) {
                request = new mssql_1.Request(tran);
            }
            else {
                request = conn.request();
            }
            Reflect.ownKeys(wherePars).map(m => {
                request.input(m.toString(), Reflect.get(wherePars, m));
            });
            return yield request.query(sql);
        });
    }
}
exports.Delete = Delete;
//# sourceMappingURL=Delete.js.map