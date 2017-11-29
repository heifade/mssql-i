import { expect } from "chai";
import "mocha";
import { initTable } from "./DataInit";
import { PoolConnection, Connection } from "mysql";
import {
  ConnectionHelper,
  Save,
  Transaction,
  RowDataModel,
  Select,
  SaveType
} from "../src/index";
import { connectionConfig } from "./connectionConfig";

describe("Transaction", function() {
  let tableName = "tbl_test_transaction";
  let conn: Connection;

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
      await Transaction.begin(conn);

      let insertValue = `value${Math.random()}`;

      await Save.save(conn, {
        data: RowDataModel.create({ id: 10, value: insertValue }),
        table: tableName,
        saveType: SaveType.insert
      });

      await Transaction.commit(conn);

      let rowData = await Select.selectTop1(conn, {
        sql: `select value from ${tableName} where id=?`,
        where: [10]
      });
      expect(rowData.get("value")).to.equal(insertValue);
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
      try {
        await Transaction.begin(conn);

        await Save.save(conn, {
          data: RowDataModel.create({ id: 11, value: insertValue }),
          table: tableName,
          saveType: SaveType.insert
        });

        await Save.save(conn, {
          data: RowDataModel.create({ id: 11, value: insertValue }),
          table: tableName,
          saveType: SaveType.insert
        });

        await Transaction.commit(conn);
      } catch (err) {
        await Transaction.rollback(conn);
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
        expect(errCode).to.equal(`PROTOCOL_ENQUEUE_AFTER_QUIT`);
      });

      await Transaction.commit(conn).catch(err => {
        let errCode = Reflect.get(err, "code");
        expect(errCode).to.equal(`PROTOCOL_ENQUEUE_AFTER_QUIT`);
      });

      await Transaction.rollback(conn).catch(err => {
        let errCode = Reflect.get(err, "code");
        expect(errCode).to.equal(`PROTOCOL_ENQUEUE_AFTER_QUIT`);
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
