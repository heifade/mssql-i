import { Connection } from "mysql";
import { SaveType } from "./model/SaveType";
import { Schema } from "./schema/Schema";
import { RowDataModel } from "./model/RowDataModel";
import { Insert } from "./Insert";
import { Update } from "./Update";
import { Delete } from "./Delete";
import { Replace } from "./Replace";
import { Transaction } from "./Transaction";
import { resolve } from "path";

/**
 * 保存
 *
 * @export
 * @class Save
 */
export class Save {
  /**
   * <pre>
   * 保存单条数据
   * 注意：此方法没有开启事务。如需开启事务，见 {@link Transaction}
   * </pre>
   *
   * @static
   * @param {Connection} conn - 数据库连接对象
   * @param {{
   *       data: RowDataModel;
   *       database?: string;
   *       table: string;
   *       saveType: SaveType;
   *     }} pars
   * @returns Promise对象
   * @memberof Save
   * @example
   * <pre>
   * create table tbl1 (
   *  f1 int primary key,
   *  f2 int,
   *  f3 int
   * )
   * 例1： 以下相当于SQL： insert into tbl1(f1, f2, f3) values(1, 2, 3);
   * await Save.save(conn, {
   *   data: RowDataModel.create({ f1: 1, f2: 2, f3: 3 }),
   *   table: 'tbl1',
   *   saveType: SaveType.insert
   * });
   * 例2： 以下相当于SQL： update tbl1 set f2=2, f3=3 where f1=1;
   * await Save.save(conn, {
   *   data: RowDataModel.create({ f1: 1, f2: 2, f3: 3 }),
   *   table: 'tbl1',
   *   saveType: SaveType.update
   * });
   * 例3： 以下相当于SQL： delete from tbl1 where f1=1;
   * await Save.save(conn, {
   *   data: RowDataModel.create({ f1: 1 }),
   *   table: 'tbl1',
   *   saveType: SaveType.delete
   * });
   * 例4： 以下相当于SQL： replace into tbl1(f1, f2, f3) values(1,2,3);
   * await Save.save(conn, {
   *   data: RowDataModel.create({ f1: 1 }),
   *   table: 'tbl1',
   *   saveType: SaveType.replace
   * });
   * </pre>
   */
  public static save(
    conn: Connection,
    pars: {
      data: RowDataModel;
      database?: string;
      table: string;
      saveType: SaveType;
    }
  ) {
    switch (pars.saveType) {
      case SaveType.insert: {
        //插入
        return Insert.insert(conn, {
          data: pars.data,
          database: pars.database,
          table: pars.table
        });
      }
      case SaveType.update: {
        //修改
        return Update.update(conn, {
          data: pars.data,
          database: pars.database,
          table: pars.table
        });
      }
      case SaveType.delete: {
        //删除
        return Delete.delete(conn, {
          where: pars.data,
          database: pars.database,
          table: pars.table
        });
      }
      case SaveType.replace: {
        //替换
        return Replace.replace(conn, {
          data: pars.data,
          database: pars.database,
          table: pars.table
        });
      }
    }
  }

  /**
   * <pre>
   * 保存多个，并发执行。
   * 当所有保存执行成功时，返回Promise为成功，如果其中一个保存执行出错，返回的Promise为失败。
   * 注意：此方法没有开启事务。如需开启事务，见 {@link savesWithTran}
   * </pre>
   *
   * @static
   * @param {Connection} conn
   * @param {Array<{
   *       data: RowDataModel;
   *       database?: string;
   *       table: string;
   *       saveType: SaveType;
   *     }>} list
   * @returns Promise对象
   * @memberof Save
   */
  public static saves(
    conn: Connection,
    list: Array<{
      data: RowDataModel;
      database?: string;
      table: string;
      saveType: SaveType;
    }>
  ) {
    return new Promise((resolve, reject) => {
      let promiseList = new Array<Promise<any>>();

      list.map(h => {
        promiseList.push(
          Save.save(conn, {
            data: h.data,
            database: h.database,
            table: h.table,
            saveType: h.saveType
          })
        );
      });

      Promise.all(promiseList)
        .then(result => {
          resolve(result);
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  /**
   * <pre>
   * 保存多条数据，并发执行(事务)
   * 当所有保存执行成功时，返回Promise为成功，如果其中一个保存执行出错，返回的Promise为失败。
   * 注意：此方法单独开启事务。如需不开启事务，见 {@link saves}
   * </pre>
   *
   * @static
   * @param {Connection} conn
   * @param {Array<{
   *       data: RowDataModel;
   *       database?: string;
   *       table: string;
   *       saveType: SaveType;
   *     }>} list
   * @returns
   * @memberof Save
   */
  public static savesWithTran(
    conn: Connection,
    list: Array<{
      data: RowDataModel;
      database?: string;
      table: string;
      saveType: SaveType;
    }>
  ) {
    return new Promise<boolean>((resolve, reject) => {
      (async function() {
        try {
          await Transaction.begin(conn);
          await Save.saves(conn, list);
          await Transaction.commit(conn);
          resolve();
        } catch (err) {
          await Transaction.rollback(conn);
          reject(err);
        }
      })();
    });
  }

  /**
   * <pre>
   * 保存多个，顺序执行
   * 当所有保存执行成功时，返回Promise为成功，如果其中一个保存执行出错，返回的Promise为失败。
   * 注意：此方法没有开启事务。如需开启事务，见 {@link savesSeqWithTran}
   * </pre>
   *
   * @static
   * @param {Connection} conn
   * @param {Array<{
   *       data: RowDataModel;
   *       database?: string;
   *       table: string;
   *       saveType: SaveType;
   *     }>} list
   * @memberof Save
   */
  public static async savesSeq(
    conn: Connection,
    list: Array<{
      data: RowDataModel;
      database?: string;
      table: string;
      saveType: SaveType;
    }>
  ) {
    for (let item of list) {
      await Save.save(conn, item);
    }
  }

  /**
   * <pre>
   * 保存多条数据，顺序执行(事务)
   * 当所有保存执行成功时，返回Promise为成功，如果其中一个保存执行出错，返回的Promise为失败。
   * 注意：此方法单独开启事务。如需不开启事务，见 {@link savesSeq}
   * </pre>
   *
   * @static
   * @param {Connection} conn
   * @param {Array<{
   *       data: RowDataModel;
   *       database?: string;
   *       table: string;
   *       saveType: SaveType;
   *     }>} list
   * @memberof Save
   */
  public static async savesSeqWithTran(
    conn: Connection,
    list: Array<{
      data: RowDataModel;
      database?: string;
      table: string;
      saveType: SaveType;
    }>
  ) {
    return new Promise((resolve, reject) => {
      (async function() {
        try {
          await Transaction.begin(conn);

          for (let item of list) {
            await Save.save(conn, item);
          }
          await Transaction.commit(conn);
          resolve();
        } catch (err) {
          await Transaction.rollback(conn);
          reject(err);
        }
      })();
    });
  }
}
