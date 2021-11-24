import { expect } from "chai";
import "mocha";
import { initTable } from "./DataInit";
import { ConnectionHelper, Save, Transaction, Select, SaveType, ConnectionPool } from "../src/index";
import { getConnectionConfig } from "./connectionConfig";
import { IHash } from "../src/interface/iHash";

describe("Transaction", function () {
  let tableName = "tbl_test_transaction";
  let conn: ConnectionPool;

  before(async () => {
    conn = await ConnectionHelper.create(getConnectionConfig());
    await initTable(conn, tableName, false);
  });
  after(async () => {
    await ConnectionHelper.close(conn);
  });

  it("transaction commit must be success", async () => {
    let tran = await Transaction.begin(conn);

    let insertValue = `value${Math.random()}`;

    await Save.save(
      conn,
      {
        data: { id: 10, value: insertValue },
        table: tableName,
        saveType: SaveType.insert,
      },
      tran
    );

    await Transaction.commit(tran);

    let rowData = await Select.selectTop1<IHash>(conn, {
      sql: `select value from ${tableName} where id=?`,
      where: [10],
    });
    expect(rowData.value).to.equal(insertValue);
  });

  it("transaction rollback must be success", async () => {
    let insertValue = `value${Math.random()}`;
    let tran;
    try {
      tran = await Transaction.begin(conn);

      await Save.save(
        conn,
        {
          data: { id: 11, value: insertValue },
          table: tableName,
          saveType: SaveType.insert,
        },
        tran
      );

      await Save.save(
        conn,
        {
          data: { id: 11, value: insertValue },
          table: tableName,
          saveType: SaveType.insert,
        },
        tran
      );
      await Transaction.commit(tran);
    } catch (err) {
      await Transaction.rollback(tran);
    }

    let rowData = await Select.selectTop1<IHash>(conn, {
      sql: `select value from ${tableName} where id=?`,
      where: [11],
    });
    expect(rowData).to.equal(null);
  });
});
