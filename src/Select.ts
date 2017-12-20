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
    let request = conn.request();
    if (param.where) {
      param.where.map((w, index) => {
        request.input(`wpar${index}`, w);
        sql = sql.replace("?", `@wpar${index}`);
      });
    }

    return await request.query(sql);
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
  public static async select(conn: ConnectionPool, param: SelectParamsModel) {
    let result = await Select.selectBase(conn, param);

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
  public static async selects(conn: ConnectionPool, params: SelectParamsModel[]) {
    let promises = new Array<Promise<{}[]>>();

    params.map(param => {
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
  public static async selectTop1(conn: ConnectionPool, param: SelectParamsModel) {
    let result = await Select.selectBase(conn, param);
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
  public static async selectCount(conn: ConnectionPool, param: SelectParamsModel) {
    let param2 = new SelectParamsModel();
    param2.sql = `select count(*) as value from (${param.sql}) tCount`;
    param2.where = param.where;

    let restul = await Select.selectBase(conn, param2);
    let list = readListFromResult(restul.recordset);
    let row = list[0];
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
  public static async selectSplitPage(conn: ConnectionPool, param: SplitPageParamsModel) {
    let countPromise = await Select.selectCount(conn, param);

    let index;
    if (param.index < 1) {
      index = 1;
    } else {
      index = param.index;
    }

    let startIndex = param.pageSize * (index - 1);
    let endIndex = param.pageSize * index;

    let sql = `select * from
      (${param.sql}) tsplit
      where tsplit.row_number > ${startIndex}
        and tsplit.row_number <= ${endIndex}
    `;

    let dataPromise = await Select.select(conn, {
      sql: sql,
      where: param.where
    });

    let list = await Promise.all([countPromise, dataPromise]);

    let result = new SplitPageResultModel();
    result.count = list[0];
    result.list = list[1];

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
  public static async selectOneValue(conn: ConnectionPool, param: SelectParamsModel) {
    let result = await Select.selectBase(conn, param);
    let v = result.recordset[0];
    if (v) {
      let keys = Reflect.ownKeys(v);
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
    let result = await Select.select(conn, {
      sql: `select upper(newid()) as GUID`
    });
    return result.GUID as string;
  }
}
