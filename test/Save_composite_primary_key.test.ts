import { expect } from "chai";
import "mocha";
import { initTable } from "./DataInit_composite_primary_key";
import { ConnectionHelper, Save, Select, SaveType, ConnectionPool } from "../src/index";
import { getConnectionConfig } from "./connectionConfig";
import { IHash } from "../src/interface/iHash";

describe("Save_composite_primary_key", function () {
  let tableName = "tbl_test_save_composite_primary_key";
  let conn: ConnectionPool;

  before(async () => {
    conn = await ConnectionHelper.create(getConnectionConfig());
    await initTable(conn, tableName);
  });
  after(async () => {
    await ConnectionHelper.close(conn);
  });

  it("save must be success", async () => {
    let insertValue = `value${Math.random()}`;

    await Save.save(conn, {
      data: { key1: 10, key2: 10, key3: 10, value: insertValue },
      table: tableName,
      saveType: SaveType.insert,
    });

    let rowData = await Select.selectTop1<IHash>(conn, {
      sql: `select value from ${tableName} where key1=? and key2=? and key3=?`,
      where: [10, 10, 10],
    });
    expect(rowData.value).to.equal(insertValue);

    insertValue = `value${Math.random()}_new1`;
    await Save.save(conn, {
      data: { key1: 10, key2: 10, key3: 10, value: insertValue },
      table: tableName,
      saveType: SaveType.update,
    });

    rowData = await Select.selectTop1<IHash>(conn, {
      sql: `select value from ${tableName} where key1=? and key2=? and key3=?`,
      where: [10, 10, 10],
    });
    expect(rowData.value).to.equal(insertValue);

    await Save.save(conn, {
      data: { key1: 9, key2: 9, key3: 9 },
      table: tableName,
      saveType: SaveType.delete,
    });

    rowData = await Select.selectTop1<IHash>(conn, {
      sql: `select value from ${tableName} where key1=? and key2=? and key3=?`,
      where: [9, 9, 9],
    });
    expect(rowData).to.be.null;

    insertValue = `value${Math.random()}_new3`;
    await Save.save(conn, {
      data: { key1: 8, key2: 8, key3: 8, value: insertValue },
      table: tableName,
      saveType: SaveType.replace,
    });

    rowData = await Select.selectTop1<IHash>(conn, {
      sql: `select value from ${tableName} where key1=? and key2=? and key3=?`,
      where: [8, 8, 8],
    });
    expect(rowData.value).to.equal(insertValue);
  });

  it("saves must be success", async () => {
    let insertValue = `value${Math.random()}`;

    await Save.saves(conn, [
      {
        data: { key1: 11, key2: 11, key3: 11, value: insertValue },
        table: tableName,
        saveType: SaveType.insert,
      },
      {
        data: { key1: 111, key2: 111, key3: 111, value: insertValue },
        table: tableName,
        saveType: SaveType.insert,
      },
      {
        data: { key1: 112, key2: 112, key3: 112, value: insertValue },
        table: tableName,
        saveType: SaveType.insert,
      },
    ]);

    let rowData = await Select.selectTop1<IHash>(conn, {
      sql: `select value from ${tableName} where key1=? and key2=? and key3=?`,
      where: [11, 11, 11],
    });
    expect(rowData.value).to.equal(insertValue);

    insertValue = `value${Math.random()}_new1`;
    await Save.saves(conn, [
      {
        data: { key1: 11, key2: 11, key3: 11, value: insertValue },
        table: tableName,
        saveType: SaveType.update,
      },
    ]);

    rowData = await Select.selectTop1<IHash>(conn, {
      sql: `select value from ${tableName} where key1=? and key2=? and key3=?`,
      where: [11, 11, 11],
    });
    expect(rowData.value).to.equal(insertValue);

    await Save.saves(conn, [
      {
        data: { key1: 7, key2: 7, key3: 7 },
        table: tableName,
        saveType: SaveType.delete,
      },
    ]);

    rowData = await Select.selectTop1<IHash>(conn, {
      sql: `select value from ${tableName} where key1=? and key2=? and key3=?`,
      where: [7, 7, 7],
    });
    expect(rowData).to.be.null;

    insertValue = `value${Math.random()}_new3`;
    await Save.saves(conn, [
      {
        data: { key1: 6, key2: 6, key3: 6, value: insertValue },
        table: tableName,
        saveType: SaveType.replace,
      },
    ]);

    rowData = await Select.selectTop1<IHash>(conn, {
      sql: `select value from ${tableName} where key1=? and key2=? and key3=?`,
      where: [6, 6, 6],
    });
    expect(rowData.value).to.equal(insertValue);

    // 插入重复键时报错
    insertValue = `value${Math.random()}_new3`;
    await Save.saves(conn, [
      {
        data: { key1: 6, key2: 6, key3: 6, value: insertValue },
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
        data: { key1: 12, key2: 12, key3: 12, value: insertValue },
        table: tableName,
        saveType: SaveType.insert,
      },
      {
        data: { key1: 121, key2: 121, key3: 121, value: insertValue },
        table: tableName,
        saveType: SaveType.insert,
      },
      {
        data: { key1: 122, key2: 122, key3: 122, value: insertValue },
        table: tableName,
        saveType: SaveType.insert,
      },
    ]);

    let rowData = await Select.selectTop1<IHash>(conn, {
      sql: `select value from ${tableName} where key1=? and key2=? and key3=?`,
      where: [12, 12, 12],
    });
    expect(rowData.value).to.equal(insertValue);

    insertValue = `value${Math.random()}_new1`;
    await Save.savesSeq(conn, [
      {
        data: { key1: 12, key2: 12, key3: 12, value: insertValue },
        table: tableName,
        saveType: SaveType.update,
      },
    ]);

    rowData = await Select.selectTop1<IHash>(conn, {
      sql: `select value from ${tableName} where key1=? and key2=? and key3=?`,
      where: [12, 12, 12],
    });
    expect(rowData.value).to.equal(insertValue);

    await Save.savesSeq(conn, [
      {
        data: { key1: 5, key2: 5, key3: 5 },
        table: tableName,
        saveType: SaveType.delete,
      },
    ]);

    rowData = await Select.selectTop1<IHash>(conn, {
      sql: `select value from ${tableName} where key1=? and key2=? and key3=?`,
      where: [5, 5, 5],
    });
    expect(rowData).to.be.null;

    insertValue = `value${Math.random()}_new3`;
    await Save.savesSeq(conn, [
      {
        data: { key1: 4, key2: 4, key3: 4, value: insertValue },
        table: tableName,
        saveType: SaveType.replace,
      },
    ]);

    rowData = await Select.selectTop1<IHash>(conn, {
      sql: `select value from ${tableName} where key1=? and key2=? and key3=?`,
      where: [4, 4, 4],
    });
    expect(rowData.value).to.equal(insertValue);
  });

  it("savesSeq err", async () => {
    let insertValue = `value${Math.random()}`;

    try {
      await Save.savesSeq(conn, [
        {
          data: { key1: 200, key2: 200, key3: 200, value: insertValue },
          table: tableName,
          saveType: SaveType.insert,
        },
        {
          data: { key1: 200, key2: 200, key3: 200, value: insertValue },
          table: tableName,
          saveType: SaveType.insert,
        },
      ]);
    } catch (err) {
      expect(err.code).to.equal(`EREQUEST`);
    }

    let rowData = await Select.selectTop1<IHash>(conn, {
      sql: `select value from ${tableName} where key1=? and key2=? and key3=?`,
      where: [200, 200, 200],
    });
    expect(rowData.value).to.equal(insertValue);
  });

  it("savesSeqWithTran must be success", async () => {
    let insertValue = `value${Math.random()}`;

    try {
      await Save.savesSeqWithTran(conn, [
        {
          data: { key1: 400, key2: 400, key3: 400, value: insertValue },
          table: tableName,
          saveType: SaveType.insert,
        },
        {
          data: { key1: 401, key2: 401, key3: 401, value: insertValue },
          table: tableName,
          saveType: SaveType.insert,
        },
      ]);
    } catch (err) {
      expect(err.code).to.equal(`EREQUEST`);
    }

    let rowData = await Select.selectTop1<IHash>(conn, {
      sql: `select value from ${tableName} where key1=? and key2=? and key3=?`,
      where: [400, 400, 400],
    });
    expect(rowData.value).to.equal(insertValue);

    rowData = await Select.selectTop1<IHash>(conn, {
      sql: `select value from ${tableName} where key1=? and key2=? and key3=?`,
      where: [401, 401, 401],
    });
    expect(rowData.value).to.equal(insertValue);
  });

  it("savesSeqWithTran err", async () => {
    let insertValue = `value${Math.random()}`;

    try {
      await Save.savesSeqWithTran(conn, [
        {
          data: { key1: 402, key2: 402, key3: 402, value: insertValue },
          table: tableName,
          saveType: SaveType.insert,
        },
        {
          data: { key1: 402, key2: 402, key3: 402, value: insertValue },
          table: tableName,
          saveType: SaveType.insert,
        },
      ]);
    } catch (err) {
      expect(err.code).to.equal(`EREQUEST`);
    }

    let rowData = await Select.selectTop1<IHash>(conn, {
      sql: `select value from ${tableName} where key1=? and key2=? and key3=?`,
      where: [402, 402, 402],
    });
    expect(rowData).to.be.null;
  });
});
