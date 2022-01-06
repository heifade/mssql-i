import { ConnectionPool, Request } from "mssql";
import { MssqlTransaction } from ".";
import { CREATE_BY, CREATE_DATE, UPDATE_DATE } from "./const";
import { ICreateBy, ICreateDate, IUpdateBy, IUpdateDate } from "./interface/iCreateBy";
import { IHash } from "./interface/iHash";
import { Schema } from "./schema/Schema";
import { fillCreateByUpdateBy } from "./util/fillCreateByUpdateBy";
import { Utils } from "./util/Utils";
import { IInsertResult } from "./interface/iInsertResult";

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
  ): Promise<IInsertResult> {
    const database = pars.database || Utils.getDataBaseFromConnection(conn);

    const { data: row, createBy, updateBy, createDate, updateDate } = pars;
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

    const tableName = Utils.getDbObjectName(database, pars.chema, table);

    let request: Request;
    if (tran) {
      request = new Request(tran);
    } else {
      request = conn.request();
    }

    const sWhereSQLs: string[] = [];
    const uWhereSQLs: string[] = [];
    const updateFields: string[] = [];
    const insertFields: string[] = [];
    const insertValues: string[] = [];

    const rowData = fillCreateByUpdateBy({ row, createBy, updateBy, createDate, updateDate });

    Object.getOwnPropertyNames(rowData).map((key, index) => {
      const column = tableSchemaModel.columns.filter((column) => column.columnName === key)[0];
      if (column) {
        const { columnName, primaryKey, autoIncrement } = column;

        if (primaryKey) {
          request.input(`wparw${columnName}`, rowData[columnName]);
          request.input(`wparu${columnName}`, rowData[columnName]);

          sWhereSQLs.push(` ${columnName} = @wparw${columnName} `);
          uWhereSQLs.push(` ${columnName} = @wparu${columnName} `);
        } else {
          if ([CREATE_BY, CREATE_DATE].includes(columnName)) {
            if (Reflect.has(row, columnName)) {
              // 当字段为 createBy, createDate 时，只有当 源数据里有指定时才更新
              if (columnName === CREATE_DATE && row[columnName] === true) {
                updateFields.push(` ${columnName} = getdate() `);
              } else {
                request.input(`upar${columnName}`, row[columnName]);
                updateFields.push(` ${columnName} = @upar${columnName} `);
              }
            }
          } else {
            if (columnName === UPDATE_DATE && rowData[columnName] === true) {
              updateFields.push(` ${columnName} = getdate() `);
            } else {
              request.input(`upar${columnName}`, rowData[columnName]);
              updateFields.push(` ${columnName} = @upar${columnName} `);
            }
          }
        }

        if (!autoIncrement) {
          if (Reflect.has(row, columnName)) {
            request.input(`ipar${columnName}`, row[columnName]);
          } else {
            request.input(`ipar${columnName}`, rowData[columnName]);
          }
          insertFields.push(columnName);
          insertValues.push(` @ipar${columnName} `);
        }
      }
    });

    const sWhereSQL = sWhereSQLs.length ? ` where ${sWhereSQLs.join(" and ")}` : ` where 1 = 2`; //当没有主键时，为插入操作
    const uWhereSQL = uWhereSQLs.length ? ` where ${uWhereSQLs.join(" and ")}` : "";

    let haveAutoIncrement = false; //是否有自增字段

    tableSchemaModel.columns.map((column) => {
      if (column.autoIncrement) {
        haveAutoIncrement = true; //有自增字段
      }
    });

    const getIdentity = haveAutoIncrement ? "select @@IDENTITY as insertId" : "";

    const sql = `
    if exists(select top 1 1 from ${tableName} ${sWhereSQL})
      begin
        update ${tableName} set ${updateFields.join(",")} ${uWhereSQL}
      end
    else
      begin
        insert into ${tableName}(${insertFields.join(",")}) values(${insertValues.join(",")})
        ${getIdentity}
      end`;

    const result = await request.query(sql);
    const returnValue: IInsertResult = {
      identityValue: -1,
    };
    if (haveAutoIncrement) {
      const { recordset } = result;
      if (recordset && recordset.length > 0) {
        //有自增字段
        returnValue.identityValue = recordset[0]["insertId"];
      }
    }
    return returnValue;
  }
}
