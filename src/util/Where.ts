import { IHash } from "../interface/iHash";
import { TableSchemaModel } from "../model/SchemaModel";

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
   * @param {} where - 条件对象
   * @param {TableSchemaModel} tableSchemaModel 表结构信息
   * @returns
   * @memberof Where
   */
  public static getWhereSQL(where: IHash, tableSchemaModel: TableSchemaModel) {
    const whereSQLs: string[] = [];
    const whereList = new Array<any>();
    const wherePars: IHash = {};

    if (where != null) {
      Object.getOwnPropertyNames(where).map((key, index) => {
        if (tableSchemaModel.columns.filter((column) => column.columnName === key).length) {
          whereSQLs.push(`${key} = @wpar${key}`);
          whereList.push(where[key]);
          wherePars[`wpar${key}`] = where[key];
        }
      });
    }

    return { whereSQL: whereSQLs.length ? ` where ${whereSQLs.join(" and ")} ` : "", whereList, wherePars };
  }
}
