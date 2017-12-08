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
class Procedure {
    static exec(conn, pars, tran) {
        return __awaiter(this, void 0, void 0, function* () {
            let database = pars.database || Utils_1.Utils.getDataBaseFromConnection(conn);
            let procedure = pars.procedure;
            if (!procedure) {
                return Promise.reject(new Error(`pars.procedure can not be null or empty!`));
            }
            let data = pars.data;
            let schemaModel = yield Schema_1.Schema.getSchema(conn, database);
            let procedureSchemaModel = schemaModel.getProcedureSchemaModel(procedure);
            if (!procedureSchemaModel) {
                return Promise.reject(new Error(`procedure '${procedure}' is not exists!`));
            }
            let procedureName = Utils_1.Utils.getDbObjectName(database, pars.chema, procedure);
            let parSQL = "";
            let request;
            if (tran) {
                request = new mssql_1.Request(tran);
            }
            else {
                request = conn.request();
            }
            if (data) {
                Reflect.ownKeys(data).map((key, index) => {
                    let par = procedureSchemaModel.pars.filter(par => par.name === key.toString().replace(/^@/, ""))[0];
                    if (par) {
                        if (par.parameterMode === "out") {
                            parSQL += `${par.name},`;
                            request.output(`${par.name}`, mssql_1.VarChar);
                        }
                        else {
                            parSQL += `${par.name},`;
                            request.input(`${par.name}`, Reflect.get(data, par.name));
                        }
                    }
                });
                parSQL = parSQL.replace(/\,$/, "");
            }
            let sql = `${procedureName}`;
            let result = yield request.execute(sql);
            return result;
        });
    }
}
exports.Procedure = Procedure;
//# sourceMappingURL=Procedure.js.map