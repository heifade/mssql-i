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
class Exec {
    static exec(conn, sql, tran) {
        return __awaiter(this, void 0, void 0, function* () {
            let request;
            if (tran) {
                request = new mssql_1.Request(tran);
            }
            else {
                request = conn.request();
            }
            yield request.query(sql);
            return true;
        });
    }
    static execs(conn, sqls) {
        return __awaiter(this, void 0, void 0, function* () {
            let promiseList = new Array();
            sqls.map(sql => {
                promiseList.push(Exec.exec(conn, sql));
            });
            return yield Promise.all(promiseList);
        });
    }
    static execsSeq(conn, sqls, tran) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let sql of sqls) {
                yield Exec.exec(conn, sql, tran);
            }
        });
    }
}
exports.Exec = Exec;
//# sourceMappingURL=Exec.js.map