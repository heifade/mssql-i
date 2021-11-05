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
    let whereSQL = ``;
    const whereList = new Array<any>();
    const wherePars: IHash = {};

    if (where != null) {
      Object.getOwnPropertyNames(where).map((key, index) => {
        if (tableSchemaModel.columns.filter((column) => column.columnName === key).length) {
          whereSQL += ` ${key} = @wpar${key} and`;
          whereList.push(where[key]);
          wherePars[`wpar${key}`] = where[key];
        }
      });
    }

    if (whereSQL) {
      whereSQL = ` where` + whereSQL.replace(/and$/, "");
    }

    return { whereSQL, whereList, wherePars };
  }
}
