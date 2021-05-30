import { ConnectionHelper, Select, Exec, Schema, Insert, Update, Delete, ConnectionPool } from "../src/index";
import { expect } from "chai";
import "mocha";
import { initTable } from "./DataInit";
import { getConnectionConfig } from "./connectionConfig";
import { Utils } from "../src/util/Utils";
import { Replace } from "../src/Replace";
import { Transaction } from "../src/Transaction";

describe("Delete", function() {
  let tableName = "tbl_test_delete";
  let tableNoPrimaryKey = "tbl_test_noprimarykey";
  let conn: ConnectionPool;
  before(async () => {
    conn = await ConnectionHelper.create(getConnectionConfig());
    await initTable(conn, tableName, false);

    await Exec.exec(conn, `if exists (select top 1 1 from sys.tables where name = '${tableNoPrimaryKey}') drop table ${tableNoPrimaryKey}`);

    await Exec.exec(
      conn,
      `create table ${tableNoPrimaryKey} (
          id int,
          value varchar(50),
          dateValue datetime
        )`
    );

    Schema.clear(Utils.getDataBaseFromConnection(conn));
  });

  after(async () => {
    await ConnectionHelper.close(conn);
  });

  it("delete must be success", async () => {
    let deleteId = 1;
    let count = await Select.selectCount(conn, {
      sql: `select * from ${tableName} where id=?`,
      where: [deleteId]
    });
    expect(count).to.equal(1);

    await Delete.deleteByWhere(conn, {
      where: { id: deleteId },
      table: tableName
    });

    count = await Select.selectCount(conn, {
      sql: `select * from ${tableName} where id=?`,
      where: [deleteId]
    });
    expect(count).to.equal(0);

    deleteId = 2;
    count = await Select.selectCount(conn, {
      sql: `select * from ${tableName} where id=?`,
      where: [deleteId]
    });
    expect(count).to.equal(1);

    await Delete.delete(conn, {
      data: { id: deleteId },
      table: tableName
    });

    count = await Select.selectCount(conn, {
      sql: `select * from ${tableName} where id=?`,
      where: [deleteId]
    });
    expect(count).to.equal(0);
  });

  it("delete with tran must be success", async () => {
    let deleteId1 = 3;
    let deleteId2 = 4;

    let count = await Select.selectCount(conn, {
      sql: `select * from ${tableName} where id in (?,?)`,
      where: [deleteId1, deleteId2]
    });
    expect(count).to.equal(2);

    let tran;
    try {
      tran = await Transaction.begin(conn);
      await Delete.deleteByWhere(
        conn,
        {
          where: { id: deleteId1 },
          table: tableName
        },
        tran
      );

      await Delete.delete(
        conn,
        {
          data: { id: deleteId2 },
          table: tableName
        },
        tran
      );
      await Transaction.commit(tran);
    } catch (err) {
      await Transaction.rollback(tran);
    }

    count = await Select.selectCount(conn, {
      sql: `select * from ${tableName} where id in (?,?)`,
      where: [deleteId1, deleteId2]
    });
    expect(count).to.equal(0);
  });

  it("when pars.table is null", async () => {
    await Delete.deleteByWhere(conn, {
      where: { id: 1 },
      table: null
    })
      .then(() => {
        expect(true).to.be.false; // 进到这里就有问题
      })
      .catch(err => {
        expect(err.message).to.equal("pars.table can not be null or empty!");
      });

    await Delete.delete(conn, {
      data: { id: 1 },
      table: null
    })
      .then(() => {
        expect(true).to.be.false; // 进到这里就有问题
      })
      .catch(err => {
        expect(err.message).to.equal("pars.table can not be null or empty!");
      });
  });

  it("when table is not exists", async () => {
    let insertName = `name${Math.random()}`;

    let tableName = `tbl_not_exists`;

    await Delete.deleteByWhere(conn, {
      where: { id: 1 },
      table: tableName
    })
      .then(() => {
        expect(true).to.be.false; // 进到这里就有问题
      })
      .catch(err => {
        expect(err.message).to.equal(`Table '${tableName}' is not exists!`);
      });

    await Delete.delete(conn, {
      data: { id: 1 },
      table: tableName
    })
      .then(() => {
        expect(true).to.be.false; // 进到这里就有问题
      })
      .catch(err => {
        expect(err.message).to.equal(`Table '${tableName}' is not exists!`);
      });
  });

  it("when data is null", async () => {
    let insertName = `name${Math.random()}`;

    await Delete.delete(conn, {
      data: null,
      table: tableName
    })
      .then(() => {
        expect(true).to.be.false; // 进到这里就有问题
      })
      .catch(err => {
        expect(err.message).to.equal(`pars.data can not be null or empty!`);
      });
  });

  it("when key not provided", async () => {
    let insertName = `name${Math.random()}`;

    await Delete.delete(conn, {
      data: {},
      table: tableName
    })
      .then(() => {
        expect(true).to.be.false; // 进到这里就有问题
      })
      .catch(err => {
        expect(err.message).to.equal(`Key id is not provided!`);
      });
  });

  it("when table with no primary key", async () => {
    let insertName = `name${Math.random()}`;

    await Delete.delete(conn, {
      data: { id: 1 },
      table: tableNoPrimaryKey
    })
      .then(() => {
        expect(true).to.be.false; // 进到这里就有问题
      })
      .catch(err => {
        expect(err.message).to.equal(`Table '${tableNoPrimaryKey}' has no primary key, you can not call this function. Please try function 'deleteByWhere'!`);
      });
  });

  it("when error", async () => {
    await Delete.deleteByWhere(conn, {
      where: { id: "Hellow" },
      table: tableName
    })
      .then(() => {
        expect(true).to.be.false; // 进到这里就有问题
      })
      .catch(err => {
        expect(err.code).to.equal(`EREQUEST`);
      });

    await Delete.delete(conn, {
      data: { id: "Hellow" },
      table: tableName
    })
      .then(() => {
        expect(true).to.be.false; // 进到这里就有问题
      })
      .catch(err => {
        expect(err.code).to.equal(`EREQUEST`);
      });
  });
});
