import { config, ConnectionPool } from "mssql";

/**
 * 数据库连接管理器，用于创建数据库连接，关闭数据库连接
 *
 * @export
 * @class ConnectionHelper
 */
export class ConnectionHelper {
  private static pool?: ConnectionPool;
  /**
   * 新创建一个连接
   *
   * @static
   * @param {config} config - 数据库连接配置
   * @returns {Promise<ConnectionPool>} - 数据库连接对象
   * <pre>
   * {
   *    server: "localhost", // 数据库服务器地址
   *    user: "", // 用户名
   *    password: "", // 密码
   *    database: "", // 数据库名称
   *    port: 1433,   // 端口号
   *    connectionTimeout：6000, // 数据库连接超时时间（毫秒），默认1000
   *    requestTimeout: // 数据库处理超时时间（毫秒），默认1000
   * }
   * </pre>
   * @memberof ConnectionHelper
   * @example
   * <pre>
   *  let conn = await ConnectionHelper.create({
   *    server: "localhost", // 数据库服务器地址
   *    user: "", // 用户名
   *    password: "", // 密码
   *    database: "", // 数据库名称
   *    port: 1433,   // 端口号
   *  });
   * </pre>
   */
  public static async create(connConfig: config) {
    if (!this.pool) {
      this.pool = new ConnectionPool(connConfig);
    }
    return await this.pool.connect();
  }

  /**
   * 关闭连接池
   */
  public static async closePool() {
    const { pool } = this;
    if (pool && (pool.connected || pool.connecting)) {
      await pool.close();
      this.pool = undefined;
    }
  }

  /**
   * 关闭连接
   * 不管参数(conn)是否为空，或已关闭，返回的Promise全为成功(resolve)，方便使用
   * @static
   * @param {Connection} conn - 数据库连接对象，当此参数为空时返回的Promise为成功(resolve)
   * @returns 返回一个Promise对象
   * @memberof ConnectionHelper
   */
  public static async close(conn: ConnectionPool) {
    if (conn && (conn.connected || conn.connecting)) {
      return await conn.close();
    }
  }
}
