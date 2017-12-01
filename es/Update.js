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
class Update {
    static update(conn, pars, tran) {
        return __awaiter(this, void 0, void 0, function* () {
            let database = pars.database || Utils_1.Utils.getDataBaseFromConnection(conn);
            let data = pars.data;
            if (!data) {
                return Promise.reject(new Error(`pars.data can not be null or empty!`));
            }
            let table = pars.table;
            if (!table) {
                return Promise.reject(new Error(`pars.table can not be null or empty!`));
            }
            let schemaModel = yield Schema_1.Schema.getSchema(conn, database);
            let tableSchemaModel = schemaModel.getTableSchemaModel(table);
            if (!tableSchemaModel) {
                return Promise.reject(new Error(`table '${table}' is not exists!`));
            }
            let request;
            if (tran) {
                request = new mssql_1.Request(tran);
            }
            else {
                request = conn.request();
            }
            let fieldSQL = ` `;
            let whereSQL = ``;
            data.keys().map((key, index) => {
                let column = tableSchemaModel.columns.filter(column => column.columnName === key.toString())[0];
                if (column) {
                    let colName = column.columnName;
                    if (column.primaryKey) {
                        whereSQL += ` ${colName} = @wpar${colName} and`;
                        request.input(`wpar${colName}`, data.get(colName));
                    }
                    else {
                        fieldSQL += ` ${colName} = @fpar${colName},`;
                        request.input(`fpar${colName}`, data.get(colName));
                    }
                }
            });
            fieldSQL = fieldSQL.trim().replace(/\,$/, "");
            if (whereSQL) {
                whereSQL = ` where ` + whereSQL.replace(/and$/, "");
            }
            let tableName = Utils_1.Utils.getDbObjectName(database, pars.chema, table);
            let sql = `update ${tableName} set ${fieldSQL} ${whereSQL}`;
            return yield request.query(sql);
        });
    }
    static updateByWhere(conn, pars, tran) {
        return __awaiter(this, void 0, void 0, function* () {
            let database = pars.database || Utils_1.Utils.getDataBaseFromConnection(conn);
            let data = pars.data;
            if (!data) {
                return Promise.reject(new Error(`pars.data can not be null or empty!`));
            }
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
            let request;
            if (tran) {
                request = new mssql_1.Request(tran);
            }
            else {
                request = conn.request();
            }
            let fieldSQL = ` `;
            data.keys().map((key, index) => {
                let column = tableSchemaModel.columns.filter(column => column.columnName === key.toString())[0];
                if (column) {
                    let colName = column.columnName;
                    fieldSQL += ` ${colName} = @fpar${colName},`;
                    request.input(`fpar${colName}`, data.get(colName));
                }
            });
            fieldSQL = fieldSQL.trim().replace(/\,$/, "");
            let { whereSQL, wherePars } = Where_1.Where.getWhereSQL(where, tableSchemaModel);
            Reflect.ownKeys(wherePars).map(m => {
                request.input(m.toString(), Reflect.get(wherePars, m));
            });
            let tableName = Utils_1.Utils.getDbObjectName(database, pars.chema, table);
            let sql = `update ${tableName} set ${fieldSQL} ${whereSQL}`;
            return yield request.query(sql);
        });
    }
}
exports.Update = Update;
//# sourceMappingURL=Update.js.map