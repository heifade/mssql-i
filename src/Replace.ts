import { ConnectionPool, Request } from "mssql";
import { MssqlTransaction } from ".";
import { ICreateBy, ICreateDate, IUpdateBy, IUpdateDate } from "./interface/iCreateBy";
import { IHash } from "./interface/iHash";
import { Schema } from "./schema/Schema";
import { fillCreateByUpdateBy } from "./util/fillCreateByUpdateBy";
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
   *       data: IHash;
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
      data: IHash;
      chema?: string;
      database?: string;
      table: string;
      createBy?: ICreateBy;
      createDate?: ICreateDate;
      updateBy?: IUpdateBy;
      updateDate?: IUpdateDate;
    },
    tran?: MssqlTransaction
  ) {
    const database = pars.database || Utils.getDataBaseFromConnection(conn);

    const { data: row, createBy, updateBy, createDate, updateDate } = pars;
    if (!row) {
      return Promise.reject(new Error(`pars.data can not be null or empty!`));
    }

    const table = pars.table;
    if (!table) {
      return Promise.reject(new Error(`pars.table can not be null or empty!`));
    }

    const schemaModel = await Schema.getSchema(conn, database);

    const tableSchemaModel = schemaModel.getTableSchemaModel(table);

    if (!tableSchemaModel) {
      return Promise.reject(new Error(`Table '${table}' is not exists!`));
    }

    const tableName = Utils.getDbObjectName(database, pars.chema, table);

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

    let createByFieldName = "createBy";
    if (typeof createBy === "object" && createBy.fieldName) {
      createByFieldName = createBy.fieldName;
    }
    let createDateFieldName = "createDate";
    if (typeof createDate === "object" && !(createDate instanceof Date) && createDate.fieldName) {
      createDateFieldName = createDate.fieldName;
    }

    const rowData = fillCreateByUpdateBy({ row, createBy, updateBy, createDate, updateDate });

    Object.getOwnPropertyNames(rowData).map((key, index) => {
      let column = tableSchemaModel.columns.filter((column) => column.columnName === key)[0];
      if (column) {
        let colName = column.columnName;

        if (column.primaryKey) {
          request.input(`wparw${colName}`, rowData[colName]);
          request.input(`wparu${colName}`, rowData[colName]);

          sWhereSQL += ` ${colName} = @wparw${colName} and`;
          uWhereSQL += ` ${colName} = @wparu${colName} and`;
        } else {
          // 字段名为: createBy, createDate 的，当原数据没有指定值时，跳过更新
          if (colName === createByFieldName) {
            if (!row[createByFieldName]) {
              return;
            }
          }
          if (colName === createDateFieldName) {
            if (!row[createDateFieldName]) {
              return;
            }
          }

          request.input(`upar${colName}`, rowData[colName]);
          updateFields += ` ${colName} = @upar${colName},`;
        }

        if (!column.autoIncrement) {
          request.input(`ipar${colName}`, rowData[colName]);
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

    tableSchemaModel.columns.map((column) => {
      if (column.autoIncrement) {
        haveAutoIncrement = true; //有自增字段
      }
    });

    const getIdentity = haveAutoIncrement ? "select @@IDENTITY as insertId" : "";

    let sql = `
    if exists(select 1 from ${tableName} ${sWhereSQL})
      update ${tableName} set ${updateFields} ${uWhereSQL};
    else
      begin
        insert into ${tableName}(${insertFields}) values(${insertValues});
        ${getIdentity}
      end`;

    const result = await request.query(sql);

    const returnValue: any = {};
    if (haveAutoIncrement) {
      //有自增字段
      returnValue.insertId = result.recordset[0]["insertId"];
    }

    return returnValue;
  }
}
