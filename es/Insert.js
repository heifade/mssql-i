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
const Utils_1 = require("./util/Utils");
class Insert {
    static insert(conn, pars, tran) {
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
            let tableName = Utils_1.Utils.getDbObjectName(database, pars.chema, table);
            let fields = "";
            let values = "";
            let request;
            if (tran) {
                request = new mssql_1.Request(tran);
            }
            else {
                request = conn.request();
            }
            let haveAutoIncrement = false;
            tableSchemaModel.columns.map(column => {
                if (column.autoIncrement) {
                    haveAutoIncrement = true;
                }
            });
            data.keys().map((key, index) => {
                let column = tableSchemaModel.columns.filter(column => column.columnName === key.toString())[0];
                if (column) {
                    if (!column.autoIncrement) {
                        fields += `${column.columnName},`;
                        values += `@${column.columnName},`;
                    }
                    request.input(column.columnName, data.get(column.columnName));
                }
            });
            fields = fields.replace(/\,$/, "");
            values = values.replace(/\,$/, "");
            let sql = `insert into ${tableName}(${fields}) values(${values})`;
            if (haveAutoIncrement) {
                sql += ";select @@IDENTITY as insertId";
            }
            let result = yield request.query(sql);
            let returnValue = {};
            if (haveAutoIncrement) {
                Reflect.set(returnValue, "insertId", result.recordset[0]["insertId"]);
            }
            return returnValue;
        });
    }
}
exports.Insert = Insert;
//# sourceMappingURL=Insert.js.map