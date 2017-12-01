import {
  ConnectionPool,
  Transaction as MssqlTransaction,
  Request
} from "mssql";
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
  public static async update(
    conn: ConnectionPool,
    pars: {
      data: RowDataModel;
      database?: string;
      chema?: string;
      table: string;
    },
    tran?: MssqlTransaction
  ) {
    let database = pars.database || Utils.getDataBaseFromConnection(conn);

    let data = pars.data;
    if (!data) {
      return Promise.reject(new Error(`pars.data can not be null or empty!`));
    }

    let table = pars.table;
    if (!table) {
      return Promise.reject(new Error(`pars.table can not be null or empty!`));
    }

    let schemaModel = await Schema.getSchema(conn, database);
    let tableSchemaModel = schemaModel.getTableSchemaModel(table);

    if (!tableSchemaModel) {
      return Promise.reject(new Error(`table '${table}' is not exists!`));
    }

    let request: Request;

    if (tran) {
      request = new Request(tran);
    } else {
      request = conn.request();
    }

    let fieldSQL = ` `;
    let whereSQL = ``;
    data.keys().map((key, index) => {
      let column = tableSchemaModel.columns.filter(
        column => column.columnName === key.toString()
      )[0];
      if (column) {
        let colName = column.columnName;
        if (column.primaryKey) {
          whereSQL += ` ${colName} = @wpar${colName} and`;

          request.input(`wpar${colName}`, data.get(colName));
        } else {
          fieldSQL += ` ${colName} = @fpar${colName},`;

          request.input(`fpar${colName}`, data.get(colName));
        }
      }
    });

    fieldSQL = fieldSQL.trim().replace(/\,$/, ""); //去掉最后面的','
    if (whereSQL) {
      whereSQL = ` where ` + whereSQL.replace(/and$/, "");
    }

    let tableName = Utils.getDbObjectName(database, pars.chema, table);

    let sql = `update ${tableName} set ${fieldSQL} ${whereSQL}`;

    return await request.query(sql);
  }

  /**
   * 根据where更新一条数据，可以更新主键
   *
   * @static
   * @param {ConnectionPool} conn
   * @param {{
   *       data: RowDataModel;
   *       where?: RowDataModel;
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
      data: RowDataModel;
      where?: RowDataModel;
      database?: string;
      chema?: string;
      table: string;
    },
    tran?: MssqlTransaction,
  ) {
    let database = pars.database || Utils.getDataBaseFromConnection(conn);

    let data = pars.data;
    if (!data) {
      return Promise.reject(new Error(`pars.data can not be null or empty!`));
    }

    let where = pars.where;

    let table = pars.table;
    if (!table) {
      return Promise.reject(new Error(`pars.table can not be null or empty!`));
    }

    let schemaModel = await Schema.getSchema(conn, database);
    let tableSchemaModel = schemaModel.getTableSchemaModel(table);

    if (!tableSchemaModel) {
      return Promise.reject(new Error(`table '${table}' is not exists!`));
    }

    let request: Request;
    if(tran) {
      request = new Request(tran);
    }
    else {
      request = conn.request();
    }

    let fieldSQL = ` `;
    data.keys().map((key, index) => {
      let column = tableSchemaModel.columns.filter(
        column => column.columnName === key.toString()
      )[0];
      if (column) {
        let colName = column.columnName;
        fieldSQL += ` ${colName} = @fpar${colName},`;

        request.input(`fpar${colName}`, data.get(colName));
      }
    });

    fieldSQL = fieldSQL.trim().replace(/\,$/, ""); //去掉最后面的','

    let { whereSQL, wherePars } = Where.getWhereSQL(where, tableSchemaModel);

    Reflect.ownKeys(wherePars).map(m => {
      request.input(m.toString(), Reflect.get(wherePars, m));
    });

    let tableName = Utils.getDbObjectName(database, pars.chema, table);

    let sql = `update ${tableName} set ${fieldSQL} ${whereSQL}`;

    return await request.query(sql);
  }
}
