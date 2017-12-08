import {
  ConnectionPool,
  Transaction as MssqlTransaction,
  Request
} from "mssql";
import { Schema } from "./schema/Schema";
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
   * 注意：如需事务处理，请传入tran参数。
   * </pre>
   *
   * @static
   * @param {Connection} conn - 数据库连接对象
   * @param {{
   *       data: {};
   *       database?: string;
   *       table: string;
   *     }} pars
   * @param {MssqlTransaction} [tran] - 事务对象（可选），当需要事务处理时，必须传入此对象
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
   *   data: { f1: 1, f2: 2, f3: 3 },
   *   table: 'tbl1'
   * });
   * </pre>
   */
  public static async replace(
    conn: ConnectionPool,
    pars: {
      data: {};
      chema?: string;
      database?: string;
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

    let tableName = Utils.getDbObjectName(database, pars.chema, table);

    let request: Request;
    if (tran) {
      request = new Request(tran);
    } else {
      request = conn.request();
    }

    let sWhereSQL = "";
    let uWhereSQL = "";
    let updateFields = "";
    let insertFields = "";
    let insertValues = "";

    Reflect.ownKeys(data).map((key, index) => {
      let column = tableSchemaModel.columns.filter(
        column => column.columnName === key.toString()
      )[0];
      if (column) {
        let colName = column.columnName;

        if (column.primaryKey) {
          request.input(`wparw${colName}`, Reflect.get(data, colName));
          request.input(`wparu${colName}`, Reflect.get(data, colName));

          sWhereSQL += ` ${colName} = @wparw${colName} and`;
          uWhereSQL += ` ${colName} = @wparu${colName} and`;
        } else {
          request.input(`upar${colName}`, Reflect.get(data, colName));
          updateFields += ` ${colName} = @upar${colName},`;
        }

        if (!column.autoIncrement) {
          request.input(`ipar${colName}`, Reflect.get(data, colName));
          insertFields += ` ${colName},`;
          insertValues += ` @ipar${colName},`;
        }
      }
    });

    if (sWhereSQL) {
      sWhereSQL = ` where ` + sWhereSQL.replace(/and$/, "");
    } else {
      sWhereSQL = ` where 1 = 2`; //当没有主键时，为插入操作
    }
    if (uWhereSQL) {
      uWhereSQL = ` where ` + uWhereSQL.replace(/and$/, "");
    }
    updateFields = updateFields.trim().replace(/\,$/, ""); //去掉最后面的','
    insertFields = insertFields.trim().replace(/\,$/, ""); //去掉最后面的','
    insertValues = insertValues.trim().replace(/\,$/, ""); //去掉最后面的','

    let haveAutoIncrement = false; //是否有自增字段

    tableSchemaModel.columns.map(column => {
      if (column.autoIncrement) {
        haveAutoIncrement = true; //有自增字段
      }
    });

    let getIdentity = haveAutoIncrement ? "select @@IDENTITY as insertId" : "";

    let sql = `
    if exists(select 1 from ${tableName} ${sWhereSQL})
      update ${tableName} set ${updateFields} ${uWhereSQL};
    else
      begin
        insert into ${tableName}(${insertFields}) values(${insertValues});
        ${getIdentity}
      end`;

    let result = await request.query(sql);

    let returnValue = {};
    if (haveAutoIncrement) {
      //有自增字段
      Reflect.set(returnValue, "insertId", result.recordset[0]["insertId"]);
    }

    return returnValue;
  }
}
