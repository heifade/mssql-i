import { ConnectionPool, Transaction as MssqlTransaction, Request } from "mssql";
import { Schema } from "./schema/Schema";
import { Utils } from "./util/Utils";

/**
 * 插入数据
 *
 * @export
 * @class Insert
 */
export class Insert {
  /**
   * <pre>
   * 插入一条数据
   * 注意：插入字段会根据table表中实际字段进行匹配，只有实际存在的字段才会插入。见下面例子。
   * 注意：如需事务处理，请传入tran参数。
   * </pre>
   * @static
   * @param {Connection} conn - 数据库连接对象
   * @param {{
   *       data: {};
   *       database?: string;
   *       table: string;
   *     }} pars
   * @param {MssqlTransaction} [tran] - 事务对象（可选），当需要事务处理时，必须传入此对象
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
   *   data: { f1: 1, f2: 2, f3: 3, f4: 4 }, // f4 不是字段，插入成功
   *   table: 'tbl1'
   * });
   * 例2，以下相当于SQL： insert into tbl1(f1, f2) values(1, 2);
   * let result = await Insert.insert(conn, {
   *   data: { f1: 1, f2: 2 }, // 少一个字段f3，插入成功
   *   table: 'tbl1'
   * });
   * </pre>
   */
  public static async insert(
    conn: ConnectionPool,
    pars: {
      data: {};
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
      return Promise.reject(new Error(`Table '${table}' is not exists!`));
    }

    let tableName = Utils.getDbObjectName(database, pars.chema, table);

    let fields = "";
    let values = "";

    let request: Request;
    if (tran) {
      request = new Request(tran);
    } else {
      request = conn.request();
    }

    let haveAutoIncrement = false; //是否有自增字段

    tableSchemaModel.columns.map(column => {
      if (column.autoIncrement) {
        haveAutoIncrement = true; //有自增字段
      }
    });

    Reflect.ownKeys(data).map((key, index) => {
      let column = tableSchemaModel.columns.filter(column => column.columnName === key.toString())[0];
      if (column) {
        if (!column.autoIncrement) {
          //跳过自增字段
          fields += `${column.columnName},`;
          values += `@${column.columnName},`;
        }

        request.input(column.columnName, Reflect.get(data, column.columnName));
      }
    });

    fields = fields.replace(/\,$/, "");
    values = values.replace(/\,$/, "");

    let sql = `insert into ${tableName}(${fields}) values(${values})`;

    if (haveAutoIncrement) {
      //有自增字段
      sql += ";select @@IDENTITY as insertId";
    }

    let result = await request.query(sql);

    let returnValue: any = {};
    if (haveAutoIncrement) {
      //有自增字段
      returnValue.insertId = result.recordset[0]["insertId"];
    }

    return returnValue;
  }
}
