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
class Exec {
    static exec(conn, sql) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield conn.request().query(sql);
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
    static execsSeq(conn, sqls) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let sql of sqls) {
                yield Exec.exec(conn, sql);
            }
        });
    }
}
exports.Exec = Exec;
//# sourceMappingURL=Exec.js.map