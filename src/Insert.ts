import { Connection } from "mysql";
import { Schema } from "./schema/Schema";
import { RowDataModel } from "./model/RowDataModel";
import { Utils } from "./util/Utils";

/**
 * 插入数据
 *
 * @export
 * @class Insert
 */
export class Insert {
  /**
   * 插入一条数据
   * 注意：插入字段会根据table表中实际字段进行匹配，只有实际存在的字段才会插入。见下面例子。
   * 注意：此方法没有开启事务。如需开启事务，见 {@link Transaction}
   *
   * @static
   * @param {Connection} conn - 数据库连接对象
   * @param {{
   *       data: RowDataModel;
   *       database?: string;
   *       table: string;
   *     }} pars
   * @returns Promise对象
   * @memberof Insert
   * @example
   * <pre>
   * tbl1表结构：
   * create table tbl1 (
   *  f1 int,
   *  f2 int,
   *  f3 int
   * )
   * 例1，以下相当于SQL： insert into tbl1(f1, f2, f3) values(1, 2, 3);
   * let result = await Insert.insert(conn, {
   *   data: RowDataModel.create({ f1: 1, f2: 2, f3: 3, f4: 4 }), // f4 不是字段，插入成功
   *   table: 'tbl1'
   * });
   * 例2，以下相当于SQL： insert into tbl1(f1, f2) values(1, 2);
   * let result = await Insert.insert(conn, {
   *   data: RowDataModel.create({ f1: 1, f2: 2 }), // 少一个字段f3，插入成功
   *   table: 'tbl1'
   * });
   * </pre>
   */
  public static insert(
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

        let sql = `insert into ${tableName} set ?`;

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

            return;
          }

          resolve({
            insertId: result.insertId // 自增值
          });
        });
      });
    });
  }
}
