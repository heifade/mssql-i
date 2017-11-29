import { RowDataModel } from "./RowDataModel";
/**
 * 分页查询返回结果
 *
 * @export
 * @class SplitPageResultModel
 */
export class SplitPageResultModel {
  /**
   * 数据集列表
   *
   * @type {RowDataModel[]}
   * @memberof SplitPageResultModel
   */
  public list: RowDataModel[];
  /**
   * 总行数
   *
   * @type {number}
   * @memberof SplitPageResultModel
   */
  public count: number;
}
