import { ConnectionPool } from "mssql";
import { SaveType } from "./model/SaveType";
import { Insert } from "./Insert";
import { Update } from "./Update";
import { Delete } from "./Delete";
import { Replace } from "./Replace";
import { Transaction } from "./Transaction";
import { MssqlTransaction } from ".";
import { ICreateBy, ICreateDate, IUpdateBy, IUpdateDate } from "./interface/iCreateBy";
import { IHash } from "./interface/iHash";

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
   * 注意：如需事务处理，请传入tran参数。
   * </pre>
   *
   * @static
   * @param {Connection} conn - 数据库连接对象
   * @param {{
   *       data: {};
   *       database?: string;
   *       table: string;
   *       saveType: SaveType;
   *     }} pars
   * @param {MssqlTransaction} [tran] - 事务对象（可选），当需要事务处理时，必须传入此对象
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
   *   data: { f1: 1, f2: 2, f3: 3 },
   *   table: 'tbl1',
   *   saveType: SaveType.insert
   * });
   * 例2： 以下相当于SQL： update tbl1 set f2=2, f3=3 where f1=1;
   * await Save.save(conn, {
   *   data: { f1: 1, f2: 2, f3: 3 },
   *   table: 'tbl1',
   *   saveType: SaveType.update
   * });
   * 例3： 以下相当于SQL： delete from tbl1 where f1=1;
   * await Save.save(conn, {
   *   data: { f1: 1 },
   *   table: 'tbl1',
   *   saveType: SaveType.delete
   * });
   * 例4： 以下相当于SQL： replace into tbl1(f1, f2, f3) values(1,2,3);
   * await Save.save(conn, {
   *   data: { f1: 1 },
   *   table: 'tbl1',
   *   saveType: SaveType.replace
   * });
   * </pre>
   */
  public static async save(
    conn: ConnectionPool,
    pars: {
      data: IHash;
      database?: string;
      table: string;
      saveType: SaveType;
      createBy?: ICreateBy;
      createDate?: ICreateDate;
      updateBy?: IUpdateBy;
      updateDate?: IUpdateDate;
    },
    tran?: MssqlTransaction
  ) {
    switch (pars.saveType) {
      case SaveType.insert: {
        //插入
        return await Insert.insert(
          conn,
          {
            data: pars.data,
            database: pars.database,
            table: pars.table,
            createBy: pars.createBy,
            createDate: pars.createDate,
            updateBy: pars.updateBy,
            updateDate: pars.updateDate,
          },
          tran
        );
      }
      case SaveType.update: {
        //修改
        return await Update.update(
          conn,
          {
            data: pars.data,
            database: pars.database,
            table: pars.table,
            updateBy: pars.updateBy,
            updateDate: pars.updateDate,
          },
          tran
        );
      }
      case SaveType.delete: {
        //删除
        return await Delete.delete(
          conn,
          {
            data: pars.data,
            database: pars.database,
            table: pars.table,
          },
          tran
        );
      }
      case SaveType.replace: {
        //替换
        return await Replace.replace(
          conn,
          {
            data: pars.data,
            database: pars.database,
            table: pars.table,
            createBy: pars.createBy,
            createDate: pars.createDate,
            updateBy: pars.updateBy,
            updateDate: pars.updateDate,
          },
          tran
        );
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
   *       data: {};
   *       database?: string;
   *       table: string;
   *       saveType: SaveType;
   *     }>} list
   * @param {MssqlTransaction} [tran] - 事务对象（可选），当需要事务处理时，必须传入此对象
   * @returns Promise对象
   * @memberof Save
   */
  public static async saves(
    conn: ConnectionPool,
    list: Array<{
      data: IHash;
      database?: string;
      table: string;
      saveType: SaveType;
      createBy?: ICreateBy;
      createDate?: ICreateDate;
      updateBy?: IUpdateBy;
      updateDate?: IUpdateDate;
    }>,
    tran?: MssqlTransaction
  ) {
    const promiseList = new Array<Promise<any>>();

    list.map((h) => {
      promiseList.push(
        Save.save(
          conn,
          {
            data: h.data,
            database: h.database,
            table: h.table,
            saveType: h.saveType,
            createBy: h.createBy,
            createDate: h.createDate,
            updateBy: h.updateBy,
            updateDate: h.updateDate,
          },
          tran
        )
      );
    });

    return await Promise.all(promiseList);
  }

  // /**
  //  * <pre>
  //  * 保存多条数据，并发执行(事务)
  //  * 当所有保存执行成功时，返回Promise为成功，如果其中一个保存执行出错，返回的Promise为失败。
  //  * 注意：此方法单独开启事务。如需不开启事务，见 {@link saves}
  //  * </pre>
  //  *
  //  * @static
  //  * @param {Connection} conn
  //  * @param {Array<{
  //  *       data: {};
  //  *       database?: string;
  //  *       table: string;
  //  *       saveType: SaveType;
  //  *     }>} list
  //  * @returns
  //  * @memberof Save
  //  */
  // public static async savesWithTran(
  //   conn: ConnectionPool,
  //   list: Array<{
  //     data: {};
  //     database?: string;
  //     table: string;
  //     saveType: SaveType;
  //   }>
  // ) {
  //   let tran;
  //   try {
  //     tran = await Transaction.begin(conn);
  //     await Save.saves(conn, list, tran);
  //     await Transaction.commit(tran);
  //   } catch (err) {
  //     await Transaction.rollback(tran);
  //     return Promise.reject(err);
  //   }
  // }

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
   *       data: {};
   *       database?: string;
   *       table: string;
   *       saveType: SaveType;
   *     }>} list
   * @param {MssqlTransaction} [tran] - 事务对象（可选），当需要事务处理时，必须传入此对象
   * @memberof Save
   */
  public static async savesSeq(
    conn: ConnectionPool,
    list: Array<{
      data: IHash;
      database?: string;
      table: string;
      saveType: SaveType;
      createBy?: ICreateBy;
      createDate?: ICreateDate;
      updateBy?: IUpdateBy;
      updateDate?: IUpdateDate;
    }>,
    tran?: MssqlTransaction
  ) {
    for (const item of list) {
      await Save.save(conn, item, tran);
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
   *       data: {};
   *       database?: string;
   *       table: string;
   *       saveType: SaveType;
   *     }>} list
   * @memberof Save
   */
  public static async savesSeqWithTran(
    conn: ConnectionPool,
    list: Array<{
      data: IHash;
      database?: string;
      table: string;
      saveType: SaveType;
      createBy?: ICreateBy;
      createDate?: ICreateDate;
      updateBy?: IUpdateBy;
      updateDate?: IUpdateDate;
    }>
  ) {
    let tran;
    try {
      tran = await Transaction.begin(conn);

      for (const item of list) {
        await Save.save(conn, item, tran);
      }
      await Transaction.commit(tran);
    } catch (err) {
      await Transaction.rollback(tran);
      return Promise.reject(err);
    }
  }
}
