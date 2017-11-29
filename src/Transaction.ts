import { Connection } from "mysql";

/**
 * 事务
 *
 * @export
 * @class Transaction
 * @example
 * <pre>
 * create table tbl1 (
 *  f1 int primary key,
 *  f2 int,
 *  f3 int
 * )
 * try {
 *   await Transaction.begin(conn);
 *   await Save.save(conn, {
 *     data: RowDataModel.create({ f1: 1, f2: 2 }),
 *     table: tableName,
 *     saveType: SaveType.insert
 *   });
 *   await Save.save(conn, {
 *     data: RowDataModel.create({ f2: 2, f2: 2 }),
 *     table: tableName,
 *     saveType: SaveType.insert
 *   });
 *   await Transaction.commit(conn);
 * } catch (err) {
 *   await Transaction.rollback(conn);
 * }
 * </pre>
 */
export class Transaction {
  /**
   * 开启一个事务
   *
   * @static
   * @param {Connection} conn
   * @returns
   * @memberof Transaction
   */
  public static begin(conn: Connection) {
    return new Promise((resolve, reject) => {
      conn.beginTransaction(err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * 提交一个事务
   *
   * @static
   * @param {Connection} conn
   * @returns
   * @memberof Transaction
   */
  public static commit(conn: Connection) {
    return new Promise((resolve, reject) => {
      conn.commit(err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * 回滚一个事务
   *
   * @static
   * @param {Connection} conn
   * @returns
   * @memberof Transaction
   */
  public static rollback(conn: Connection) {
    return new Promise((resolve, reject) => {
      conn.rollback(err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}
