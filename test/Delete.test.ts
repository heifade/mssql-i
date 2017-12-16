import { ConnectionHelper, Select, Exec, Schema, Insert, Update, Delete, ConnectionPool } from "../src/index";
import { expect } from "chai";
import "mocha";
import { initTable } from "./DataInit";
import { connectionConfig } from "./connectionConfig";
import { Utils } from "../src/util/Utils";
import { Replace } from "../src/Replace";
import { Transaction } from "../src/Transaction";

describe("Delete", function() {
  let tableName = "tbl_test_delete";
  let conn: ConnectionPool;
  before(async () => {
    conn = await ConnectionHelper.create(connectionConfig);
    await initTable(conn, tableName, false);
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

    await Delete.delete(conn, {
      where: { id: deleteId },
      table: tableName
    });

    count = await Select.selectCount(conn, {
      sql: `select * from ${tableName} where id=?`,
      where: [deleteId]
    });
    expect(count).to.equal(0);
  });

  it("delete with tran must be success", async () => {
    let deleteId = 2;

    let count = await Select.selectCount(conn, {
      sql: `select * from ${tableName} where id=?`,
      where: [deleteId]
    });
    expect(count).to.equal(1);

    let tran;
    try {
      tran = await Transaction.begin(conn);
      await Delete.delete(
        conn,
        {
          where: { id: deleteId },
          table: tableName
        },
        tran
      );
      await Transaction.commit(tran);
    } catch (err) {
      await Transaction.rollback(tran);
    }

    count = await Select.selectCount(conn, {
      sql: `select * from ${tableName} where id=?`,
      where: [deleteId]
    });
    expect(count).to.equal(0);
  });

  it("when pars.table is null", async () => {
    await Delete.delete(conn, {
      where: { id: 1 },
      table: null
    }).catch(err => {
      let errMsg = Reflect.get(err, "message");
      expect(errMsg).to.equal("pars.table can not be null or empty!");
    });
  });

  it("when table is not exists", async () => {
    let insertName = `name${Math.random()}`;

    let tableName = `tbl_not_exists`;

    await Delete.delete(conn, {
      where: { id: 1 },
      table: tableName
    }).catch(err => {
      let errMsg = Reflect.get(err, "message");
      expect(errMsg).to.equal(`table '${tableName}' is not exists!`);
    });
  });

  it("when error", async () => {
    await Delete.delete(conn, {
      where: { id: "Hellow" },
      table: tableName
    }).catch(err => {
      let errCode = Reflect.get(err, "code");
      expect(errCode).to.equal(`EREQUEST`);
    });
  });
});
