import { config, ConnectionPool } from "mssql";

/**
 * 数据库连接管理器，用于创建数据库连接，关闭数据库连接
 *
 * @export
 * @class ConnectionHelper
 */
export class ConnectionHelper {
  /**
   * 新创建一个连接
   *
   * @static
   * @param {config} config - 数据库连接配置
   * <pre>
   * {
   *    host: "", // 数据库服务器地址
   *    user: "", // 用户名
   *    password: "", // 密码
   *    database: "", // 数据库名称
   *    port: 3306,   // 端口号
   *    charset: 'utf8_general_ci', // 字符集 默认：'UTF8_GENERAL_CI'
   *    timezone: 'local', // 时区配置MySQL服务器。这可以是"local"，"Z"偏移量+HH:MM或-HH:MM。默认"local"
   *    connectTimeout：6000, // 数据库连接超时时间（毫秒），默认1000
   * }
   * </pre>
   * @returns 返回一个包含Connection对象的Promise
   * @memberof ConnectionHelper
   * @example
   * <pre>
   *  let conn = await ConnectionHelper.create({
   *    host: "", // 数据库服务器地址
   *    user: "", // 用户名
   *    password: "", // 密码
   *    database: "", // 数据库名称
   *    port: 3306,   // 端口号
   *  });
   * </pre>
   */
  public static create(connConfig: config): Promise<ConnectionPool> {
    let pool = new ConnectionPool(connConfig);
    console.log(1, pool);
    return pool.connect();
  }

  /**
   * 关闭连接
   * 不管参数(conn)是否为空，或已关闭，返回的Promise全为成功(resolve)，方便使用
   * @static
   * @param {Connection} conn - 数据库连接对象，当此参数为空时返回的Promise为成功(resolve)
   * @returns 返回一个Promise对象
   * @memberof ConnectionHelper
   */
  public static close(conn: ConnectionPool) {
    return conn.close();
  }
}
