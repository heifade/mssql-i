import { ConnectionPool, ISOLATION_LEVEL } from "mssql";
import * as mssql from "mssql";

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
 *     data: { f1: 1, f2: 2 },
 *     table: tableName,
 *     saveType: SaveType.insert
 *   });
 *   await Save.save(conn, {
 *     data: { f2: 2, f2: 2 },
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
  public static async begin(conn: ConnectionPool) {
    let tran = new mssql.Transaction(conn);
    await tran.begin(ISOLATION_LEVEL.READ_COMMITTED);
    return tran;
  }

  /**
   * 提交一个事务
   *
   * @static
   * @param {Connection} conn
   * @returns
   * @memberof Transaction
   */
  public static async commit(transaction: mssql.Transaction) {
    await transaction.commit();
  }

  /**
   * 回滚一个事务
   *
   * @static
   * @param {Connection} conn
   * @returns
   * @memberof Transaction
   */
  public static async rollback(transaction: mssql.Transaction) {
    await transaction.rollback();
  }
}
