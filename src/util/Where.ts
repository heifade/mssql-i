import { RowDataModel } from "../model/RowDataModel";
import { TableSchemaModel } from "../model/SchemaModel";
import { Request } from "_debugger";

/**
 * 条件
 *
 * @export
 * @class Where
 */
export class Where {
  /**
   * 条件拼装
   *
   * @static
   * @param {RowDataModel} where - 条件对象
   * @param {TableSchemaModel} tableSchemaModel 表结构信息
   * @returns
   * @memberof Where
   */
  public static getWhereSQL(
    where: RowDataModel,
    tableSchemaModel: TableSchemaModel
  ) {
    let whereSQL = ``;
    let whereList = new Array<any>();
    let wherePars = {};

    if (where != null) {
      where.keys().map((key, index) => {
        let k = key.toString();
        if (
          tableSchemaModel.columns.filter(column => column.columnName === k)
            .length
        ) {
          whereSQL += ` ${k} = @wpar${k} and`;
          whereList.push(where.get(k));
          Reflect.set(wherePars, `wpar${k}`, where.get(k));
        }
      });
    }

    if (whereSQL) {
      whereSQL = ` where` + whereSQL.replace(/and$/, "");
    }

    return { whereSQL, whereList, wherePars };
  }
}
