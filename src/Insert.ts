import { ConnectionPool, Request } from "mssql";
import { MssqlTransaction } from ".";
import { ICreateBy, ICreateDate, IUpdateBy, IUpdateDate } from "./interface/iCreateBy";
import { IHash } from "./interface/iHash";
import { TableSchemaModel } from "./model/SchemaModel";
import { Schema } from "./schema/Schema";
import { fillCreateByUpdateBy } from "./util/fillCreateByUpdateBy";
import { Utils } from "./util/Utils";

interface IInsertResult {
  identityValue: number;
}

/**
 * 插入数据
 *
 * @export
 * @class Insert
 */
export class Insert {
  public static async inserts(
    conn: ConnectionPool,
    pars: {
      data: IHash[];
      database?: string;
      chema?: string;
      table: string;
      getIdentityValue?: boolean;
      createBy?: ICreateBy;
      createDate?: ICreateDate;
      updateBy?: IUpdateBy;
      updateDate?: IUpdateDate;
    },
    tran?: MssqlTransaction
  ) {
    const resultList: IInsertResult[] = [];
    const { data, createBy, updateBy, createDate, updateDate, getIdentityValue } = pars;
    const database = pars.database || Utils.getDataBaseFromConnection(conn);

    if (!data) {
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

    for (const row of data) {
      const request = tran ? new Request(tran) : conn.request();
      resultList.push(
        await this._insert({
          row: fillCreateByUpdateBy({ row, createBy, updateBy, createDate, updateDate }),
          tableSchemaModel,
          tableName,
          request,
          getIdentityValue,
        })
      );
    }
    return resultList;
  }

  /**
   * <pre>
   * 插入一条数据
   * 注意：插入字段会根据table表中实际字段进行匹配，只有实际存在的字段才会插入。见下面例子。
   * 注意：如需事务处理，请传入tran参数。
   * </pre>
   * @static
   * @param {Connection} conn - 数据库连接对象
   * @param {{
   *       data: IHash | IHash[];
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
      data: IHash;
      database?: string;
      chema?: string;
      table: string;
      getIdentityValue?: boolean;
      createBy?: ICreateBy;
      createDate?: ICreateDate;
      updateBy?: IUpdateBy;
      updateDate?: IUpdateDate;
    },
    tran?: MssqlTransaction
  ) {
    const database = pars.database || Utils.getDataBaseFromConnection(conn);

    const { data, createBy, createDate, updateBy, updateDate, getIdentityValue } = pars;

    if (!data) {
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
    const request = tran ? new Request(tran) : conn.request();
    return await this._insert({
      row: fillCreateByUpdateBy({ row: data, createBy, updateBy, createDate, updateDate }),
      tableSchemaModel,
      tableName,
      request,
      getIdentityValue,
    });
  }

  private static async _insert(pars: { row: IHash; tableSchemaModel: TableSchemaModel; request: Request; tableName: string; getIdentityValue?: boolean }): Promise<IInsertResult> {
    const { row, tableName, tableSchemaModel, request, getIdentityValue } = pars;
    let fields = "";
    let values = "";
    Object.getOwnPropertyNames(row).map((key, index) => {
      const column = tableSchemaModel.columns.filter((column) => column.columnName === key)[0];
      if (column) {
        if (!column.autoIncrement) {
          //跳过自增字段
          fields += `${column.columnName},`;
          values += `@${column.columnName},`;
        }
        request.input(column.columnName, row[column.columnName]);
      }
    });

    const needGetIdentityValue = getIdentityValue && !!tableSchemaModel.columns.find((n) => n.autoIncrement);

    fields = fields.replace(/\,$/, "");
    values = values.replace(/\,$/, "");

    //是否需要返回自增字段
    const sql = `insert into ${tableName}(${fields}) values(${values}) ${needGetIdentityValue ? ";select @@IDENTITY as insertId" : ""}`;

    const result = await request.query(sql);
    const returnValue: IInsertResult = {
      identityValue: -1,
    };
    if (needGetIdentityValue) {
      returnValue.identityValue = result.recordset[0]["insertId"];
    }
    return returnValue;
  }
}
