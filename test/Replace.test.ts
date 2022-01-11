import { expect } from "chai";
import "mocha";
import { getConnectionConfig } from "./connectionConfig";
import { initTable } from "./DataInit";
import { ConnectionHelper, Replace, Select, ConnectionPool, Exec, Schema, Transaction, IInsertResult, Update } from "../src/index";
import { DataType, IHash } from "../src/interface/iHash";
import { getMillToNow } from "./utils";

describe("Replace", function () {
  let tableName = "tbl_test_replace";
  let tableName2 = "tbl_test_replace_noprimarykey";
  const tableName3 = "tbl_test_replace3";
  const tableName4 = "tbl_test_replace4";
  const tableName5 = "tbl_test_replace5";
  let conn: ConnectionPool;
  before(async () => {
    conn = await ConnectionHelper.create(getConnectionConfig());
    await initTable(conn, tableName, true);
    await initTable(conn, tableName3, true);
    await initTable(conn, tableName4, false);
    await initTable(conn, tableName5, false);

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

  it("replace must be success with primary key 01", async () => {
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

    let rowData = await Select.selectTop1<IHash>(conn, {
      sql: `select value, createBy, convert(char(19), createDate, 120) as createDate, updateBy, convert(char(19), updateDate, 120) as updateDate from ${tableName} where id = ?`,
      where: [1],
    });

    expect(rowData != null).to.be.true;
    expect(rowData.value).to.equal(insertValue);
    expect(rowData.createBy).to.equal(null);
    expect(rowData.createDate).to.equal(null);
  });

  it("replace must be success with primary key 01 use createDate, updateDate getdate", async () => {
    const insertValue = `value${Math.random()}`;

    await Replace.replace(conn, {
      data: {
        id: 1,
        value: insertValue,
      },
      table: tableName4,
      createBy: "djd2",
      createDate: true,
      updateBy: "djd1",
      updateDate: true,
    });

    const rowData = await Select.selectTop1<IHash>(conn, {
      sql: `select value, createBy, convert(char(19), createDate, 120) as createDate, updateBy, convert(char(19), updateDate, 120) as updateDate from ${tableName4} where id = ?`,
      where: [1],
    });

    expect(rowData != null).to.be.true;
    expect(rowData.value).to.equal(insertValue);
    expect(rowData.createBy).to.equal(null);
    expect(rowData.createDate).to.equal(null);
    expect(getMillToNow(rowData.updateDate)).to.lessThan(1000);

    await Replace.replace(conn, {
      data: {
        id: 2,
        value: insertValue,
        createBy: "djd2",
        createDate: true,
      },
      table: tableName4,
      updateBy: "djd1",
      updateDate: true,
    });

    const rowData2 = await Select.selectTop1<IHash>(conn, {
      sql: `select value, createBy, convert(char(19), createDate, 120) as createDate, updateBy, convert(char(19), updateDate, 120) as updateDate from ${tableName4} where id = ?`,
      where: [2],
    });
    expect(rowData2 != null).to.be.true;
    expect(rowData2.createBy).to.equal("djd2");
    expect(getMillToNow(rowData2.createDate)).to.lessThan(1000);
  });

  it("replace must be success with primary key 02", async () => {
    let insertValue = `value${Math.random()}`;

    await Replace.replace(conn, {
      data: {
        id: 1,
        value: insertValue,
      },
      table: tableName,
      createBy: "djd2",
      createDate: "2021-11-05 15:00:00",
      updateBy: "djd50",
      updateDate: "2021-11-15 15:00:00",
    });

    let rowData = await Select.selectTop1<IHash>(conn, {
      sql: `select value, createBy, convert(char(19), createDate, 120) as createDate, updateBy, convert(char(19), updateDate, 120) as updateDate from ${tableName} where id = ?`,
      where: [1],
    });

    expect(rowData != null).to.be.true;
    expect(rowData.value).to.equal(insertValue);
    expect(rowData.createBy).to.equal(null);
    expect(rowData.createDate).to.equal(null);
    expect(rowData.updateBy).to.equal("djd50");
    expect(rowData.updateDate).to.equal("2021-11-15 15:00:00");
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

    let rowData = await Select.selectTop1<IHash>(conn, {
      sql: `select value, createBy, convert(char(19), createDate, 120) as createDate from ${tableName} where id = ?`,
      where: [result.identityValue],
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

    let rowData = await Select.selectTop1<IHash>(conn, {
      sql: `select value, createBy, convert(char(19), createDate, 120) as createDate from ${tableName} where id=?`,
      where: [result.identityValue],
    });

    expect(rowData != null).to.be.true;
    expect(rowData.value).to.equal(insertValue);
    expect(rowData.createBy).to.equal("djd2");
    expect(rowData.createDate).to.equal("2021-11-05 15:00:00");
  });

  it("replace must be success with no primary key 2", async () => {
    let insertValue = `value${Math.random()}`;

    let result = await Replace.replace(conn, {
      data: {
        value: insertValue,
      },
      table: tableName,
      createBy: "djd27",
      createDate: "2031-12-05 15:00:00",
      updateBy: "djd18",
      updateDate: "2031-11-05 15:00:23",
    });

    let rowData = await Select.selectTop1<IHash>(conn, {
      sql: `select value, createBy, convert(char(19), createDate, 120) as createDate from ${tableName} where id=?`,
      where: [result.identityValue],
    });

    expect(rowData != null).to.be.true;
    expect(rowData.value).to.equal(insertValue);
    expect(rowData.createBy).to.equal("djd27");
    expect(rowData.createDate).to.equal("2031-12-05 15:00:00");
  });

  it("replace must be success with no primary key 2", async () => {
    let insertValue = `value${Math.random()}`;

    let result = await Replace.replace(conn, {
      data: {
        value: insertValue,
        createBy: "djd91",
        createDate: "2021-10-12",
        updateBy: "djd92",
        updateDate: "2021-11-12",
      },
      table: tableName,
      createBy: "djd27",
      createDate: "2031-12-05 15:00:00",
      updateBy: "djd18",
      updateDate: "2031-11-05 15:00:23",
    });

    let rowData = await Select.selectTop1<IHash>(conn, {
      sql: `select value, createBy, convert(char(19), createDate, 120) as createDate, updateBy, convert(char(19), updateDate, 120) as updateDate from ${tableName} where id = ?`,
      where: [result.identityValue],
    });

    expect(rowData != null).to.be.true;
    expect(rowData.value).to.equal(insertValue);
    expect(rowData.createBy).to.equal("djd91");
    expect(rowData.createDate).to.equal("2021-10-12 00:00:00");
    expect(rowData.updateBy).to.equal("djd92");
    expect(rowData.updateDate).to.equal("2021-11-12 00:00:00");
  });

  it("replace with tran must be success", async () => {
    let insertValue = `value${Math.random()}`;

    let tran;
    let result: IInsertResult;
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

    let rowData = await Select.selectTop1<IHash>(conn, {
      sql: `select value from ${tableName} where id=?`,
      where: [result.identityValue],
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
        expect(err.message).to.equal("pars.data 不能为空!");
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
        expect(err.message).to.equal("pars.table 不能为空!");
      });
  });

  it("when table 不存在", async () => {
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
        expect(err.message).to.equal(`表: '${tableName}' 不存在!`);
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

  it("test2 当数据里指定 createBy, updateBy, createDate, updateDate时, 直接更新", async () => {
    const insertValue = `value${Math.random()}`;
    await Replace.replace(conn, {
      data: {
        id: 1,
        value: insertValue,
        dateValue: "2021-01-01",
        createBy: "djd1",
        createDate: "2021-01-02",
        updateBy: "djd2",
        updateDate: "2021-01-03",
      },
      table: tableName3,
    });

    const list = await Select.select<IHash>(conn, {
      sql: `select value, convert(char(19), dateValue, 120) as dateValue, createBy, convert(char(19), createDate, 120) as createDate, updateBy, convert(char(19), updateDate, 120) as updateDate from ${tableName3} where id = 1`,
    });

    expect(list.length).to.equal(1);
    expect(list[0].value).to.equal(insertValue);
    expect(list[0].dateValue).to.equals("2021-01-01 00:00:00");
    expect(list[0].createBy).to.equals("djd1");
    expect(list[0].createDate).to.equals("2021-01-02 00:00:00");
    expect(list[0].updateBy).to.equals("djd2");
    expect(list[0].updateDate).to.equals("2021-01-03 00:00:00");
  });

  it("test2 当数据里指定 createBy, updateBy, createDate, updateDate, 并且操作里又传入时, 以数据的为准", async () => {
    const insertValue = `value${Math.random()}`;
    await Replace.replace(conn, {
      data: {
        id: 2,
        value: insertValue,
        dateValue: "2021-01-01",
        createBy: "djd1",
        createDate: "2021-01-02",
        updateBy: "djd2",
        updateDate: "2021-01-03",
      },
      updateBy: "djd4",
      updateDate: "2021-01-05",
      table: tableName3,
    });

    const list = await Select.select<IHash>(conn, {
      sql: `select value, convert(char(19), dateValue, 120) as dateValue, createBy, convert(char(19), createDate, 120) as createDate, updateBy, convert(char(19), updateDate, 120) as updateDate from ${tableName3} where id = 2`,
    });

    expect(list.length).to.equal(1);
    expect(list[0].value).to.equal(insertValue);
    expect(list[0].dateValue).to.equals("2021-01-01 00:00:00");
    expect(list[0].createBy).to.equals("djd1");
    expect(list[0].createDate).to.equals("2021-01-02 00:00:00");
    expect(list[0].updateBy).to.equals("djd2");
    expect(list[0].updateDate).to.equals("2021-01-03 00:00:00");
  });
  it("test2 当数据里没指定 createBy, updateBy, createDate, updateDate, 并且操作里又传入时, 以操作数据为准", async () => {
    const insertValue = `value${Math.random()}`;
    await Replace.replace(conn, {
      data: {
        id: 3,
        value: insertValue,
        dateValue: "2021-01-01",
      },
      updateBy: "djd4",
      updateDate: "2021-01-05",
      table: tableName3,
    });
    const list = await Select.select<IHash>(conn, {
      sql: `select value, convert(char(19), dateValue, 120) as dateValue, createBy, convert(char(19), createDate, 120) as createDate, updateBy, convert(char(19), updateDate, 120) as updateDate from ${tableName3} where id = 3`,
    });

    expect(list.length).to.equal(1);
    expect(list[0].value).to.equal(insertValue);
    expect(list[0].dateValue).to.equals("2021-01-01 00:00:00");
    expect(list[0].createBy).to.equals(null);
    expect(list[0].createDate).to.equals(null);
    expect(list[0].updateBy).to.equals("djd4");
    expect(list[0].updateDate).to.equals("2021-01-05 00:00:00");
  });
  it("test2 当数据里没指定 createBy, updateBy, createDate, updateDate, 并且操作里又没指定时, 为空", async () => {
    const insertValue = `value${Math.random()}`;
    await Replace.replace(conn, {
      data: {
        id: 4,
        value: insertValue,
        dateValue: "2021-01-01",
      },
      table: tableName3,
    });
    const list = await Select.select<IHash>(conn, {
      sql: `select value, convert(char(19), dateValue, 120) as dateValue, createBy, convert(char(19), createDate, 120) as createDate, updateBy, convert(char(19), updateDate, 120) as updateDate from ${tableName3} where id = 4`,
    });

    expect(list.length).to.equal(1);
    expect(list[0].value).to.equal(insertValue);
    expect(list[0].dateValue).to.equals("2021-01-01 00:00:00");
    expect(list[0].createBy).to.equals(null);
    expect(list[0].createDate).to.equals(null);
    expect(list[0].updateBy).to.equals(null);
    expect(list[0].updateDate).to.equals(null);
  });

  it("test2 当数据里指定 createBy, updateBy, createDate, updateDate时, 直接插入", async () => {
    const insertValue = `value${Math.random()}`;
    await Replace.replace(conn, {
      data: {
        value: insertValue,
        dateValue: "2023-01-01",
        createBy: "djd11",
        createDate: "2023-01-02",
        updateBy: "djd21",
        updateDate: "2023-01-03",
      },
      table: tableName3,
    });

    const list = await Select.select<IHash>(conn, {
      sql: `select value, convert(char(19), dateValue, 120) as dateValue, createBy, convert(char(19), createDate, 120) as createDate, updateBy, convert(char(19), updateDate, 120) as updateDate from ${tableName3} where id = 11`,
    });

    expect(list.length).to.equal(1);
    expect(list[0].value).to.equal(insertValue);
    expect(list[0].dateValue).to.equals("2023-01-01 00:00:00");
    expect(list[0].createBy).to.equals("djd11");
    expect(list[0].createDate).to.equals("2023-01-02 00:00:00");
    expect(list[0].updateBy).to.equals("djd21");
    expect(list[0].updateDate).to.equals("2023-01-03 00:00:00");
  });

  it("test2 当数据里指定 createBy, updateBy, createDate, updateDate, 并且操作里又传入时, 以数据的为准", async () => {
    const insertValue = `value${Math.random()}`;
    await Replace.replace(conn, {
      data: {
        value: insertValue,
        dateValue: "2024-01-01",
        createBy: "djd12",
        createDate: "2024-01-02",
        updateBy: "djd22",
        updateDate: "2024-01-03",
      },
      updateBy: "djd41",
      updateDate: "2024-01-05",
      table: tableName3,
    });

    const list = await Select.select<IHash>(conn, {
      sql: `select value, convert(char(19), dateValue, 120) as dateValue, createBy, convert(char(19), createDate, 120) as createDate, updateBy, convert(char(19), updateDate, 120) as updateDate from ${tableName3} where id = 12`,
    });

    expect(list.length).to.equal(1);
    expect(list[0].value).to.equal(insertValue);
    expect(list[0].dateValue).to.equals("2024-01-01 00:00:00");
    expect(list[0].createBy).to.equals("djd12");
    expect(list[0].createDate).to.equals("2024-01-02 00:00:00");
    expect(list[0].updateBy).to.equals("djd22");
    expect(list[0].updateDate).to.equals("2024-01-03 00:00:00");
  });
  it("test2 当数据里没指定 createBy, updateBy, createDate, updateDate, 并且操作里又传入时, 以操作数据为准", async () => {
    const insertValue = `value${Math.random()}`;
    await Replace.replace(conn, {
      data: {
        value: insertValue,
        dateValue: "2025-01-01",
      },
      updateBy: "djd42",
      updateDate: "2025-01-05",
      table: tableName3,
    });
    const list = await Select.select<IHash>(conn, {
      sql: `select value, convert(char(19), dateValue, 120) as dateValue, createBy, convert(char(19), createDate, 120) as createDate, updateBy, convert(char(19), updateDate, 120) as updateDate from ${tableName3} where id = 13`,
    });

    expect(list.length).to.equal(1);
    expect(list[0].value).to.equal(insertValue);
    expect(list[0].dateValue).to.equals("2025-01-01 00:00:00");
    expect(list[0].createBy).to.equals(null);
    expect(list[0].createDate).to.equals(null);
    expect(list[0].updateBy).to.equals("djd42");
    expect(list[0].updateDate).to.equals("2025-01-05 00:00:00");
  });
  it("test2 当数据里没指定 createBy, updateBy, createDate, updateDate, 并且操作里又没指定时, 为空", async () => {
    const insertValue = `value${Math.random()}`;
    await Replace.replace(conn, {
      data: {
        value: insertValue,
        dateValue: "2021-01-01",
        createBy: "djd1",
        updateBy: "djd1",
        createDate: "2020-01-01",
        updateDate: "2020-01-01",
      },
      table: tableName3,
    });
    const list1 = await Select.select<IHash>(conn, {
      sql: `select value, convert(char(19), dateValue, 120) as dateValue, createBy, convert(char(19), createDate, 120) as createDate, updateBy, convert(char(19), updateDate, 120) as updateDate from ${tableName3} where id = 14`,
    });

    expect(list1.length).to.equal(1);
    expect(list1[0].value).to.equal(insertValue);
    expect(list1[0].dateValue).to.equals("2021-01-01 00:00:00");
    expect(list1[0].createBy).to.equals("djd1");
    expect(list1[0].createDate).to.equals("2020-01-01 00:00:00");
    expect(list1[0].updateBy).to.equals("djd1");
    expect(list1[0].updateDate).to.equals("2020-01-01 00:00:00");

    await Replace.replace(conn, {
      data: {
        id: 14,
        value: insertValue,
        dateValue: "2023-01-01",
      },
      table: tableName3,
    });
    const list2 = await Select.select<IHash>(conn, {
      sql: `select value, convert(char(19), dateValue, 120) as dateValue, createBy, convert(char(19), createDate, 120) as createDate, updateBy, convert(char(19), updateDate, 120) as updateDate from ${tableName3} where id = 14`,
    });

    expect(list2.length).to.equal(1);
    expect(list2[0].value).to.equal(insertValue);
    expect(list2[0].dateValue).to.equals("2023-01-01 00:00:00");
    expect(list2[0].createBy).to.equals("djd1");
    expect(list2[0].createDate).to.equals("2020-01-01 00:00:00");
    expect(list2[0].updateBy).to.equals("djd1");
    expect(list2[0].updateDate).to.equals("2020-01-01 00:00:00");
  });

  it("test2 给 createBy, createDate, 设空值 updateBy, updateDate, 并且操作里又传入时, 以操作数据为准", async () => {
    const insertValue = `value${Math.random()}`;
    await Replace.replace(conn, {
      data: {
        id: 13,
        value: insertValue,
        dateValue: "2025-01-01",
        updateBy: null,
        updateDate: null,
      },
      updateBy: "djd42",
      updateDate: "2025-01-05",
      table: tableName3,
    });
    const list = await Select.select<IHash>(conn, {
      sql: `select value, convert(char(19), dateValue, 120) as dateValue, createBy, convert(char(19), createDate, 120) as createDate, updateBy, convert(char(19), updateDate, 120) as updateDate from ${tableName3} where id = 13`,
    });

    expect(list.length).to.equal(1);
    expect(list[0].value).to.equal(insertValue);
    expect(list[0].dateValue).to.equals("2025-01-01 00:00:00");
    expect(list[0].createBy).to.equals(null);
    expect(list[0].createDate).to.equals(null);
    expect(list[0].updateBy).to.equals(null);
    expect(list[0].updateDate).to.equals(null);
  });

  it("test2 给 createBy, createDate, 设空值 updateBy, updateDate, 并且操作里又传入时, 以操作数据为准", async () => {
    const insertValue = `value${Math.random()}`;
    await Replace.replace(conn, {
      data: {
        id: 13,
        value: insertValue,
        dateValue: "2025-01-01",
        updateBy: "djd2",
        updateDate: "2021-01-01",
      },
      updateBy: null,
      updateDate: null,
      table: tableName3,
    });
    const list = await Select.select<IHash>(conn, {
      sql: `select value, convert(char(19), dateValue, 120) as dateValue, createBy, convert(char(19), createDate, 120) as createDate, updateBy, convert(char(19), updateDate, 120) as updateDate from ${tableName3} where id = 13`,
    });

    expect(list.length).to.equal(1);
    expect(list[0].value).to.equal(insertValue);
    expect(list[0].dateValue).to.equals("2025-01-01 00:00:00");
    expect(list[0].createBy).to.equals(null);
    expect(list[0].createDate).to.equals(null);
    expect(list[0].updateBy).to.equals("djd2");
    expect(list[0].updateDate).to.equals("2021-01-01 00:00:00");

    await Replace.replace(conn, {
      data: {
        id: 13,
        value: insertValue,
        dateValue: "2025-01-01",
      },
      updateBy: null,
      updateDate: null,
      table: tableName3,
    });
    const list2 = await Select.select<IHash>(conn, {
      sql: `select value, convert(char(19), dateValue, 120) as dateValue, createBy, convert(char(19), createDate, 120) as createDate, updateBy, convert(char(19), updateDate, 120) as updateDate from ${tableName3} where id = 13`,
    });

    expect(list2.length).to.equal(1);
    expect(list2[0].value).to.equal(insertValue);
    expect(list2[0].dateValue).to.equals("2025-01-01 00:00:00");
    expect(list2[0].createBy).to.equals(null);
    expect(list2[0].createDate).to.equals(null);
    expect(list2[0].updateBy).to.equals(null);
    expect(list2[0].updateDate).to.equals(null);
  });

  it("replace getdate must be success", async () => {
    await Replace.replace(conn, {
      data: { id: 0, dateValue: DataType.getdate },
      table: tableName5,
    });

    const rowData1 = await Select.selectTop1<IHash>(conn, {
      sql: `select value, convert(char(19), dateValue, 120) as dateValue from ${tableName5} where id=?`,
      where: [0],
    });

    expect(rowData1 !== null).to.be.true;
    expect(getMillToNow(rowData1.dateValue)).to.lessThan(1000);

    await Replace.replace(conn, {
      data: { id: 10, dateValue: DataType.getdate },
      table: tableName5,
    });

    const rowData2 = await Select.selectTop1<IHash>(conn, {
      sql: `select value, convert(char(19), dateValue, 120) as dateValue from ${tableName5} where id=?`,
      where: [10],
    });

    expect(rowData2 !== null).to.be.true;
    expect(getMillToNow(rowData2.dateValue)).to.lessThan(1000);
  });
});
