import { expect } from "chai";
import "mocha";
import { initTable } from "./DataInit";
import { ConnectionHelper, Save, Select, SaveType, ConnectionPool } from "../src/index";
import { getConnectionConfig } from "./connectionConfig";
import { IHash } from "../src/interface/iHash";

describe("Save", function () {
  let tableName = "tbl_test_save";
  let tableName3 = "tbl_test_save3";
  let conn: ConnectionPool;

  before(async () => {
    conn = await ConnectionHelper.create(getConnectionConfig());
    await initTable(conn, tableName, false);
    await initTable(conn, tableName3, true);
  });
  after(async () => {
    await ConnectionHelper.close(conn);
  });

  it("save must be success", async () => {
    let insertValue = `value${Math.random()}`;

    await Save.save(conn, {
      data: { id: 10, value: insertValue },
      table: tableName,
      saveType: SaveType.insert,
    });

    let rowData = await Select.selectTop1<IHash>(conn, {
      sql: `select value from ${tableName} where id=?`,
      where: [10],
    });
    expect(rowData.value).to.equal(insertValue);

    insertValue = `value${Math.random()}_new1`;
    await Save.save(conn, {
      data: { id: 10, value: insertValue },
      table: tableName,
      saveType: SaveType.update,
    });

    rowData = await Select.selectTop1(conn, {
      sql: `select value from ${tableName} where id=?`,
      where: [10],
    });
    expect(rowData.value).to.equal(insertValue);

    await Save.save(conn, {
      data: { id: 9 },
      table: tableName,
      saveType: SaveType.delete,
    });

    rowData = await Select.selectTop1(conn, {
      sql: `select value from ${tableName} where id=?`,
      where: [9],
    });
    expect(rowData).to.be.null;

    insertValue = `value${Math.random()}_new3`;
    await Save.save(conn, {
      data: { id: 8, value: insertValue },
      table: tableName,
      saveType: SaveType.replace,
    });

    rowData = await Select.selectTop1(conn, {
      sql: `select value from ${tableName} where id=?`,
      where: [8],
    });
    expect(rowData.value).to.equal(insertValue);
  });

  it("saves must be success", async () => {
    let insertValue = `value${Math.random()}`;

    await Save.saves(conn, [
      {
        data: { id: 11, value: insertValue },
        table: tableName,
        saveType: SaveType.insert,
      },
      {
        data: { id: 111, value: insertValue },
        table: tableName,
        saveType: SaveType.insert,
      },
      {
        data: { id: 112, value: insertValue },
        table: tableName,
        saveType: SaveType.insert,
      },
    ]);

    let rowData = await Select.selectTop1<IHash>(conn, {
      sql: `select value from ${tableName} where id=?`,
      where: [11],
    });
    expect(rowData.value).to.equal(insertValue);

    insertValue = `value${Math.random()}_new1`;
    await Save.saves(conn, [
      {
        data: { id: 11, value: insertValue },
        table: tableName,
        saveType: SaveType.update,
      },
    ]);

    rowData = await Select.selectTop1<IHash>(conn, {
      sql: `select value from ${tableName} where id=?`,
      where: [11],
    });
    expect(rowData.value).to.equal(insertValue);

    await Save.saves(conn, [
      {
        data: { id: 7 },
        table: tableName,
        saveType: SaveType.delete,
      },
    ]);

    rowData = await Select.selectTop1<IHash>(conn, {
      sql: `select value from ${tableName} where id=?`,
      where: [7],
    });
    expect(rowData).to.be.null;

    insertValue = `value${Math.random()}_new3`;
    await Save.saves(conn, [
      {
        data: { id: 6, value: insertValue },
        table: tableName,
        saveType: SaveType.replace,
      },
    ]);

    rowData = await Select.selectTop1<IHash>(conn, {
      sql: `select value from ${tableName} where id=?`,
      where: [6],
    });
    expect(rowData.value).to.equal(insertValue);

    // 插入重复键时报错
    insertValue = `value${Math.random()}_new3`;
    await Save.saves(conn, [
      {
        data: { id: 600, value: insertValue },
        table: tableName,
        saveType: SaveType.insert,
      },
      {
        data: { id: 6, value: insertValue },
        table: tableName,
        saveType: SaveType.insert,
      },
    ])
      .then(() => {
        expect(true).to.be.false; // 进到这里就有问题
      })
      .catch((err) => {
        expect(err.code).to.equal(`EREQUEST`);
      });

    // 插入主键为空时报错
    insertValue = `value${Math.random()}_new3`;
    await Save.saves(conn, [
      {
        data: { value: insertValue },
        table: tableName,
        saveType: SaveType.insert,
      },
      {
        data: { value: insertValue },
        table: tableName,
        saveType: SaveType.insert,
      },
    ])
      .then(() => {
        expect(true).to.be.false; // 进到这里就有问题
      })
      .catch((err) => {
        expect(err.code).to.equal(`EREQUEST`);
      });
  });

  it("savesSeq must be success", async () => {
    let insertValue = `value${Math.random()}`;

    await Save.savesSeq(conn, [
      {
        data: { id: 12, value: insertValue },
        table: tableName,
        saveType: SaveType.insert,
      },
      {
        data: { id: 121, value: insertValue },
        table: tableName,
        saveType: SaveType.insert,
      },
      {
        data: { id: 122, value: insertValue },
        table: tableName,
        saveType: SaveType.insert,
      },
    ]);

    let rowData = await Select.selectTop1<IHash>(conn, {
      sql: `select value from ${tableName} where id=?`,
      where: [12],
    });
    expect(rowData.value).to.equal(insertValue);

    insertValue = `value${Math.random()}_new1`;
    await Save.savesSeq(conn, [
      {
        data: { id: 12, value: insertValue },
        table: tableName,
        saveType: SaveType.update,
      },
    ]);

    rowData = await Select.selectTop1<IHash>(conn, {
      sql: `select value from ${tableName} where id=?`,
      where: [12],
    });
    expect(rowData.value).to.equal(insertValue);

    await Save.savesSeq(conn, [
      {
        data: { id: 5 },
        table: tableName,
        saveType: SaveType.delete,
      },
    ]);

    rowData = await Select.selectTop1<IHash>(conn, {
      sql: `select value from ${tableName} where id=?`,
      where: [5],
    });
    expect(rowData).to.be.null;

    insertValue = `value${Math.random()}_new3`;
    await Save.savesSeq(conn, [
      {
        data: { id: 4, value: insertValue },
        table: tableName,
        saveType: SaveType.replace,
      },
    ]);

    rowData = await Select.selectTop1<IHash>(conn, {
      sql: `select value from ${tableName} where id=?`,
      where: [4],
    });
    expect(rowData.value).to.equal(insertValue);
  });

  it("savesSeq err", async () => {
    let insertValue = `value${Math.random()}`;

    try {
      await Save.savesSeq(conn, [
        {
          data: { id: 200, value: insertValue },
          table: tableName,
          saveType: SaveType.insert,
        },
        {
          data: { id: 200, value: insertValue },
          table: tableName,
          saveType: SaveType.insert,
        },
      ]);
    } catch (err) {
      expect(err.code).to.equal(`EREQUEST`);
    }

    let rowData = await Select.selectTop1<IHash>(conn, {
      sql: `select value from ${tableName} where id=?`,
      where: [200],
    });
    expect(rowData.value).to.equal(insertValue);
  });

  it("savesSeqWithTran must be success", async () => {
    let insertValue = `value${Math.random()}`;

    try {
      await Save.savesSeqWithTran(conn, [
        {
          data: { id: 400, value: insertValue },
          table: tableName,
          saveType: SaveType.insert,
        },
        {
          data: { id: 401, value: insertValue },
          table: tableName,
          saveType: SaveType.insert,
        },
      ]);
    } catch (err) {
      expect(err.code).to.equal(`EREQUEST`);
    }

    let rowData = await Select.selectTop1<IHash>(conn, {
      sql: `select value from ${tableName} where id=?`,
      where: [400],
    });
    expect(rowData.value).to.equal(insertValue);

    rowData = await Select.selectTop1<IHash>(conn, {
      sql: `select value from ${tableName} where id=?`,
      where: [401],
    });
    expect(rowData.value).to.equal(insertValue);
  });

  it("savesSeqWithTran err", async () => {
    let insertValue = `value${Math.random()}`;

    try {
      await Save.savesSeqWithTran(conn, [
        {
          data: { id: 402, value: insertValue },
          table: tableName,
          saveType: SaveType.insert,
        },
        {
          data: { id: 402, value: insertValue },
          table: tableName,
          saveType: SaveType.insert,
        },
      ]);
    } catch (err) {
      expect(err.code).to.equal(`EREQUEST`);
    }

    let rowData = await Select.selectTop1<IHash>(conn, {
      sql: `select value from ${tableName} where id=?`,
      where: [402],
    });
    expect(rowData).to.be.null;
  });

  it("save must be success 2", async () => {
    let insertValue = `value${Math.random()}`;

    await Save.save(conn, {
      data: { id: 601, value: insertValue },
      table: tableName,
      saveType: SaveType.insert,
      createBy: "djd1",
      createDate: "2021-11-16 10:11:12",
      updateBy: "djd2",
      updateDate: "2021-11-16 10:11:13",
    });

    let rowData = await Select.selectTop1<IHash>(conn, {
      sql: `select value, createBy, convert(char(19), createDate, 120) as createDate, updateBy, convert(char(19), updateDate, 120) as updateDate from ${tableName} where id=?`,
      where: [601],
    });
    expect(rowData.value).to.equal(insertValue);
    expect(rowData.createBy).to.equal("djd1");
    expect(rowData.createDate).to.equal("2021-11-16 10:11:12");
    expect(rowData.updateBy).to.equal("djd2");
    expect(rowData.updateDate).to.equal("2021-11-16 10:11:13");
  });

  it("save must be success replace", async () => {
    let insertValue = `value${Math.random()}`;

    await Save.save(conn, {
      data: { id: 601, value: insertValue },
      table: tableName,
      saveType: SaveType.replace,
      createBy: "djd3",
      createDate: "2021-11-16 10:11:15",
      updateBy: "djd4",
      updateDate: "2021-11-16 10:11:16",
    });

    let rowData = await Select.selectTop1<IHash>(conn, {
      sql: `select value, createBy, convert(char(19), createDate, 120) as createDate, updateBy, convert(char(19), updateDate, 120) as updateDate from ${tableName} where id=?`,
      where: [601],
    });
    expect(rowData.value).to.equal(insertValue);
    expect(rowData.createBy).to.equal("djd1");
    expect(rowData.createDate).to.equal("2021-11-16 10:11:12");
    expect(rowData.updateBy).to.equal("djd4");
    expect(rowData.updateDate).to.equal("2021-11-16 10:11:16");
  });

  it("save must be success update", async () => {
    let insertValue = `value${Math.random()}`;

    await Save.save(conn, {
      data: { id: 601, value: insertValue },
      table: tableName,
      saveType: SaveType.update,
      createBy: "djd5",
      createDate: "2021-11-16 10:11:25",
      updateBy: "djd6",
      updateDate: "2021-11-16 10:11:26",
    });

    let rowData = await Select.selectTop1<IHash>(conn, {
      sql: `select value, createBy, convert(char(19), createDate, 120) as createDate, updateBy, convert(char(19), updateDate, 120) as updateDate from ${tableName} where id=?`,
      where: [601],
    });
    expect(rowData.value).to.equal(insertValue);
    expect(rowData.createBy).to.equal("djd1");
    expect(rowData.createDate).to.equal("2021-11-16 10:11:12");
    expect(rowData.updateBy).to.equal("djd6");
    expect(rowData.updateDate).to.equal("2021-11-16 10:11:26");
  });

  it("save must be success replace", async () => {
    let insertValue = `value${Math.random()}`;

    await Save.save(conn, {
      data: { id: 602, value: insertValue },
      table: tableName,
      saveType: SaveType.replace,
      createBy: "djd7",
      createDate: "2021-11-16 10:11:35",
      updateBy: "djd8",
      updateDate: "2021-11-16 10:11:36",
    });

    let rowData = await Select.selectTop1<IHash>(conn, {
      sql: `select value, createBy, convert(char(19), createDate, 120) as createDate, updateBy, convert(char(19), updateDate, 120) as updateDate from ${tableName} where id=?`,
      where: [602],
    });
    expect(rowData.value).to.equal(insertValue);
    expect(rowData.createBy).to.equal("djd7");
    expect(rowData.createDate).to.equal("2021-11-16 10:11:35");
    expect(rowData.updateBy).to.equal("djd8");
    expect(rowData.updateDate).to.equal("2021-11-16 10:11:36");
  });

  it("save must be success saves", async () => {
    let insertValue1 = `value${Math.random()}`;
    let insertValue2 = `value${Math.random()}`;

    await Save.saves(conn, [
      {
        data: { id: 603, value: insertValue1 },
        table: tableName,
        saveType: SaveType.replace,
        createBy: "djd7",
        createDate: "2021-11-16 10:11:35",
        updateBy: "djd8",
        updateDate: "2021-11-16 10:11:36",
      },
      {
        data: { id: 604, value: insertValue2 },
        table: tableName,
        saveType: SaveType.replace,
        createBy: "djd9",
        createDate: "2021-11-16 11:11:35",
        updateBy: "djd10",
        updateDate: "2021-11-16 11:11:36",
      },
    ]);

    let rowData = await Select.select<IHash>(conn, {
      sql: `select value, createBy, convert(char(19), createDate, 120) as createDate, updateBy, convert(char(19), updateDate, 120) as updateDate from ${tableName} where id in (?, ?) order by id`,
      where: [603, 604],
    });

    expect(rowData[0].value).to.equal(insertValue1);
    expect(rowData[1].value).to.equal(insertValue2);
    expect(rowData[0].createBy).to.equal("djd7");
    expect(rowData[1].createBy).to.equal("djd9");

    expect(rowData[0].createDate).to.equal("2021-11-16 10:11:35");
    expect(rowData[1].createDate).to.equal("2021-11-16 11:11:35");
    expect(rowData[0].updateBy).to.equal("djd8");
    expect(rowData[1].updateBy).to.equal("djd10");
    expect(rowData[0].updateDate).to.equal("2021-11-16 10:11:36");
    expect(rowData[1].updateDate).to.equal("2021-11-16 11:11:36");
  });

  it("save must be success savesSeq", async () => {
    let insertValue1 = `value${Math.random()}`;
    let insertValue2 = `value${Math.random()}`;

    await Save.savesSeq(conn, [
      {
        data: { id: 605, value: insertValue1 },
        table: tableName,
        saveType: SaveType.replace,
        createBy: "djd7",
        createDate: "2021-11-16 10:11:35",
        updateBy: "djd8",
        updateDate: "2021-11-16 10:11:36",
      },
      {
        data: { id: 606, value: insertValue2 },
        table: tableName,
        saveType: SaveType.replace,
        createBy: "djd9",
        createDate: "2021-11-16 11:11:35",
        updateBy: "djd10",
        updateDate: "2021-11-16 11:11:36",
      },
    ]);

    let rowData = await Select.select<IHash>(conn, {
      sql: `select value, createBy, convert(char(19), createDate, 120) as createDate, updateBy, convert(char(19), updateDate, 120) as updateDate from ${tableName} where id in (?, ?) order by id`,
      where: [605, 606],
    });

    expect(rowData[0].value).to.equal(insertValue1);
    expect(rowData[1].value).to.equal(insertValue2);
    expect(rowData[0].createBy).to.equal("djd7");
    expect(rowData[1].createBy).to.equal("djd9");

    expect(rowData[0].createDate).to.equal("2021-11-16 10:11:35");
    expect(rowData[1].createDate).to.equal("2021-11-16 11:11:35");
    expect(rowData[0].updateBy).to.equal("djd8");
    expect(rowData[1].updateBy).to.equal("djd10");
    expect(rowData[0].updateDate).to.equal("2021-11-16 10:11:36");
    expect(rowData[1].updateDate).to.equal("2021-11-16 11:11:36");
  });
















  it("test2 当数据里指定 createBy, updateBy, createDate, updateDate时, 直接更新", async () => {
    const insertValue = `value${Math.random()}`;
    await Save.save(conn, {
      data: {
        id: 1,
        value: insertValue,
        dateValue: "2021-01-01",
        createBy: "djd1",
        createDate: "2021-01-02",
        updateBy: "djd2",
        updateDate: "2021-01-03",
      },
      saveType: SaveType.replace,
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
    await Save.save(conn, {
      data: {
        id: 2,
        value: insertValue,
        dateValue: "2021-01-01",
        createBy: "djd1",
        createDate: "2021-01-02",
        updateBy: "djd2",
        updateDate: "2021-01-03",
      },
      saveType: SaveType.replace,
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
    await Save.save(conn, {
      data: {
        id: 3,
        value: insertValue,
        dateValue: "2021-01-01",
      },
      saveType: SaveType.replace,
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
    await Save.save(conn, {
      data: {
        id: 4,
        value: insertValue,
        dateValue: "2021-01-01",
      },
      saveType: SaveType.replace,
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
    await Save.save(conn, {
      data: {
        value: insertValue,
        dateValue: "2023-01-01",
        createBy: "djd11",
        createDate: "2023-01-02",
        updateBy: "djd21",
        updateDate: "2023-01-03",
      },
      saveType: SaveType.replace,
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
    await Save.save(conn, {
      data: {
        value: insertValue,
        dateValue: "2024-01-01",
        createBy: "djd12",
        createDate: "2024-01-02",
        updateBy: "djd22",
        updateDate: "2024-01-03",
      },
      saveType: SaveType.replace,
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
    await Save.save(conn, {
      data: {
        value: insertValue,
        dateValue: "2025-01-01",
      },
      saveType: SaveType.replace,
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
    await Save.save(conn, {
      data: {
        value: insertValue,
        dateValue: "2021-01-01",
        createBy: "djd1",
        updateBy: "djd1",
        createDate: "2020-01-01",
        updateDate: "2020-01-01",
      },
      saveType: SaveType.replace,
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

    await Save.save(conn, {
      data: {
        id: 14,
        value: insertValue,
        dateValue: "2023-01-01",
      },
      saveType: SaveType.replace,
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
    await Save.save(conn, {
      data: {
        id: 13,
        value: insertValue,
        dateValue: "2025-01-01",
        updateBy: null,
        updateDate: null,
      },
      saveType: SaveType.replace,
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
    await Save.save(conn, {
      data: {
        id: 13,
        value: insertValue,
        dateValue: "2025-01-01",
        updateBy: "djd2",
        updateDate: "2021-01-01",
      },
      saveType: SaveType.replace,
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


    await Save.save(conn, {
      data: {
        id: 13,
        value: insertValue,
        dateValue: "2025-01-01",
      },
      saveType: SaveType.replace,
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
});
