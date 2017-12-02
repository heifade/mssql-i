"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Where {
    static getWhereSQL(where, tableSchemaModel) {
        let whereSQL = ``;
        let whereList = new Array();
        let wherePars = {};
        if (where != null) {
            Reflect.ownKeys(where).map((key, index) => {
                let k = key.toString();
                if (tableSchemaModel.columns.filter(column => column.columnName === k)
                    .length) {
                    whereSQL += ` ${k} = @wpar${k} and`;
                    whereList.push(Reflect.get(where, k));
                    Reflect.set(wherePars, `wpar${k}`, Reflect.get(where, k));
                }
            });
        }
        if (whereSQL) {
            whereSQL = ` where` + whereSQL.replace(/and$/, "");
        }
        return { whereSQL, whereList, wherePars };
    }
}
exports.Where = Where;
//# sourceMappingURL=Where.js.map