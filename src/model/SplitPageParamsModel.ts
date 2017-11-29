import { SelectParamsModel } from "./SelectParamsModel";

/**
 * 分页参数
 *
 * @export
 * @class SplitPageParamsModel
 * @extends {SelectParamsModel}
 */
export class SplitPageParamsModel extends SelectParamsModel {
  /**
   * 每页行数
   *
   * @type {number}
   * @memberof SplitPageParamsModel
   */
  public pageSize: number;
  /**
   * 当前页号，以1为始
   *
   * @type {number}
   * @memberof SplitPageParamsModel
   */
  public index: number;
}
