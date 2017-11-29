import { Connection } from "mysql";
import { Schema } from "./schema/Schema";
import { RowDataModel } from "./model/RowDataModel";
import { Utils } from "./util/Utils";

/**
 * 替换
 *
 * @export
 * @class Replace
 */
export class Replace {
  /**
   * <pre>
   * 根据主键替换数据
   * 注意：此方法没有开启事务。如需开启事务，见 {@link Transaction}
   * </pre>
   *
   * @static
   * @param {Connection} conn - 数据库连接对象
   * @param {{
   *       data: RowDataModel;
   *       database?: string;
   *       table: string;
   *     }} pars
   * @returns Promise对象
   * @memberof Replace
   * @example
   * <pre>
   * tbl1表结构：
   * create table tbl1 (
   *  f1 int primary key,
   *  f2 int,
   *  f3 int
   * )
   * 例1：相当于 replace into tbl1(f1, f2, f3) values(1,2,3)
   * 当存在 f1 = 1的数据时，相当于update tbl1 set f2=2,f3=3 where f1=1
   * 当不存在f1= 1的数据时，相当于insert into tbl1(f1,f2,f3) values(1,2,3)
   * let result = await Replace.replace(conn, {
   *   data: RowDataModel.create({ f1: 1, f2: 2, f3: 3 }),
   *   table: 'tbl1'
   * });
   * </pre>
   */
  public static replace(
    conn: Connection,
    pars: {
      data: RowDataModel;
      database?: string;
      table: string;
    }
  ) {
    let database = pars.database || conn.config.database;

    let data = pars.data;
    if (!data) {
      return Promise.reject(new Error(`pars.data can not be null or empty!`));
    }

    let table = pars.table;
    if (!table) {
      return Promise.reject(new Error(`pars.table can not be null or empty!`));
    }

    return new Promise((resolve, reject) => {
      Schema.getSchema(conn, database).then(schemaModel => {
        let tableSchemaModel = schemaModel.getTableSchemaModel(table);

        if (!tableSchemaModel) {
          reject(new Error(`table '${table}' is not exists!`));
          return;
        }

        let tableName = Utils.getDbObjectName(database, table);

        let sql = `replace into ${tableName} set ?`;

        let fieldValues = new RowDataModel();

        data.keys().map((key, index) => {
          let column = tableSchemaModel.columns.filter(
            column => column.columnName === key.toString()
          )[0];
          if (column) {
            fieldValues.set(column.columnName, data.get(column.columnName));
          }
        });

        conn.query(sql, fieldValues, (err2, result) => {
          if (err2) {
            reject(err2);
          } else {
            resolve();
          }
        });
      });
    });
  }
}
