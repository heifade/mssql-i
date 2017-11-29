import { Connection } from "mysql";
import { RowDataModel } from "./model/RowDataModel";
import { Schema } from "./schema/Schema";
import { Where } from "./util/Where";
import { Utils } from "./util/Utils";

/**
 * 更新数据
 *
 * @export
 * @class Update
 */
export class Update {
  /**
   * 根据主键更新一条数据，主键不能更新。如需更新主键，见{@link Update.updateByWhere}
   *
   * @static
   * @param {Connection} conn - 数据库连接对象
   * @param {{
   *       data: RowDataModel;
   *       database?: string;
   *       table: string;
   *     }} pars
   * @returns Promise对象
   * @memberof Update
   * @example
   * <pre>
   * tbl1表结构：
   * create table tbl1 (
   *  f1 int,
   *  f2 int,
   *  f3 int,
   *  f4 int,
   *  primary key(f1, f2)
   * )
   * 例1：相当于SQL update tbl1 set f3=3, f4=4 where f1=1 and f2=2
   * let result = await Update.update(conn, {
   *    data: RowDataModel.create({ f1: 1, f2: 2, f3: 3, f4: 4 }),
   *    table: 'tbl1'
   * });
   * 例2：相当于SQL update tbl1 set f3=3 where f1=1 and f2=2
   * let result = await Update.update(conn, {
   *    data: RowDataModel.create({ f1: 1, f2: 2, f3: 3 }),
   *    table: 'tbl1'
   * });
   * 例3：相当于SQL update tbl1 set f3=3, f4=4
   * let result = await Update.update(conn, {
   *    data: RowDataModel.create({ f3: 3, f4: 4 }),
   *    table: 'tbl1'
   * });
   * </pre>
   */
  public static update(
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

        let dataList = new Array<any>();
        let whereList = new Array<any>();

        let fieldSQL = ` `;
        let whereSQL = ``;
        data.keys().map((key, index) => {
          let column = tableSchemaModel.columns.filter(
            column => column.columnName === key.toString()
          )[0];
          if (column) {
            if (column.primaryKey) {
              whereSQL += ` ${column.columnName}=? and`;
              whereList.push(data.get(column.columnName));
            } else {
              fieldSQL += ` ${column.columnName}=?,`;

              dataList.push(data.get(column.columnName));
            }
          }
        });

        fieldSQL = fieldSQL.trim().replace(/\,$/, ""); //去掉最后面的','
        if (whereSQL) {
          whereSQL = ` where ` + whereSQL.replace(/and$/, "");
        }

        dataList = dataList.concat(whereList);

        let tableName = Utils.getDbObjectName(database, table);

        let sql = `update ${tableName} set ${fieldSQL} ${whereSQL}`;

        conn.query(sql, dataList, (err2, result) => {
          if (err2) {
            reject(err2);
          } else {
            resolve();
          }
        });
      });
    });
  }

  // 根据where更新一条数据，可以更新主键
  public static updateByWhere(
    conn: Connection,
    pars: {
      data: RowDataModel;
      where?: RowDataModel;
      database?: string;
      table: string;
    }
  ) {
    let database = pars.database || conn.config.database;

    let data = pars.data;
    if (!data) {
      return Promise.reject(new Error(`pars.data can not be null or empty!`));
    }

    let where = pars.where;

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

        let dataList = new Array<any>();

        let fieldSQL = ` `;
        data.keys().map((key, index) => {
          let column = tableSchemaModel.columns.filter(
            column => column.columnName === key.toString()
          )[0];
          if (column) {
            fieldSQL += ` ${column.columnName}=?,`;

            dataList.push(data.get(column.columnName));
          }
        });

        fieldSQL = fieldSQL.trim().replace(/\,$/, ""); //去掉最后面的','

        let { whereSQL, whereList } = Where.getWhereSQL(
          where,
          tableSchemaModel
        );

        dataList = dataList.concat(whereList);

        let tableName = Utils.getDbObjectName(database, table);

        let sql = `update ${tableName} set ${fieldSQL} ${whereSQL}`;

        conn.query(sql, dataList, (err2, result) => {
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
