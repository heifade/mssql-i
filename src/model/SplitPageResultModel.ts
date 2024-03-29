
/**
 * 分页查询返回结果
 *
 * @export
 * @class SplitPageResultModel
 */
export class SplitPageResultModel<T> {
  /**
   * 数据集列表
   *
   * @memberof SplitPageResultModel
   */
  public list: Array<T>;
  /**
   * 总行数
   *
   * @type {number}
   * @memberof SplitPageResultModel
   */
  public count: number;
}
