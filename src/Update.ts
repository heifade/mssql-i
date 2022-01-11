import { ConnectionPool, Request } from "mssql";
import { Schema } from "./schema/Schema";
import { Where } from "./util/Where";
import { Utils } from "./util/Utils";
import { MssqlTransaction } from ".";
import { DataType, IHash } from "./interface/iHash";
import { IUpdateBy, IUpdateDate } from "./interface/iCreateBy";
import { fillCreateByUpdateBy } from "./util/fillCreateByUpdateBy";

/**
 * 更新数据
 *
 * @export
 * @class Update
 */
export class Update {
  /**
   * <pre>
   * 根据主键更新一条数据，主键不能更新。如需更新主键，见{@link Update.updateByWhere}
   * 注意：如需事务处理，请传入tran参数。
   * </pre>
   * @static
   * @param {Connection} conn - 数据库连接对象
   * @param {{
   *       data: IHash;
   *       database?: string;
   *       table: string;
   *       onlyUpdateByPrimaryKey: boolean - 根据主键来更新，当主键为 null 或 undefined 时，报错
   *     }} pars
   * @param {MssqlTransaction} [tran] - 事务对象（可选），当需要事务处理时，必须传入此对象
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
   *    data: { f1: 1, f2: 2, f3: 3, f4: 4 },
   *    table: 'tbl1'
   * });
   * 例2：相当于SQL update tbl1 set f3=3 where f1=1 and f2=2
   * let result = await Update.update(conn, {
   *    data: { f1: 1, f2: 2, f3: 3 },
   *    table: 'tbl1'
   * });
   * 例3：相当于SQL update tbl1 set f3=3, f4=4
   * let result = await Update.update(conn, {
   *    data: { f3: 3, f4: 4 },
   *    table: 'tbl1'
   * });
   * </pre>
   */
  public static async update(
    conn: ConnectionPool,
    pars: {
      data: IHash;
      database?: string;
      chema?: string;
      table: string;
      onlyUpdateByPrimaryKey?: boolean;
      updateBy?: IUpdateBy;
      updateDate?: IUpdateDate;
    },
    tran?: MssqlTransaction
  ) {
    const database = pars.database || Utils.getDataBaseFromConnection(conn);
    const { onlyUpdateByPrimaryKey = true, data: row, updateBy, updateDate } = pars;

    if (!row) {
      return Promise.reject(new Error(`pars.data 不能为空!`));
    }

    const table = pars.table;
    if (!table) {
      return Promise.reject(new Error(`pars.table 不能为空!`));
    }

    const schemaModel = await Schema.getSchema(conn, database);
    const tableSchemaModel = schemaModel.getTableSchemaModel(table);

    if (!tableSchemaModel) {
      return Promise.reject(new Error(`表: '${table}' 不存在!`));
    }

    let request: Request;

    if (tran) {
      request = new Request(tran);
    } else {
      request = conn.request();
    }

    const fieldSQLs: string[] = [];
    const whereSQLs: string[] = [];

    if (onlyUpdateByPrimaryKey) {
      const cannotBeNullFields = tableSchemaModel.columns
        .filter((n) => n.primaryKey)
        .filter((n) => {
          const value = row[n.columnName];
          return value === null || value === undefined;
        })
        .map((n) => n.columnName);
      if (cannotBeNullFields.length) {
        return Promise.reject(new Error(`字段: ${cannotBeNullFields.join(", ")} 不能为空!`));
      }
    }

    const rowData = fillCreateByUpdateBy({ row, updateBy, updateDate });

    Object.getOwnPropertyNames(rowData).map((key, index) => {
      const column = tableSchemaModel.columns.filter((column) => column.columnName === key)[0];
      if (column) {
        const { columnName, primaryKey } = column;

        if (primaryKey) {
          whereSQLs.push(` ${columnName} = @wpar${columnName}`);
          request.input(`wpar${columnName}`, rowData[columnName]);
        } else {
          switch (columnName) {
            case "createDate":
            case "updateDate": {
              // createDate, updateDate 当什为 true 时， 取自 getdate()
              if (rowData[columnName] === true) {
                fieldSQLs.push(` ${columnName} = getdate()`);
              } else {
                fieldSQLs.push(` ${columnName} = @fpar${columnName}`);
                request.input(`fpar${columnName}`, rowData[columnName]);
              }
              break;
            }
            default: {
              if (rowData[columnName] === DataType.getdate) {
                fieldSQLs.push(` ${columnName} = getdate()`);
              } else {
                fieldSQLs.push(` ${columnName} = @fpar${columnName}`);
                request.input(`fpar${columnName}`, rowData[columnName]);
              }
              break;
            }
          }
        }
      }
    });

    const whereSQL = whereSQLs.length ? ` where ${whereSQLs.join(" and ")} ` : "";

    const tableName = Utils.getDbObjectName(database, pars.chema, table);

    const sql = `update ${tableName} set ${fieldSQLs.join(",")} ${whereSQL}`;

    await request.query(sql);
    return true;
  }

