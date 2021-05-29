import { ConnectionPool, Request } from "mssql";
import { Schema } from "./schema/Schema";
import { Where } from "./util/Where";
import { Utils } from "./util/Utils";
import { MssqlTransaction } from ".";

/**
 * 删除数据
 *
 * @export
 * @class Delete
 */
export class Delete {

  /**
   * 根据主键删除一条数据。
   * 注意：此方法没有开启事务。如需开启事务，见 {@link Transaction}
   * 注意：条件会根据pars.data参数与table表中主键字段进行匹配，只有实际存在的主键才起作用。见下面例子。
   * @static
   * @param {Connection} conn - 数据库连接
   * @param {{
   *       data: {};
   *       database?: string;
   *       table: string;
   *     }} pars
   * @param {MssqlTransaction} [tran] - 事务对象（可选）。当需要事务处理时必需传入此参数
   * @returns Promise 对象
   * @memberof Delete
   * @example
   * <pre>
   * tbl1表结构：
   * create table tbl1 (
   *  f1 int,
   *  f2 int,
   *  f3 int,
   *  primary key(f1,f2)
   * )
   * where 条件会根据表中主键字段进行过滤
   * 例1，以下相当于SQL： delete from tbl1 where f1=1 and f2=2
   * await Delete.delete(conn, {
   *   data: { f1: 1, f2: 2 },
   *   table: 'tbl1'
   * });
   * 例2，以下相当于SQL： delete from tbl1 where f1=1 and f2=2
   * await Delete.delete(conn, {
   *   data: { f1: 1, f2: 2, f3: 3, f4: 4 }, // f3,f4不是主键字段，不起作用
   *   table: 'tbl1'
   * });
   * 例3，会报错，必须提供主键字段f1与f2
   * await Delete.delete(conn, {
   *   data: { f5: 5 }, // f5不是字段，不起作用
   *   table: 'tbl1'
   * });
   */
  public static async delete(
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



    let table = pars.table;
    if (!table) {
      return Promise.reject(new Error(`pars.table can not be null or empty!`));
    }

    let data = pars.data;
    if (!data) {
      return Promise.reject(new Error(`pars.data can not be null or empty!`));
    }

    let schemaModel = await Schema.getSchema(conn, database);
    let tableSchemaModel = schemaModel.getTableSchemaModel(table);

    if (!tableSchemaModel) {
      return Promise.reject(new Error(`Table '${table}' is not exists!`));
    }

    let whereList = new Array<any>();
    let wherePars = {};
    let whereSQL = ``;
    let primaryKeyList = tableSchemaModel.columns.filter(column => column.primaryKey);
    if (primaryKeyList.length < 1) {
      return Promise.reject(new Error(`Table '${table}' has no primary key, you can not call this function. Please try function 'deleteByWhere'!`));
    }
    for (let column of primaryKeyList) {
      let key = column.columnName;
      if (Reflect.has(data, key)) {
        whereSQL += ` ${key} = @wpar${key} and`;
        whereList.push(Reflect.get(data, key));
        Reflect.set(wherePars, `wpar${key}`, Reflect.get(data, key));
      } else {
        return Promise.reject(new Error(`Key ${column.columnName} is not provided!`));
      }
    }

    whereSQL = ` where ` + whereSQL.replace(/and$/, "");

    let tableName = Utils.getDbObjectName(database, pars.chema, table);

    let sql = `delete from ${tableName} ${whereSQL}`;

    let request: Request;
    if (tran) {
      request = new Request(tran);
    } else {
      request = conn.request();
    }

    Reflect.ownKeys(wherePars).map(m => {
      request.input(m.toString(), Reflect.get(wherePars, m));
    });

    await request.query(sql);
  }



  /**
   * 根据条件删除一条数据。
   * 注意：如需事务处理，请传入tran参数。
   * 注意：条件会根据pars.where参数与table表中实际字段进行匹配，只有实际存在的字段才起作用。见下面例子。
   * @static
   * @param {Connection} conn - 数据库连接
   * @param {{
   *       where?: {};
   *       database?: string;
   *       table: string;
   *     }} pars
   * @param {MssqlTransaction} [tran] - 事务对象（可选）。当需要事务处理时必需传入此参数
   * @returns Promise 对象
   * @memberof Delete
   * @example
   * <pre>
   * tbl1表结构：
   * create table tbl1 (
   *  f1 int,
   *  f2 int,
   *  f3 int
   * )
   * where 条件会根据表中字段进行过滤
   * 例1，以下相当于SQL： delete from tbl1 where f1=1 and f2=2
   * await Delete.delete(conn, {
   *   where: { f1: 1, f2: 2 },
   *   table: 'tbl1'
   * });
   * 例2，以下相当于SQL： delete from tbl1 where f1=1 and f2=2 and f3=3
   * await Delete.delete(conn, {
   *   where: { f1: 1, f2: 2, f3: 3, f4: 4 }, // f4不是字段，不起作用
   *   table: 'tbl1'
   * });
   * 例3，以下相当于SQL： delete from tbl1
   * await Delete.delete(conn, {
   *   where: { f5: 5 }, // f5不是字段，不起作用
   *   table: 'tbl1'
   * });
   * 例4，以下相当于SQL： delete from tbl1
   * await Delete.delete(conn, {
   *   where: { },
   *   table: 'tbl1'
   * });
   * </pre>
   */
  public static async deleteByWhere(
    conn: ConnectionPool,
    pars: {
      where?: {};
      database?: string;
      chema?: string;
      table: string;
    },
    tran?: MssqlTransaction
  ) {
    let database = pars.database || Utils.getDataBaseFromConnection(conn);

    let where = pars.where;

    let table = pars.table;
    if (!table) {
      return Promise.reject(new Error(`pars.table can not be null or empty!`));
    }

    let schemaModel = await Schema.getSchema(conn, database);
    let tableSchemaModel = schemaModel.getTableSchemaModel(table);

    if (!tableSchemaModel) {
      return Promise.reject(new Error(`Table '${table}' is not exists!`));
    }

    let { whereSQL, whereList, wherePars } = Where.getWhereSQL(where, tableSchemaModel);

    let tableName = Utils.getDbObjectName(database, pars.chema, table);

    let sql = `delete from ${tableName} ${whereSQL}`;

    let request: Request;
    if (tran) {
      request = new Request(tran);
    } else {
      request = conn.request();
    }

    Reflect.ownKeys(wherePars).map(m => {
      request.input(m.toString(), Reflect.get(wherePars, m));
    });

    await request.query(sql);
  }
}
