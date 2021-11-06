import { expect } from "chai";
import "mocha";
import { initTable } from "./DataInit";
import { ConnectionHelper, Update, Select, ConnectionPool, Transaction } from "../src/index";
import { getConnectionConfig } from "./connectionConfig";

describe("Update", function () {
  let tableName = "tbl_test_update";
  let tableName2 = "tbl_test_update2";
  let conn: ConnectionPool;
  before(async () => {
    conn = await ConnectionHelper.create(getConnectionConfig());
    await initTable(conn, tableName, false);
    await initTable(conn, tableName2, false);
  });
  after(async () => {
    await ConnectionHelper.close(conn);
  });

  it("update must be success", async () => {
    let newValue = `value${Math.random()}` + "_newValue1";

    let result = await Update.update(conn, {
      data: { id: 1, value: newValue },
      table: tableName,
    });

    let rowData = await Select.selectTop1(conn, {
      sql: `select * from ${tableName} where id=?`,
      where: [1],
    });

    expect(rowData.value).to.equal(newValue);

    newValue = `value${Math.random()}` + "_newValue2";

    result = await Update.updateByWhere(conn, {
      data: { value: newValue },
      table: tableName,
      where: { id: 2 },
    });

    rowData = await Select.selectTop1(conn, {
      sql: `select * from ${tableName} where id=?`,
      where: [2],
    });

    expect(rowData.value).to.equal(newValue);

    newValue = `value${Math.random()}` + "_newValue3";

    await Update.update(conn, {
      data: { id: 2, value: newValue },
      table: tableName,
    });

    rowData = await Select.selectTop1(conn, {
      sql: `select * from ${tableName} where id = ?`,
      where: [2],
    });

    expect(rowData.value).to.equal(newValue);
  });

  it("update with tran must be success", async () => {
    let newValue = `value${Math.random()}` + "_newValue11";

    let tran;
    try {
      tran = await Transaction.begin(conn);

      let result = await Update.update(
        conn,
        {
          data: { id: 1, value: newValue },
          table: tableName,
          updateBy: "djd1",
          updateDate: "2021-11-05 15:23:45",
        },
        tran
      );

      await Transaction.commit(tran);
    } catch (err) {
      await Transaction.rollback(tran);
    }

    let rowData = await Select.selectTop1(conn, {
      sql: `select * from ${tableName} where id=?`,
      where: [1],
    });

    expect(rowData.value).to.equal(newValue);

    newValue = `value${Math.random()}` + "_newValue22";

    try {
      tran = await Transaction.begin(conn);

      let result = await Update.updateByWhere(
        conn,
        {
          data: { value: newValue },
          table: tableName,
          where: { id: 2 },
          updateBy: "djd2",
          updateDate: "2021-11-05 23:45:56",
        },
        tran
      );

      await Transaction.commit(tran);
    } catch (err) {
      await Transaction.rollback(tran);
    }

    rowData = await Select.selectTop1(conn, {
      sql: `select value, createBy, convert(char(19), createDate, 120) as createDate, updateBy, convert(char(19), updateDate, 120) as updateDate from ${tableName} where id = ?`,
      where: [2],
    });

    expect(rowData.value).to.equal(newValue);
    expect(rowData.createBy).to.equal(null);
    expect(rowData.createDate).to.equal(null);
    expect(rowData.updateBy).to.equal("djd2");
    expect(rowData.updateDate).to.equal("2021-11-05 23:45:56");
  });

  it("when pars.data is null of update", async () => {
    await Update.update(conn, {
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

  it("when pars.data is null of updateByWhere", async () => {
    await Update.updateByWhere(conn, {
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

  it("when pars.table is null of update", async () => {
    let insertValue = `value${Math.random()}`;

    await Update.update(conn, {
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

  it("when pars.table is null of updateByWhere", async () => {
    let insertValue = `value${Math.random()}`;

    await Update.updateByWhere(conn, {
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

  it("when table 不存在 of update", async () => {
    let insertValue = `value${Math.random()}`;

    let tableName = `tbl_not_exists`;

    await Update.update(conn, {
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

  it("when table 不存在 of updateByWhere", async () => {
    let insertValue = `value${Math.random()}`;

    let tableName = `tbl_not_exists`;

    await Update.updateByWhere(conn, {
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

  it("update as data with no primary key", async () => {
    let insertValue = `value${Math.random()}_update5`;

    await Update.update(conn, {
      data: {
        value: insertValue,
      },
      table: tableName,
      onlyUpdateByPrimaryKey: false,
    });

    let rowData = await Select.selectTop1(conn, {
      sql: `select * from ${tableName}`,
    });

    expect(rowData.value).to.equal(insertValue);
  });

  it("when error of update", async () => {
    let insertValue = `123456789012345678901234567890123456789012345678901234567890`;

    await Update.update(conn, {
      data: {
        id: 1,
        dateValue: insertValue,
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

  it("when error of updateByWhere", async () => {
    let insertValue = `123456789012345678901234567890123456789012345678901234567890`;

    await Update.updateByWhere(conn, {
      data: {
        id: 2,
        dateValue: insertValue,
        value2: "aaa",
      },
      table: tableName,
      where: { id: 2 },
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
    await Update.update(conn, {
      data: {
        id: 1,
        value: insertValue,
        dateValue: "2021-01-01",
        createBy: "djd1",
        createDate: "2021-01-02",
        updateBy: "djd2",
        updateDate: "2021-01-03",
      },
      table: tableName2,
    });

    const list = await Select.select(conn, {
      sql: `select value, convert(char(19), dateValue, 120) as dateValue, createBy, convert(char(19), createDate, 120) as createDate, updateBy, convert(char(19), updateDate, 120) as updateDate from ${tableName2} where id = 1`,
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
    await Update.update(conn, {
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
      table: tableName2,
    });

    const list = await Select.select(conn, {
      sql: `select value, convert(char(19), dateValue, 120) as dateValue, createBy, convert(char(19), createDate, 120) as createDate, updateBy, convert(char(19), updateDate, 120) as updateDate from ${tableName2} where id = 2`,
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
    await Update.update(conn, {
      data: {
        id: 3,
        value: insertValue,
        dateValue: "2021-01-01",
      },
      updateBy: "djd4",
      updateDate: "2021-01-05",
      table: tableName2,
    });
    const list = await Select.select(conn, {
      sql: `select value, convert(char(19), dateValue, 120) as dateValue, createBy, convert(char(19), createDate, 120) as createDate, updateBy, convert(char(19), updateDate, 120) as updateDate from ${tableName2} where id = 3`,
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
    await Update.update(conn, {
      data: {
        id: 4,
        value: insertValue,
        dateValue: "2021-01-01",
      },
      table: tableName2,
    });
    const list = await Select.select(conn, {
      sql: `select value, convert(char(19), dateValue, 120) as dateValue, createBy, convert(char(19), createDate, 120) as createDate, updateBy, convert(char(19), updateDate, 120) as updateDate from ${tableName2} where id = 4`,
    });

    expect(list.length).to.equal(1);
    expect(list[0].value).to.equal(insertValue);
    expect(list[0].dateValue).to.equals("2021-01-01 00:00:00");
    expect(list[0].createBy).to.equals(null);
    expect(list[0].createDate).to.equals(null);
    expect(list[0].updateBy).to.equals(null);
    expect(list[0].updateDate).to.equals(null);
  });

  it("test2 当数据里指定 createBy, updateBy, createDate, updateDate时, 直接更新", async () => {
    const insertValue = `value${Math.random()}`;
    await Update.updateByWhere(conn, {
      data: {
        value: insertValue,
        dateValue: "2023-01-01",
        createBy: "djd3",
        createDate: "2023-01-02",
        updateBy: "djd4",
        updateDate: "2023-01-03",
      },
      where: { id: 1 },
      table: tableName2,
    });

    const list = await Select.select(conn, {
      sql: `select value, convert(char(19), dateValue, 120) as dateValue, createBy, convert(char(19), createDate, 120) as createDate, updateBy, convert(char(19), updateDate, 120) as updateDate from ${tableName2} where id = 1`,
    });

    expect(list.length).to.equal(1);
    expect(list[0].value).to.equal(insertValue);
    expect(list[0].dateValue).to.equals("2023-01-01 00:00:00");
    expect(list[0].createBy).to.equals("djd3");
    expect(list[0].createDate).to.equals("2023-01-02 00:00:00");
    expect(list[0].updateBy).to.equals("djd4");
    expect(list[0].updateDate).to.equals("2023-01-03 00:00:00");
  });

  it("test2 当数据里指定 createBy, updateBy, createDate, updateDate, 并且操作里又传入时, 以数据的为准", async () => {
    const insertValue = `value${Math.random()}`;
    await Update.updateByWhere(conn, {
      data: {
        value: insertValue,
        dateValue: "2023-01-01",
        createBy: "djd3",
        createDate: "2023-01-02",
        updateBy: "djd4",
        updateDate: "2023-01-03",
      },
      where: { id: 2 },
      updateBy: "djd5",
      updateDate: "2023-01-05",
      table: tableName2,
    });

    const list = await Select.select(conn, {
      sql: `select value, convert(char(19), dateValue, 120) as dateValue, createBy, convert(char(19), createDate, 120) as createDate, updateBy, convert(char(19), updateDate, 120) as updateDate from ${tableName2} where id = 2`,
    });

    expect(list.length).to.equal(1);
    expect(list[0].value).to.equal(insertValue);
    expect(list[0].dateValue).to.equals("2023-01-01 00:00:00");
    expect(list[0].createBy).to.equals("djd3");
    expect(list[0].createDate).to.equals("2023-01-02 00:00:00");
    expect(list[0].updateBy).to.equals("djd4");
    expect(list[0].updateDate).to.equals("2023-01-03 00:00:00");
  });
  it("test2 当数据里没指定 createBy, updateBy, createDate, updateDate, 并且操作里又传入时, 以操作数据为准", async () => {
    const insertValue = `value${Math.random()}`;
    await Update.updateByWhere(conn, {
      data: {
        value: insertValue,
        dateValue: "2023-01-01",
      },
      where: { id: 3 },
      updateBy: "djd5",
      updateDate: "2023-01-05",
      table: tableName2,
    });
    const list = await Select.select(conn, {
      sql: `select value, convert(char(19), dateValue, 120) as dateValue, createBy, convert(char(19), createDate, 120) as createDate, updateBy, convert(char(19), updateDate, 120) as updateDate from ${tableName2} where id = 3`,
    });

    expect(list.length).to.equal(1);
    expect(list[0].value).to.equal(insertValue);
    expect(list[0].dateValue).to.equals("2023-01-01 00:00:00");
    expect(list[0].createBy).to.equals(null);
    expect(list[0].createDate).to.equals(null);
    expect(list[0].updateBy).to.equals("djd5");
    expect(list[0].updateDate).to.equals("2023-01-05 00:00:00");
  });
  it("test2 当数据里没指定 createBy, updateBy, createDate, updateDate, 并且操作里又没指定时, 为空", async () => {
    const insertValue = `value${Math.random()}`;

    await Update.updateByWhere(conn, {
      data: {
        value: insertValue,
        dateValue: "2024-01-01",
        createBy: "djd1",
        updateBy: "djd1",
        createDate: "2020-01-01",
        updateDate: "2020-01-01",
      },
      where: { id: 4 },
      table: tableName2,
    });
    const list1 = await Select.select(conn, {
      sql: `select value, convert(char(19), dateValue, 120) as dateValue, createBy, convert(char(19), createDate, 120) as createDate, updateBy, convert(char(19), updateDate, 120) as updateDate from ${tableName2} where id = 4`,
    });

    expect(list1.length).to.equal(1);
    expect(list1[0].value).to.equal(insertValue);
    expect(list1[0].dateValue).to.equals("2024-01-01 00:00:00");
    expect(list1[0].createBy).to.equals("djd1");
    expect(list1[0].createDate).to.equals("2020-01-01 00:00:00");
    expect(list1[0].updateBy).to.equals("djd1");
    expect(list1[0].updateDate).to.equals("2020-01-01 00:00:00");

    await Update.updateByWhere(conn, {
      data: {
        value: insertValue,
        dateValue: "2025-01-01",
      },
      where: { id: 4 },
      table: tableName2,
    });
    const list = await Select.select(conn, {
      sql: `select value, convert(char(19), dateValue, 120) as dateValue, createBy, convert(char(19), createDate, 120) as createDate, updateBy, convert(char(19), updateDate, 120) as updateDate from ${tableName2} where id = 4`,
    });

    expect(list.length).to.equal(1);
    expect(list[0].value).to.equal(insertValue);
    expect(list[0].dateValue).to.equals("2025-01-01 00:00:00");
    expect(list1[0].createBy).to.equals("djd1");
    expect(list1[0].createDate).to.equals("2020-01-01 00:00:00");
    expect(list1[0].updateBy).to.equals("djd1");
    expect(list1[0].updateDate).to.equals("2020-01-01 00:00:00");
  });
});
