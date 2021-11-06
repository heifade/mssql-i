import { expect } from "chai";
import "mocha";
import { initTable } from "./DataInit";
import { ConnectionHelper, Insert, Select, ConnectionPool, Transaction } from "../src/index";
import { getConnectionConfig } from "./connectionConfig";

describe("Insert", function () {
  let tableName = "tbl_test_insert";
  let tableName2 = "tbl_test_insert2";
  let conn: ConnectionPool;

  before(async () => {
    conn = await ConnectionHelper.create(getConnectionConfig());
    await initTable(conn, tableName, true);
    await initTable(conn, tableName2, true);
  });
  after(async () => {
    await ConnectionHelper.close(conn);
  });

  it("insert must be success", async () => {
    let insertValue = `value${Math.random()}`;

    let result = await Insert.insert(conn, {
      data: { value: insertValue, value2: 1, id: 1 },
      table: tableName,
      createBy: "djd3",
      createDate: "2021-11-05 12:23:47",
      updateBy: "djd4",
      updateDate: "2021-11-05 12:23:48",
      getIdentityValue: true,
    });

    let insertId = result.identityValue;

    let rowData = await Select.selectTop1(conn, {
      sql: `select value, createBy, convert(char(19), createDate, 120) as createDate, updateBy, convert(char(19), updateDate, 120) as updateDate from ${tableName} where id=?`,
      where: [insertId],
    });

    expect(rowData !== null).to.be.true;
    expect(rowData.value).to.equal(insertValue);
    expect(rowData.createBy).to.equal("djd3");
    expect(rowData.createDate).to.equal("2021-11-05 12:23:47");
    expect(rowData.updateBy).to.equal("djd4");
    expect(rowData.updateDate).to.equal("2021-11-05 12:23:48");
  });

  it("insert with tran must be success", async () => {
    let insertValue = `value${Math.random()}`;

    const tran = await Transaction.begin(conn);

    let result = await Insert.insert(
      conn,
      {
        data: { value: insertValue },
        table: tableName,
        createBy: "djd31",
        createDate: "2021-12-05 12:23:47",
        updateBy: "djd41",
        updateDate: "2021-12-05 12:23:48",
        getIdentityValue: true,
      },
      tran
    );

    await tran.commit();

    let insertId = result.identityValue;

    let rowData = await Select.selectTop1(conn, {
      sql: `select value, createBy, convert(char(19), createDate, 120) as createDate, updateBy, convert(char(19), updateDate, 120) as updateDate from ${tableName} where id=?`,
      where: [insertId],
    });

    expect(rowData != null).to.be.true;
    expect(rowData.value).to.equal(insertValue);
    expect(rowData.createBy).to.equal("djd31");
    expect(rowData.createDate).to.equal("2021-12-05 12:23:47");
    expect(rowData.updateBy).to.equal("djd41");
    expect(rowData.updateDate).to.equal("2021-12-05 12:23:48");
  });

  it("insert data can not be null or empty", async () => {
    try {
      await Insert.insert(conn, {
        data: null,
        table: tableName,
        createBy: "djd3",
        createDate: "2021-11-05 12:23:47",
        updateBy: "djd4",
        updateDate: "2021-11-05 12:23:48",
      });
      expect(true).to.equal(false); // 不能进这里
    } catch (e) {
      expect(e.message).to.equal("pars.data can not be null or empty!");
    }
  });

  it("insert table can not be null or empty", async () => {
    try {
      await Insert.insert(conn, {
        data: { id: 1 },
        table: null,
        createBy: "djd3",
        createDate: "2021-11-05 12:23:47",
        updateBy: "djd4",
        updateDate: "2021-11-05 12:23:48",
      });
      expect(true).to.equal(false); // 不能进这里
    } catch (e) {
      expect(e.message).to.equal("pars.table can not be null or empty!");
    }
  });

  it("insert table can not exists", async () => {
    try {
      await Insert.insert(conn, {
        data: { id: 1 },
        table: "t12345",
        createBy: "djd3",
        createDate: "2021-11-05 12:23:47",
        updateBy: "djd4",
        updateDate: "2021-11-05 12:23:48",
      });
      expect(true).to.equal(false); // 不能进这里
    } catch (e) {
      expect(e.message).to.equal("Table 't12345' is not exists!");
    }
  });

  it("insert multiple with tran must be success", async () => {
    let insertValue = `value${Math.random()}-123`;

    const tran = await Transaction.begin(conn);

    await Insert.inserts(
      conn,
      {
        data: [
          { value: insertValue, dateValue: "2021-11-05" },
          { value: insertValue, dateValue: "2021-11-05" },
          { value: insertValue, dateValue: "2021-11-05" },
          { value: insertValue, dateValue: "2021-11-05" },
          { value: insertValue, dateValue: "2021-11-05" },
        ],
        table: tableName,
        createBy: "djd1",
        createDate: "2021-11-05 12:23:45",
        updateBy: "djd2",
        updateDate: "2021-11-05 12:23:46",
      },
      tran
    );
    await tran.commit();

    let rowData = await Select.select(conn, {
      sql: `select value, createBy, convert(char(19), createDate, 120) as createDate, updateBy, convert(char(19), updateDate, 120) as updateDate from ${tableName} where dateValue = '2021-11-05' `,
      where: [],
    });
    expect(rowData.length).to.equal(5);
    expect(rowData[0].createBy).to.equal("djd1");
    expect(rowData[0].createDate).to.equal("2021-11-05 12:23:45");
    expect(rowData[0].updateBy).to.equal("djd2");
    expect(rowData[0].updateDate).to.equal("2021-11-05 12:23:46");
  });

  it("insert multiple must be success", async () => {
    let insertValue = `value${Math.random()}-12345`;

    await Insert.inserts(conn, {
      data: [
        { value: insertValue, dateValue: "2031-11-05" },
        { value: insertValue, dateValue: "2031-11-05" },
        { value: insertValue, dateValue: "2031-11-05" },
        { value: insertValue, dateValue: "2031-11-05" },
        { value: insertValue, dateValue: "2031-11-05" },
      ],
      table: tableName,
      createBy: "djd16",
      createDate: "2020-11-05 12:23:45",
      updateBy: "djd27",
      updateDate: "2020-11-05 12:23:46",
    });

    let rowData = await Select.select(conn, {
      sql: `select value, createBy, convert(char(19), createDate, 120) as createDate, updateBy, convert(char(19), updateDate, 120) as updateDate from ${tableName} where dateValue = '2031-11-05' `,
      where: [],
    });
    expect(rowData.length).to.equal(5);
    expect(rowData[0].createBy).to.equal("djd16");
    expect(rowData[0].createDate).to.equal("2020-11-05 12:23:45");
    expect(rowData[0].updateBy).to.equal("djd27");
    expect(rowData[0].updateDate).to.equal("2020-11-05 12:23:46");
  });

  it("insert multiple with tran roll back must be success", async () => {
    let insertValue = `value${Math.random()}-124`;

    const tran = await Transaction.begin(conn);

    await Insert.inserts(
      conn,
      {
        data: [
          { value: insertValue, dateValue: "2021-11-06" },
          { value: insertValue, dateValue: "2021-11-06" },
          { value: insertValue, dateValue: "2021-11-06" },
          { value: insertValue, dateValue: "2021-11-06" },
          { value: insertValue, dateValue: "2021-11-06" },
        ],
        table: tableName,
      },
      tran
    );
    await tran.rollback();

    let rowData = await Select.select(conn, {
      sql: `select * from ${tableName} where dateValue = '2021-11-06' `,
      where: [],
    });
    expect(rowData.length).to.equal(0);
  });

  it("when pars.data is null", async () => {
    await Insert.insert(conn, {
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

  it("when pars.data is null", async () => {
    await Insert.inserts(conn, {
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

    await Insert.insert(conn, {
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
  it("when pars.table is null", async () => {
    let insertValue = `value${Math.random()}`;

    await Insert.inserts(conn, {
      data: [{ value: insertValue }],
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

    await Insert.insert(conn, {
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
  it("when table is not exists", async () => {
    let insertValue = `value${Math.random()}`;

    let tableName = `tbl_not_exists`;

    await Insert.inserts(conn, {
      data: [{ value: insertValue }],
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
    let insertValue = `value${Math.random()}`;

    try {
      await Insert.insert(conn, {
        data: {
          value: insertValue,
          dateValue: ",,,",
        },
        table: tableName,
      });
      expect(true).to.be.false; // 进到这里就有问题
    } catch (err) {
      expect(err.code).to.equal(`EREQUEST`);
    }
  });

  it("test2 当数据里指定 createBy, updateBy, createDate, updateDate时, 直接插入", async () => {
    const insertValue = `value${Math.random()}`;
    await Insert.insert(conn, {
      data: {
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
      sql: `select value, convert(char(19), dateValue, 120) as dateValue, createBy, convert(char(19), createDate, 120) as createDate, updateBy, convert(char(19), updateDate, 120) as updateDate from ${tableName2} where id = 11`,
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
    await Insert.insert(conn, {
      data: {
        value: insertValue,
        dateValue: "2021-01-01",
        createBy: "djd1",
        createDate: "2021-01-02",
        updateBy: "djd2",
        updateDate: "2021-01-03",
      },
      createBy: "djd3",
      createDate: "2021-01-04",
      updateBy: "djd4",
      updateDate: "2021-01-05",
      table: tableName2,
    });

    const list = await Select.select(conn, {
      sql: `select value, convert(char(19), dateValue, 120) as dateValue, createBy, convert(char(19), createDate, 120) as createDate, updateBy, convert(char(19), updateDate, 120) as updateDate from ${tableName2} where id = 12`,
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
    await Insert.insert(conn, {
      data: {
        value: insertValue,
        dateValue: "2021-01-01",
      },
      createBy: "djd3",
      createDate: "2021-01-04",
      updateBy: "djd4",
      updateDate: "2021-01-05",
      table: tableName2,
    });
    const list = await Select.select(conn, {
      sql: `select value, convert(char(19), dateValue, 120) as dateValue, createBy, convert(char(19), createDate, 120) as createDate, updateBy, convert(char(19), updateDate, 120) as updateDate from ${tableName2} where id = 13`,
    });

    expect(list.length).to.equal(1);
    expect(list[0].value).to.equal(insertValue);
    expect(list[0].dateValue).to.equals("2021-01-01 00:00:00");
    expect(list[0].createBy).to.equals("djd3");
    expect(list[0].createDate).to.equals("2021-01-04 00:00:00");
    expect(list[0].updateBy).to.equals("djd4");
    expect(list[0].updateDate).to.equals("2021-01-05 00:00:00");
  });
  it("test2 当数据里没指定 createBy, updateBy, createDate, updateDate, 并且操作里又没指定时, 为空", async () => {
    const insertValue = `value${Math.random()}`;
    await Insert.insert(conn, {
      data: {
        value: insertValue,
        dateValue: "2021-01-01",
      },
      table: tableName2,
    });
    const list = await Select.select(conn, {
      sql: `select value, convert(char(19), dateValue, 120) as dateValue, createBy, convert(char(19), createDate, 120) as createDate, updateBy, convert(char(19), updateDate, 120) as updateDate from ${tableName2} where id = 14`,
    });

    expect(list.length).to.equal(1);
    expect(list[0].value).to.equal(insertValue);
    expect(list[0].dateValue).to.equals("2021-01-01 00:00:00");
    expect(list[0].createBy).to.equals(null);
    expect(list[0].createDate).to.equals(null);
    expect(list[0].updateBy).to.equals(null);
    expect(list[0].updateDate).to.equals(null);
  });
});
