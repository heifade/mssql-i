import { ConnectionPool, VarChar, Request, IProcedureResult } from "mssql";
import { Schema } from "./schema/Schema";
import { Utils } from "./util/Utils";
import { MssqlTransaction } from ".";
import { IHash } from "./interface/iHash";

export interface ProcedureResult extends IProcedureResult<any> {}

/**
 * 存储过程
 *
 * @export
 * @class Procedure
 */
export class Procedure {
  /**
   * 执行一个存储过程
   * 注意：如需事务处理，请传入tran参数。
   *
   * @static
   * @param {Connection} conn - 数据库连接对象
   * @param {{
   *       data?: IHash;
   *       database?: string;
   *       procedure: string;
   *     }} pars
   * @param {MssqlTransaction} [tran] - 事务对象（可选），当需要事务处理时，必须传入此对象
   * @returns Promise对象
   * @memberof Procedure
   */
  public static async exec(
    conn: ConnectionPool,
    pars: {
      data?: IHash;
      database?: string;
      chema?: string;
      procedure: string;
    },
    tran?: MssqlTransaction
  ) {
    const database = pars.database || Utils.getDataBaseFromConnection(conn);

    const procedure = pars.procedure;
    if (!procedure) {
      return Promise.reject(new Error(`pars.procedure can not be null or empty!`));
    }
    const data = pars.data;

    const schemaModel = await Schema.getSchema(conn, database);
    const procedureSchemaModel = schemaModel.getProcedureSchemaModel(procedure);
    if (!procedureSchemaModel) {
      return Promise.reject(new Error(`Procedure '${procedure}' is not exists!`));
    }

    const procedureName = Utils.getDbObjectName(database, pars.chema, procedure);

    let parSQL = "";

    let request: Request;
    if (tran) {
      request = new Request(tran);
    } else {
      request = conn.request();
    }

    if (data) {
      Object.getOwnPropertyNames(data).map((key, index) => {
        const par = procedureSchemaModel.pars.filter((par) => par.name === key.replace(/^@/, ""))[0];
        if (par) {
          if (par.parameterMode === "out") {
            parSQL += `${par.name},`;
            request.output(`${par.name}`, VarChar);
          } else {
            parSQL += `${par.name},`;
            request.input(`${par.name}`, data[par.name]);
          }
        }
      });
      parSQL = parSQL.replace(/\,$/, "");
    }

    const sql = `${procedureName}`;

    const result: ProcedureResult = await request.execute(sql);
    return result;
  }
}
