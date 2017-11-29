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
   * @param {string} objectName - 对象名称
   * @returns 数据库.对象
   * @memberof Utils
   */
  public static getDbObjectName(database: string, objectName: string) {
    return (database ? database + "." : "") + objectName;
  }
}
