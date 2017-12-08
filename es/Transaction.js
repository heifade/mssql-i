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
const mssql = require("mssql");
class Transaction {
    static begin(conn) {
        return __awaiter(this, void 0, void 0, function* () {
            let tran = new mssql.Transaction(conn);
            yield tran.begin(mssql_1.ISOLATION_LEVEL.READ_COMMITTED);
            return tran;
        });
    }
    static commit(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            yield transaction.commit();
        });
    }
    static rollback(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            yield transaction.rollback();
        });
    }
}
exports.Transaction = Transaction;
//# sourceMappingURL=Transaction.js.map