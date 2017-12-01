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
const RowDataModel_1 = require("./model/RowDataModel");
const SelectParamsModel_1 = require("./model/SelectParamsModel");
const SplitPageResultModel_1 = require("./model/SplitPageResultModel");
let readListFromResult = (result) => {
    return result.map((h) => {
        let item = new RowDataModel_1.RowDataModel();
        return Object.assign(item, h);
    });
};
class Select {
    static selectBase(conn, param) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = param.sql;
            let request = conn.request();
            if (param.where) {
                param.where.map((w, index) => {
                    request.input(`wpar${index}`, w);
                    sql = sql.replace("?", `@wpar${index}`);
                });
            }
            return yield request.query(sql);
        });
    }
    static select(conn, param) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = yield Select.selectBase(conn, param);
            return yield readListFromResult(result.recordset);
        });
    }
    static selects(conn, params) {
        return __awaiter(this, void 0, void 0, function* () {
            let promises = new Array();
            params.map(param => {
                promises.push(Select.select(conn, param));
            });
            return yield Promise.all(promises);
        });
    }
    static selectTop1(conn, param) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = yield Select.selectBase(conn, param);
            if (result.recordset.length > 0) {
                return readListFromResult([result.recordset[0]])[0];
            }
            return null;
        });
    }
    static selectCount(conn, param) {
        return __awaiter(this, void 0, void 0, function* () {
            let param2 = new SelectParamsModel_1.SelectParamsModel();
            param2.sql = `select count(*) as value from (${param.sql}) tCount`;
            param2.where = param.where;
            let restul = yield Select.selectBase(conn, param2);
            let list = readListFromResult(restul.recordset);
            return Number(list[0].get("value"));
        });
    }
    static selectSplitPage(conn, param) {
        return __awaiter(this, void 0, void 0, function* () {
            let countPromise = yield Select.selectCount(conn, param);
            let index;
            if (param.index < 1) {
                index = 1;
            }
            else {
                index = param.index;
            }
            let startIndex = param.pageSize * (index - 1);
            let endIndex = param.pageSize * index;
            let sql = `select * from
      (${param.sql}) tsplit
      where tsplit.row_number > ${startIndex}
        and tsplit.row_number <= ${endIndex}
    `;
            let dataPromise = yield Select.select(conn, {
                sql: sql,
                where: param.where
            });
            let list = yield Promise.all([countPromise, dataPromise]);
            let result = new SplitPageResultModel_1.SplitPageResultModel();
            result.count = list[0];
            result.list = list[1];
            return result;
        });
    }
}
exports.Select = Select;
//# sourceMappingURL=Select.js.map