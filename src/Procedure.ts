import { Connection } from "mysql";
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
  public static exec(
    conn: Connection,
    pars: {
      data?: RowDataModel;
      database?: string;
      procedure: string;
    }
  ) {
    let database = pars.database || conn.config.database;

    let procedure = pars.procedure;
    if (!procedure) {
      return Promise.reject(
        new Error(`pars.procedure can not be null or empty!`)
      );
    }
    let data = pars.data;

    return new Promise((resolve, reject) => {
      Schema.getSchema(conn, database).then(schemaModel => {
        let procedureSchemaModel = schemaModel.getProcedureSchemaModel(
          procedure
        );
        if (!procedureSchemaModel) {
          reject(new Error(`procedure '${procedure}' is not exists!`));
          return;
        }

        let procedureName = Utils.getDbObjectName(database, procedure);

        let parList = new Array();
        let parSQL = "";

        if (data) {
          data.keys().map((key, index) => {
            let par = procedureSchemaModel.pars.filter(
              par => par.name === key.toString()
            )[0];

            if (par) {
              if (par.parameterMode === "out") {
                parSQL += `@${par.name},`;
              } else {
                parSQL += "?,";
                parList.push(data.get(par.name));
              }
            }
          });
          parSQL = parSQL.replace(/\,$/, "");
        }

        let sql = `call ${procedureName}(${parSQL})`;

        conn.query(sql, parList, (err, results, fields) => {
          if (err) {
            reject(err);
          } else {
            resolve(results);
          }
        });
      });
    });
  }
}