  /**
   * <pre>
   * 根据where更新一条数据，可以更新主键
   * 注意：如需事务处理，请传入tran参数。
   * </pre>
   * @static
   * @param {ConnectionPool} conn
   * @param {{
   *       data: {};
   *       where?: {};
   *       database?: string;
   *       chema?: string;
   *       table: string;
   *     }} pars
   * @param {MssqlTransaction} [tran] - 事务对象（可选），当需要事务处理时，必须传入此对象
   * @returns Promise对象
   * @memberof Update
   */
  public static async updateByWhere(
    conn: ConnectionPool,
    pars: {
      data: IHash;
      where?: {};
      database?: string;
      chema?: string;
      table: string;
      updateBy?: IUpdateBy;
      updateDate?: IUpdateDate;
    },
    tran?: MssqlTransaction
  ) {
    const database = pars.database || Utils.getDataBaseFromConnection(conn);

    const { data: row, updateBy, updateDate } = pars;
    if (!row) {
      return Promise.reject(new Error(`pars.data 不能为空!`));
    }

    const where = pars.where;

    const table = pars.table;
    if (!table) {
      return Promise.reject(new Error(`pars.table 不能为空!`));
    }

    const schemaModel = await Schema.getSchema(conn, database);
    const tableSchemaModel = schemaModel.getTableSchemaModel(table);

    if (!tableSchemaModel) {
      return Promise.reject(new Error(`表: '${table}' 不存在!`));
    }

    let request: Request;
    if (tran) {
      request = new Request(tran);
    } else {
      request = conn.request();
    }

    const fieldSQLs: string[] = [];
    const rowData = fillCreateByUpdateBy({ row, updateBy, updateDate });
    Object.getOwnPropertyNames(rowData).map((key, index) => {
      let column = tableSchemaModel.columns.filter((column) => column.columnName === key)[0];
      if (column) {
        const { columnName } = column;

        switch (columnName) {
          case "createDate":
          case "updateDate": {
            // createDate, updateDate 当什为 true 时， 取自 getdate()
            if (rowData[columnName] === true) {
              fieldSQLs.push(` ${columnName} = getdate()`);
            } else {
              fieldSQLs.push(` ${columnName} = @fpar${columnName}`);
              request.input(`fpar${columnName}`, rowData[columnName]);
            }
            break;
          }
          default: {
            fieldSQLs.push(` ${columnName} = @fpar${columnName}`);
            request.input(`fpar${columnName}`, rowData[columnName]);
            break;
          }
        }
      }
    });

    const { whereSQL, wherePars } = Where.getWhereSQL(where, tableSchemaModel);

    Object.getOwnPropertyNames(wherePars).map((m) => {
      request.input(m, wherePars[m]);
    });

    const tableName = Utils.getDbObjectName(database, pars.chema, table);

    const sql = `update ${tableName} set ${fieldSQLs.join(",")} ${whereSQL}`;

    await request.query(sql);
    return true;
  }
}
