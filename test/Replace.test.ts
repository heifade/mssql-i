import { expect } from "chai";
import "mocha";
import { getConnectionConfig } from "./connectionConfig";
import { initTable } from "./DataInit";
import { ConnectionHelper, Replace, Select, ConnectionPool, Exec, Schema, Transaction } from "../src/index";

describe("Replace", function () {
  let tableName = "tbl_test_replace";
  let tableName2 = "tbl_test_replace_noprimarykey";
  let conn: ConnectionPool;
  before(async () => {
    conn = await ConnectionHelper.create(getConnectionConfig());
    await initTable(conn, tableName, true);

    await Exec.exec(conn, `if exists (select top 1 1 from sys.tables where name = '${tableName2}') drop table ${tableName2}`);

    await Exec.exec(
      conn,
      `
        create table ${tableName2} (
          f1 int,
          f2 int,
          f3 int
        )
      `
    );

    Schema.clear("djd-test");
  });
  after(async () => {
    await ConnectionHelper.close(conn);
  });

  it("replace must be success with primary key", async () => {
    let insertValue = `value${Math.random()}`;

    await Replace.replace(conn, {
      data: {
        id: 1,
        value: insertValue,
      },
      table: tableName,
      createBy: "djd2",
      createDate: "2021-11-05 15:00:00",
      updateBy: "djd1",
      updateDate: "2021-11-05 15:00:23",
    });

    let rowData = await Select.selectTop1(conn, {
      sql: `select value, createBy, convert(char(19), createDate, 120) as createDate from ${tableName} where id = ?`,
      where: [1],
    });

    expect(rowData != null).to.be.true;
    expect(rowData.value).to.equal(insertValue);
    expect(rowData.createBy).to.equal(null);
    expect(rowData.createDate).to.equal(null);
  });

  it("replace must be success with primary key 1", async () => {
    let insertValue = `value${Math.random()}`;

    await Replace.replace(conn, {
      data: {
        id: 1,
        value: insertValue,
      },
      table: tableName,
      createBy: "djd2",
      createDate: "2021-11-05 15:00:00",
      updateBy: null,
      updateDate: null,
    });

    let rowData = await Select.selectTop1(conn, {
      sql: `select value, createBy, convert(char(19), createDate, 120) as createDate, updateBy, convert(char(19), updateDate, 120) as updateDate from ${tableName} where id = ?`,
      where: [1],
    });

    expect(rowData != null).to.be.true;
    expect(rowData.value).to.equal(insertValue);
    expect(rowData.createBy).to.equal(null);
    expect(rowData.createDate).to.equal(null);
    expect(rowData.updateBy).to.equal(null);
    expect(rowData.updateDate).to.equal(null);
  });

  it("replace must be success with primary key 2", async () => {
    let insertValue = `value${Math.random()}`;

    const result = await Replace.replace(conn, {
      data: {
        id: 1000,
        value: insertValue,
      },
      table: tableName,
      createBy: "djd2",
      createDate: "2021-11-05 15:00:00",
      updateBy: "djd1",
      updateDate: "2021-11-05 15:00:23",
    });

    let rowData = await Select.selectTop1(conn, {
      sql: `select value, createBy, convert(char(19), createDate, 120) as createDate from ${tableName} where id = ?`,
      where: [result.insertId],
    });

    expect(rowData !== null).to.be.true;
    expect(rowData.value).to.equal(insertValue);
    expect(rowData.createBy).to.equal("djd2");
    expect(rowData.createDate).to.equal("2021-11-05 15:00:00");
  });

  it("replace must be success with no primary key", async () => {
    let insertValue = `value${Math.random()}`;

    let result = await Replace.replace(conn, {
      data: {
        value: insertValue,
      },
      table: tableName,
      createBy: "djd2",
      createDate: "2021-11-05 15:00:00",
      updateBy: "djd1",
      updateDate: "2021-11-05 15:00:23",
    });

    let rowData = await Select.selectTop1(conn, {
      sql: `select value, createBy, convert(char(19), createDate, 120) as createDate from ${tableName} where id=?`,
      where: [result.insertId],
    });

    expect(rowData != null).to.be.true;
    expect(rowData.value).to.equal(insertValue);
    expect(rowData.createBy).to.equal("djd2");
    expect(rowData.createDate).to.equal("2021-11-05 15:00:00");
  });

  it("replace with tran must be success", async () => {
    let insertValue = `value${Math.random()}`;

    let tran;
    let result;
    try {
      tran = await Transaction.begin(conn);
      result = await Replace.replace(
        conn,
        {
          data: { value: insertValue },
          table: tableName,
        },
        tran
      );

      await Transaction.commit(tran);
    } catch (err) {
      await Transaction.rollback(tran);
    }

    let rowData = await Select.selectTop1(conn, {
      sql: `select value from ${tableName} where id=?`,
      where: [result.insertId],
    });

    expect(rowData != null).to.be.true;
    expect(rowData.value).to.equal(insertValue);
  });

  // 没有主键的表，replace操作时，会当作insert 处理
  it("replace table with no primary key", async () => {
    let insertValue = `value${Math.random()}`;

    let result = await Replace.replace(conn, {
      data: { f1: 1, f2: 1, f3: 1 },
      table: tableName2,
    });

    let rowData = await Select.selectCount(conn, {
      sql: `select * from ${tableName2} where f1=?`,
      where: [1],
    });

    expect(rowData).to.equal(1);

    result = await Replace.replace(conn, {
      data: { f1: 1, f2: 1, f3: 1 },
      table: tableName2,
    });

    rowData = await Select.selectCount(conn, {
      sql: `select * from ${tableName2} where f1=?`,
      where: [1],
    });

    expect(rowData).to.equal(2);
  });

  it("when pars.data is null", async () => {
    await Replace.replace(conn, {
      data: null,
      table: tableName,
    })
      .then(() => {
        expect(true).to.be.false; // 进到这里就有问题
      })
      .catch((err) => {
        expect(err.message).to.equal("pars.data can not be null or empty!");
      });
  });

  it("when pars.table is null", async () => {
    let insertValue = `value${Math.random()}`;

    await Replace.replace(conn, {
      data: { value: insertValue },
      table: null,
    })
      .then(() => {
        expect(true).to.be.false; // 进到这里就有问题
      })
      .catch((err) => {
        expect(err.message).to.equal("pars.table can not be null or empty!");
      });
  });

  it("when table is not exists", async () => {
    let insertValue = `value${Math.random()}`;

    let tableName = `tbl_not_exists`;

    await Replace.replace(conn, {
      data: { value: insertValue },
      table: tableName,
    })
      .then(() => {
        expect(true).to.be.false; // 进到这里就有问题
      })
      .catch((err) => {
        expect(err.message).to.equal(`Table '${tableName}' is not exists!`);
      });
  });

  it("when error", async () => {
    let insertValue = `123456789012345678901234567890123456789012345678901234567890`;

    await Replace.replace(conn, {
      data: {
        id: 1,
        value: insertValue,
        value2: "aaa",
      },
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
