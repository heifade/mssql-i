import { ConnectionPool } from "mssql";

/**
 * 工具
 *
 * @export
 * @class Utils
 */
export class Utils {
  /**
   * 合成 数据库.对象
   *
   * @static
   * @param {string} database - 数据库名称
   * @param {string} chema - 架构 如 dbo
   * @param {string} objectName - 对象名称
   * @returns 数据库.对象
   * @memberof Utils
   */
  public static getDbObjectName(
    database: string,
    chema: string,
    objectName: string
  ) {
    if (!database && !chema) {
      return `[${objectName}]`;
    } else if (!chema) {
      return `[${database}]..[${objectName}]`;
    } else if (!database) {
      return `[${chema}].[${objectName}]`;
    }
    return `[${database}].[${chema}].[${objectName}]`;
  }
  /**
   * 从连接对象中获取数据库名称
   *
   * @static
   * @param {ConnectionPool} conn - 连接对象
   * @returns
   * @memberof Utils
   */
  public static getDataBaseFromConnection(conn: ConnectionPool) {
    let config = Reflect.get(conn, "config");
    return config.database;
  }
}
