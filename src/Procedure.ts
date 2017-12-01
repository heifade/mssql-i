import { ConnectionPool, VarChar } from "mssql";
import { Schema } from "./schema/Schema";
import { RowDataModel } from "./model/RowDataModel";
import { Utils } from "./util/Utils";
import { Select } from "./Select";

/**
 * 存储过程
 *
 * @export
 * @class Procedure
 */
export class Procedure {
  /**
   * 执行一个存储过程
   *
   * @static
   * @param {Connection} conn - 数据库连接对象
   * @param {{
   *       data?: RowDataModel;
   *       database?: string;
   *       procedure: string;
   *     }} pars
   * @returns Promise对象
   * @memberof Procedure
   */
  public static async exec(
    conn: ConnectionPool,
    pars: {
      data?: RowDataModel;
      database?: string;
      chema?: string;
      procedure: string;
    }
  ) {
    let database = pars.database || Utils.getDataBaseFromConnection(conn);

    let procedure = pars.procedure;
    if (!procedure) {
      return Promise.reject(
        new Error(`pars.procedure can not be null or empty!`)
      );
    }
    let data = pars.data;

    let schemaModel = await Schema.getSchema(conn, database);
    let procedureSchemaModel = schemaModel.getProcedureSchemaModel(procedure);
    if (!procedureSchemaModel) {
      return Promise.reject(
        new Error(`procedure '${procedure}' is not exists!`)
      );
    }

    let procedureName = Utils.getDbObjectName(database, pars.chema, procedure);

    let parSQL = "";

    let request = conn.request();

    if (data) {
      data.keys().map((key, index) => {
        let par = procedureSchemaModel.pars.filter(
          par => par.name === key.toString().replace(/^@/, "")
        )[0];

        if (par) {
          if (par.parameterMode === "out") {
            parSQL += `${par.name},`;
            request.output(`${par.name}`, VarChar);
          } else {
            parSQL += `${par.name},`;
            request.input(`${par.name}`, data.get(par.name));
          }
        }
      });
      parSQL = parSQL.replace(/\,$/, "");
    }

    let sql = `${procedureName}`;

    return await request.execute(sql);
  }
}
