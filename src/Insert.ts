import { ConnectionPool, Request } from "mssql";
import { MssqlTransaction } from ".";
import { ICreateBy, ICreateDate, IUpdateBy, IUpdateDate } from "./interface/iCreateBy";
import { DataType, IHash } from "./interface/iHash";
import { TableSchemaModel } from "./model/SchemaModel";
import { Schema } from "./schema/Schema";
import { fillCreateByUpdateBy } from "./util/fillCreateByUpdateBy";
import { Utils } from "./util/Utils";
import { IInsertResult } from "./interface/iInsertResult";

/**
 * 向数据库插入数据
 *
 * @export
 * @class Insert
 */
export class Insert {
  /**
   * 插入多条数据
   * @param conn 数据库连接对象
   * @param pars 参数
   * @param tran 事务对象
   * @returns
   */
  public static async inserts(
    /**
     * 数据库连接对象
     */
    conn: ConnectionPool,
    pars: {
      data: IHash[];
      /**
       * 数据库名称
       */
      database?: string;
      /**
       * 加构名称: dbo
       */
      chema?: string;
      /**
       * 表名称
       */
      table: string;
      /**
       * 是否返回自增值
       */
      getIdentityValue?: boolean;
      /**
       * 给 createBy 字段插入的值. (如果 data 里包含此什值，以 data 里的为准)
       */
      createBy?: ICreateBy;
      /**
       * 给 createDate 字段插入的值. (如果 data 里包含此什值，以 data 里的为准)
       */
      createDate?: ICreateDate;
      /**
       * 给 updateBy 字段插入的值. (如果 data 里包含此什值，以 data 里的为准)
       */
      updateBy?: IUpdateBy;
      /**
       * 给 updateDate 字段插入的值. (如果 data 里包含此什值，以 data 里的为准)
       */
      updateDate?: IUpdateDate;
    },
    /**
     * 事务对象
     */
    tran?: MssqlTransaction
  ) {
    const resultList: IInsertResult[] = [];
    const { data, createBy, updateBy, createDate, updateDate, getIdentityValue } = pars;
    const database = pars.database || Utils.getDataBaseFromConnection(conn);

    if (!data) {
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
   * 插入单个数据
   * @param conn 数据库连接对象
   * @param pars 参数
   * @param tran 事务对象
   * @returns
   */
  public static async insert(
    conn: ConnectionPool,
    pars: {
      /**
       * 数据: 如 {id: 1, value: 'abc'}
       */
      data: IHash;
      /**
       * 数据库名称
       */
      database?: string;
      /**
       * 加构名称: dbo
       */
      chema?: string;
      /**
       * 表名称
       */
      table: string;
      /**
       * 是否返回自增值
       */
      getIdentityValue?: boolean;
      /**
       * 给 createBy 字段插入的值. (如果 data 里包含此什值，以 data 里的为准)
       */
      createBy?: ICreateBy;
      /**
       * 给 createDate 字段插入的值. (如果 data 里包含此什值，以 data 里的为准)
       */
      createDate?: ICreateDate;
      /**
       * 给 updateBy 字段插入的值. (如果 data 里包含此什值，以 data 里的为准)
       */
      updateBy?: IUpdateBy;
      /**
       * 给 updateDate 字段插入的值. (如果 data 里包含此什值，以 data 里的为准)
       */
      updateDate?: IUpdateDate;
    },
    /**
     * 事务对象
     */
    tran?: MssqlTransaction
  ) {
    const database = pars.database || Utils.getDataBaseFromConnection(conn);

    const { data, createBy, createDate, updateBy, updateDate, getIdentityValue } = pars;

    if (!data) {
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
    const fields: string[] = [];
    const values: string[] = [];
    Object.getOwnPropertyNames(row).map((key, index) => {
      const column = tableSchemaModel.columns.filter((column) => column.columnName === key)[0];
      if (column) {
        const { autoIncrement, columnName } = column;
        //跳过自增字段
        if (!autoIncrement) {
          switch (columnName) {
            case "createDate":
            case "updateDate": {
              // createDate, updateDate 当什为 true 时， 取自 getdate()
              if (row[columnName] === true) {
                values.push(`getdate()`);
              } else {
                values.push(`@${columnName}`);
                request.input(columnName, row[columnName]);
              }
              break;
            }
            default: {
              if (row[columnName] === DataType.getdate) {
                values.push(`getdate()`);
              } else {
                values.push(`@${columnName}`);
                request.input(columnName, row[columnName]);
              }
            }
          }
          fields.push(columnName);
        }
      }
    });

    const needGetIdentityValue = getIdentityValue && !!tableSchemaModel.columns.find((n) => n.autoIncrement);

    //是否需要返回自增字段
    const sql = `insert into ${tableName}(${fields.join(",")}) values(${values.join(",")}) ${needGetIdentityValue ? ";select @@IDENTITY as insertId" : ""}`;

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
