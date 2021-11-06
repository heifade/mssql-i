import { ConnectionHelper, Select, Schema, Delete, ConnectionPool } from "../src/index";
import { expect } from "chai";
import "mocha";
import { initTableWith2PrimaryKey } from "./DataInit";
import { getConnectionConfig } from "./connectionConfig";
import { Utils } from "../src/util/Utils";
import { Transaction } from "../src/Transaction";

describe("Delete with 2 primary key", function () {
  let tableName = "tbl_test_delete_with_2primarykey";
  let conn: ConnectionPool;
  before(async () => {
    conn = await ConnectionHelper.create(getConnectionConfig());
    await initTableWith2PrimaryKey(conn, tableName);

    Schema.clear(Utils.getDataBaseFromConnection(conn));
  });

  after(async () => {
    await ConnectionHelper.close(conn);
  });

  it("delete must be success", async () => {
    let deleteId = 1;
    let count = await Select.selectCount(conn, {
      sql: `select * from ${tableName} where id1 = ? and id2 = ?`,
      where: [deleteId, deleteId],
    });
    expect(count).to.equal(1);

    await Delete.deleteByWhere(conn, {
      where: { id1: deleteId, id2: deleteId },
      table: tableName,
    });

    count = await Select.selectCount(conn, {
      sql: `select * from ${tableName} where id1 = ? and id2 = ?`,
      where: [deleteId, deleteId],
    });
    expect(count).to.equal(0);

    deleteId = 2;
    count = await Select.selectCount(conn, {
      sql: `select * from ${tableName} where id1 = ? and id2 = ?`,
      where: [deleteId, deleteId],
    });
    expect(count).to.equal(1);

    await Delete.delete(conn, {
      data: { id1: deleteId, id2: deleteId },
      table: tableName,
    });

    count = await Select.selectCount(conn, {
      sql: `select * from ${tableName} where id1 = ? and id2 = ?`,
      where: [deleteId, deleteId],
    });
    expect(count).to.equal(0);
  });

  it("delete with tran must be success", async () => {
    let deleteId1 = 3;
    let deleteId2 = 4;

    let count = await Select.selectCount(conn, {
      sql: `select * from ${tableName} where id1 in (?, ?)`,
      where: [deleteId1, deleteId2],
    });
    expect(count).to.equal(2);

    let tran;
    try {
      tran = await Transaction.begin(conn);
      await Delete.deleteByWhere(
        conn,
        {
          where: { id1: deleteId1, id2: deleteId1 },
          table: tableName,
        },
        tran
      );

      await Delete.delete(
        conn,
        {
          data: { id1: deleteId2, id2: deleteId2 },
          table: tableName,
        },
        tran
      );
      await Transaction.commit(tran);
    } catch (err) {
      await Transaction.rollback(tran);
    }

    count = await Select.selectCount(conn, {
      sql: `select * from ${tableName} where id1 in (?,?)`,
      where: [deleteId1, deleteId2],
    });
    expect(count).to.equal(0);
  });

  it("when pars.table is null", async () => {
    await Delete.deleteByWhere(conn, {
      where: { id1: 1, id2: 1 },
      table: null,
    })
      .then(() => {
        expect(true).to.be.false; // 进到这里就有问题
      })
      .catch((err) => {
        expect(err.message).to.equal("pars.table 不能为空!");
      });

    await Delete.delete(conn, {
      data: { id1: 1, id2: 1 },
      table: null,
    })
      .then(() => {
        expect(true).to.be.false; // 进到这里就有问题
      })
      .catch((err) => {
        expect(err.message).to.equal("pars.table 不能为空!");
      });
  });

  it("when table 不存在", async () => {
    let insertName = `name${Math.random()}`;

    let tableName = `tbl_not_exists`;

    await Delete.deleteByWhere(conn, {
      where: { id1: 1, id2: 1 },
      table: tableName,
    })
      .then(() => {
        expect(true).to.be.false; // 进到这里就有问题
      })
      .catch((err) => {
        expect(err.message).to.equal(`表: '${tableName}' 不存在!`);
      });

    await Delete.delete(conn, {
      data: { id1: 1, id2: 1 },
      table: tableName,
    })
      .then(() => {
        expect(true).to.be.false; // 进到这里就有问题
      })
      .catch((err) => {
        expect(err.message).to.equal(`表: '${tableName}' 不存在!`);
      });
  });

  it("when data is null", async () => {
    let insertName = `name${Math.random()}`;

    await Delete.delete(conn, {
      data: null,
      table: tableName,
    })
      .then(() => {
        expect(true).to.be.false; // 进到这里就有问题
      })
      .catch((err) => {
        expect(err.message).to.equal(`pars.data 不能为空!`);
      });
  });

  it("when key not provided", async () => {
    let insertName = `name${Math.random()}`;

    await Delete.delete(conn, {
      data: {},
      table: tableName,
    })
      .then(() => {
        expect(true).to.be.false; // 进到这里就有问题
      })
      .catch((err) => {
        expect(err.message).to.equal(`字段: id1, id2 不能为空!`);
      });
  });

  it("delete all", async () => {
    let count = await Select.selectCount(conn, {
      sql: `select * from ${tableName} `,
      where: [],
    });
    expect(count).to.equal(6);

    await Delete.delete(conn, {
      data: {},
      table: tableName,
      onlyDeleteByPrimaryKey: false,
    });

    count = await Select.selectCount(conn, {
      sql: `select * from ${tableName} `,
      where: [],
    });
    expect(count).to.equal(0);

  });

  it("when error", async () => {
    await Delete.deleteByWhere(conn, {
      where: { id1: "Hellow", id2: "abc" },
      table: tableName,
    })
      .then(() => {
        expect(true).to.be.false; // 进到这里就有问题
      })
      .catch((err) => {
        expect(err.code).to.equal(`EREQUEST`);
      });

    await Delete.delete(conn, {
      data: { id1: "Hellow", id2: "ddd" },
      table: tableName,
    })
      .then(() => {
        expect(true).to.be.false; // 进到这里就有问题
      })
      .catch((err) => {
        expect(err.code).to.equal(`EREQUEST`);
      });
  });
});
