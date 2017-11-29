import { Connection, Query, MysqlError, FieldInfo } from "mysql";
import { RowDataModel } from "./model/RowDataModel";
import { SelectParamsModel } from "./model/SelectParamsModel";
import { SplitPageParamsModel } from "./model/SplitPageParamsModel";
import { SplitPageResultModel } from "./model/SplitPageResultModel";

let readListFromResult = (result: any) => {
  return result.map((h: any) => {
    let item = new RowDataModel();
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
  /**
   * 单个SQL查询
   *
   * @static
   * @param {Connection} conn - 数据库连接对象
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
   *   sql: `select * from tbl1 where id=?`,
   *   where: [1]
   * });
   * </pre>
   */
  public static select(conn: Connection, param: SelectParamsModel) {
    return new Promise<RowDataModel[]>((resolve, reject) => {
      conn.query(param.sql, param.where, (err, results, fields) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(readListFromResult(results));
      });
    });
  }

  /**
   * 多个SQL查询
   *
   * @static
   * @param {Connection} conn - 数据库连接对象
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
   *   sql: `select * from tbl1 where id=?`,
   *   where: [1]
   *  }, {
   *   sql: `select * from tbl1 where id=?`,
   *   where: [2]
   * }]);
   * </pre>
   */
  public static selects(conn: Connection, params: SelectParamsModel[]) {
    return new Promise<RowDataModel[][]>((resolve, reject) => {
      let promises = new Array<Promise<RowDataModel[]>>();

      params.map(param => {
        let p = Select.select(conn, param);
        promises.push(p);
      });

      Promise.all(promises).then(list => {
        resolve(list);
      });
    });
  }

  /**
   * 查询单个SQL，返回第一条数据
   *
   * @static
   * @param {Connection} conn - 数据库连接对象
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
   *   sql: `select * from tbl1 where id=?`,
   *   where: [1]
   * });
   * </pre>
   */
  public static selectTop1(conn: Connection, param: SelectParamsModel) {
    return new Promise<RowDataModel>((resolve, reject) => {
      conn.query(param.sql, param.where, (err, results, fields) => {
        if (err) {
          reject(err);
        } else {
          let list = readListFromResult(results);
          resolve(list[0] || null);
        }
      });
    });
  }
  /**
   * 查询单个SQL，返回行数
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
   * let result = await Select.selectCount(conn, {
   *   sql: `select * from tbl1 where id=?`,
   *   where: [1]
   * });
   * </pre>
   */
  public static selectCount(conn: Connection, param: SelectParamsModel) {
    return new Promise<number>((resolve, reject) => {
      let countSql = `select count(*) as value from (${param.sql}) tCount`;

      conn.query(countSql, param.where, (err, results, fields) => {
        if (err) {
          reject(err);
        } else {
          let list = readListFromResult(results);

          resolve(list[0].get("value"));
        }
      });
    });
  }

  /**
   * 分页查询
   *
   * @static
   * @param {Connection} conn - 数据库连接对象
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
   *   sql: `select * from tbl1 where id=?`,
   *   where: [1],
   *   pageSize: 10,
   *   index: 0
   * });
   * </pre>
   */
  public static selectSplitPage(conn: Connection, param: SplitPageParamsModel) {
    return new Promise<SplitPageResultModel>((resolve, reject) => {
      let countPromise = Select.selectCount(conn, param);

      let index;
      if (param.index < 1) {
        index = 1;
      } else {
        index = param.index;
      }

      let startIndex = param.pageSize * (index - 1);
      let limitSql = ` limit ${startIndex}, ${param.pageSize}`;
      let dataPromise = Select.select(conn, {
        sql: param.sql + limitSql,
        where: param.where
      });

      Promise.all([countPromise, dataPromise])
        .then(list => {
          let result = new SplitPageResultModel();
          result.count = list[0];
          result.list = list[1];

          resolve(result);
        })
        .catch(err => {
          reject(err);
        });
    });
  }
}
