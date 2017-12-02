import { expect } from "chai";
import "mocha";
import { initTable } from "./DataInit";
import {
  ConnectionHelper,
  Save,
  Transaction,
  Select,
  SaveType,
  ConnectionPool
} from "../src/index";
import { connectionConfig } from "./connectionConfig";

describe("Transaction", function() {
  let tableName = "tbl_test_transaction";
  let conn: ConnectionPool;

  before(done => {
    (async function() {
      conn = await ConnectionHelper.create(connectionConfig);
      await initTable(conn, tableName, false);
    })().then(() => {
      done();
    });
  });
  after(done => {
    (async function() {
      await ConnectionHelper.close(conn);
    })().then(() => {
      done();
    });
  });

  it("transaction commit must be success", done => {
    let asyncFunc = async function() {
      let tran = await Transaction.begin(conn);

      let insertValue = `value${Math.random()}`;

      await Save.save(
        conn,
        {
          data: { id: 10, value: insertValue },
          table: tableName,
          saveType: SaveType.insert
        },
        tran
      );

      await Transaction.commit(tran);

      let rowData = await Select.selectTop1(conn, {
        sql: `select value from ${tableName} where id=?`,
        where: [10]
      });
      expect(Reflect.get(rowData, "value")).to.equal(insertValue);
    };

    asyncFunc()
      .then(() => {
        done();
      })
      .catch(err => {
        done(err);
      });
  });

  it("transaction rollback must be success", done => {
    let asyncFunc = async function() {
      let insertValue = `value${Math.random()}`;
      let tran;
      try {
        tran = await Transaction.begin(conn);

        await Save.save(
          conn,
          {
            data: { id: 11, value: insertValue },
            table: tableName,
            saveType: SaveType.insert
          },
          tran
        );

        await Save.save(
          conn,
          {
            data: { id: 11, value: insertValue },
            table: tableName,
            saveType: SaveType.insert
          },
          tran
        );
        await Transaction.commit(tran);
      } catch (err) {
        await Transaction.rollback(tran);
      }

      let rowData = await Select.selectTop1(conn, {
        sql: `select value from ${tableName} where id=?`,
        where: [11]
      });
      expect(rowData).to.equal(null);
    };

    asyncFunc()
      .then(() => {
        done();
      })
      .catch(err => {
        done(err);
      });
  });

  it("transaction err", done => {
    let asyncFunc = async function() {
      ConnectionHelper.close(conn);

      await Transaction.begin(conn).catch(err => {
        let errCode = Reflect.get(err, "code");
        expect(errCode).to.equal(`ENOTOPEN`);
      });
    };

    asyncFunc()
      .then(() => {
        done();
      })
      .catch(err => {
        done(err);
      });
  });
});
