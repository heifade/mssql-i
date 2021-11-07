import { ConnectionPool } from "mssql";
import { SelectParamsModel } from "./model/SelectParamsModel";
import { SplitPageParamsModel } from "./model/SplitPageParamsModel";
import { SplitPageResultModel } from "./model/SplitPageResultModel";

let readListFromResult = (result: any) => {
  return result.map((h: any) => {
    let item = {};
    return Object.assign(item, h);
  });
};

/**
 * 查询
 *
 * @export
 * @class Select
 */
export class Select {
  private static async selectBase(conn: ConnectionPool, param: SelectParamsModel) {
    let sql = param.sql;
    try {
      const request = conn.request();
      if (param.where) {
        param.where.map((w, index) => {
          request.input(`wpar${index}`, w);
          sql = sql.replace("?", `@wpar${index}`);
        });
      }
      return await request.query(sql);
    } catch (e) {
      const pars = param.where && param.where.length ? `, 参数: [${param.where.join(", ")}]` : ``;
      throw new Error(`执行SQL: ${sql} 时${pars}出错!`);
    }
  }

  /**
   * 单个SQL查询
   *
   * @static
   * @param {ConnectionPool} conn - 数据库连接对象
   * @param {SelectParamsModel} param - 查询参数
   * @returns Promise对象
   * @memberof Select
   * @example
   * <pre>
   * tbl1表结构：
   * create table tbl1 (
   *  f1 int,
   *  f2 int,
   *  f3 int
   * )
   * 例1：
   * let list = await Select.select(conn, {
   *   sql: `select * from tbl1 where f1=? and f2=?`,
   *   where: [1, 2]
   * });
   * </pre>
   */
  public static async select<T>(conn: ConnectionPool, param: SelectParamsModel): Promise<T[]> {
    const result = await Select.selectBase(conn, param);

    return await readListFromResult(result.recordset);
  }

  /**
   * 多个SQL查询
   *
   * @static
   * @param {ConnectionPool} conn - 数据库连接对象
   * @param {SelectParamsModel[]} params - 查询参数
   * @returns Promise对象
   * @memberof Select
   * @example
   * <pre>
   * tbl1表结构：
   * create table tbl1 (
   *  f1 int,
   *  f2 int,
   *  f3 int
   * )
   * 例1：
   * let list = await Select.selects(conn, [{
   *   sql: `select * from tbl1 where f1=?`,
   *   where: [1]
   *  }, {
   *   sql: `select * from tbl1 where f1=?`,
   *   where: [2]
   * }]);
   * </pre>
   */
  public static async selects<T>(conn: ConnectionPool, params: SelectParamsModel[]): Promise<T[][]> {
    const promises = new Array<Promise<any[]>>();

    params.map((param) => {
      promises.push(Select.select(conn, param));
    });

    return await Promise.all(promises);
  }

  /**
   * 查询单个SQL，返回第一条数据
   *
   * @static
   * @param {ConnectionPool} conn - 数据库连接对象
   * @param {SelectParamsModel} param - 查询参数
   * @returns Promise对象
   * @memberof Select
   * @example
   * <pre>
   * create table tbl1 (
   *  f1 int,
   *  f2 int,
   *  f3 int
   * )
   * let result = await Select.selectTop1(conn, {
   *   sql: `select * from tbl1 where f1=?`,
   *   where: [1]
   * });
   * </pre>
   */
  public static async selectTop1<T>(conn: ConnectionPool, param: SelectParamsModel): Promise<T> {
    const result = await Select.selectBase(conn, param);
    if (result.recordset.length > 0) {
      return readListFromResult([result.recordset[0]])[0];
    }
    return null;
  }
  /**
   * 查询单个SQL，返回行数
   *
   * @static
   * @param {ConnectionPool} conn - 数据库连接对象
   * @param {SelectParamsModel} param - 查询参数
   * @returns Promise对象
   * @memberof Select
   * <pre>
   * create table tbl1 (
   *  f1 int,
   *  f2 int,
   *  f3 int
   * )
   * let result = await Select.selectCount(conn, {
   *   sql: `select * from tbl1 where f1=?`,
   *   where: [1]
   * });
   * </pre>
   */
  public static async selectCount(conn: ConnectionPool, param: SelectParamsModel): Promise<number> {
    const param2 = new SelectParamsModel();
    param2.sql = `select count(*) as value from (${param.sql}) tCount`;
    param2.where = param.where;

    const restul = await Select.selectBase(conn, param2);
    const list = readListFromResult(restul.recordset);
    const row = list[0];
    return Number(row.value);
  }

  /**
   * 分页查询
   *
   * @static
   * @param {ConnectionPool} conn - 数据库连接对象
   * @param {SplitPageParamsModel} param - 分页查询参数
   * @returns Promise对象
   * @memberof Select
   * <pre>
   * create table tbl1 (
   *  f1 int,
   *  f2 int,
   *  f3 int
   * )
   * let result = await Select.selectSplitPage(conn, {
   *   sql: `select * from tbl1 where f1=?`,
   *   where: [1],
   *   pageSize: 10,
   *   index: 0
   * });
   * </pre>
   */
  public static async selectSplitPage<T>(conn: ConnectionPool, param: SplitPageParamsModel) {
    const countPromise = await Select.selectCount(conn, param);

    let index;
    if (param.index < 1) {
      index = 1;
    } else {
      index = param.index;
    }

    const startIndex = param.pageSize * (index - 1);
    const endIndex = param.pageSize * index;

    const sql = `select * from
      (${param.sql}) tsplit
      where tsplit.row_number > ${startIndex}
        and tsplit.row_number <= ${endIndex}
    `;

    const dataPromise = await Select.select(conn, {
      sql: sql,
      where: param.where,
    });

    const list = await Promise.all([countPromise, dataPromise]);

    const result = new SplitPageResultModel<T>();
    result.count = list[0];
    result.list = list[1] as any;

    return result;
  }

  /**
   * 查询第一条数据的第一个字段
   *
   * @static
   * @param {Connection} conn - 数据库连接对象
   * @param {SelectParamsModel} param - 查询参数
   * @returns Promise对象
   * @memberof Select
   * <pre>
   * create table tbl1 (
   *  f1 int,
   *  f2 int,
   *  f3 int
   * )
   * let result = await Select.selectOneValue(conn, {
   *   sql: `select * from tbl1 where f1=?`,
   *   where: [1]
   * });
   * 结果，返回值为满足条件的第一条数据的f1字段值
   * </pre>
   */
  public static async selectOneValue<T>(conn: ConnectionPool, param: SelectParamsModel): Promise<T> {
    const result = await Select.selectBase(conn, param);
    const v = result.recordset[0];
    if (v) {
      const keys = Object.getOwnPropertyNames(v);
      return v[keys[0]];
    }
    return null;
  }

  /**
   * 获取GUIID
   *
   * @static
   * @param {Connection} conn - 数据库连接
   * @returns
   * @memberof Select
   */
  public static async selectGUID(conn: ConnectionPool) {
    const result = await Select.selectOneValue(conn, {
      sql: `select upper(newid()) as GUID`,
    });
    return result as string;
  }
}
