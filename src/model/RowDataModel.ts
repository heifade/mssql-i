/**
 * <pre>
 * 一条数据
 * 此类的实例用于插入，更新，删除一条数据时使用
 * {@link Save} {@link Insert} {@link Update} {@link Delete} {@link Replace}
 * </pre>
 *
 * @export
 * @class RowDataModel
 */
export class RowDataModel {
  /**
   * 创建一个实例
   *
   * @static
   * @param {*} source
   * @returns
   * @memberof RowDataModel
   */
  public static create(source: any) {
    let data = new RowDataModel();
    Reflect.ownKeys(source).map(key => {
      let v = Reflect.get(source, key);
      Reflect.set(data, key, v);
    });
    return data;
  }
  /**
   * 根据键获取值
   *
   * @param {string} key
   * @returns
   * @memberof RowDataModel
   */
  public get(key: string) {
    return Reflect.get(this, key);
  }

  /**
   * 根据键设置值
   *
   * @param {string} key
   * @param {*} value
   * @returns
   * @memberof RowDataModel
   */
  public set(key: string, value: any) {
    Reflect.set(this, key, value);
    return this;
  }
  /**
   * 是否存在此键
   *
   * @param {string} key
   * @returns
   * @memberof RowDataModel
   */
  public has(key: string) {
    return Reflect.has(this, key);
  }
  /**
   * 获取所有键
   *
   * @returns
   * @memberof RowDataModel
   */
  public keys() {
    return Reflect.ownKeys(this);
  }
}
