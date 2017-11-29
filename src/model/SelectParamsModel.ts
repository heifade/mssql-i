/**
 * 查询参数
 *
 * @export
 * @class SelectParamsModel
 */
export class SelectParamsModel {
  /**
   * SQL语句
   *
   * @type {string}
   * @memberof SelectParamsModel
   */
  public sql: string;
  /**
   * 条件数组
   *
   * @type {any[]}
   * @memberof SelectParamsModel
   */
  public where?: any[];
}
