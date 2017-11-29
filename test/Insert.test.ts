import { expect } from "chai";
import "mocha";
import { initTable } from "./DataInit";
import { PoolConnection, Connection } from "mysql";
import { ConnectionHelper, Insert, RowDataModel, Select } from "../src/index";
import { connectionConfig } from "./connectionConfig";

describe("Insert", function() {
  let tableName = "tbl_test_insert";
  let conn: Connection;

  before(done => {
    (async function() {
      conn = await ConnectionHelper.create(connectionConfig);
      await initTable(conn, tableName, true);
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

  it("insert must be success", done => {
    let asyncFunc = async function() {
      let insertValue = `value${Math.random()}`;

      let result = await Insert.insert(conn, {
        data: RowDataModel.create({ value: insertValue }),
        table: tableName
      });

      let insertId = Reflect.get(result, "insertId");

      let rowData = await Select.selectTop1(conn, {
        sql: `select value from ${tableName} where id=?`,
        where: [insertId]
      });

      expect(rowData != null).to.be.true;
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

  it("when pars.data is null", done => {
    let asyncFunc = async function() {
      await Insert.insert(conn, {
        data: null,
        table: tableName
      }).catch(err => {
        let errMsg = Reflect.get(err, "message");
        expect(errMsg).to.equal("pars.data can not be null or empty!");
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

  it("when pars.table is null", done => {
    let asyncFunc = async function() {
      let insertValue = `value${Math.random()}`;

      await Insert.insert(conn, {
        data: RowDataModel.create({ value: insertValue }),
        table: null
      }).catch(err => {
        let errMsg = Reflect.get(err, "message");
        expect(errMsg).to.equal("pars.table can not be null or empty!");
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

  it("when table is not exists", done => {
    let asyncFunc = async function() {
      let insertValue = `value${Math.random()}`;

      let tableName = `tbl_not_exists`;

      await Insert.insert(conn, {
        data: RowDataModel.create({ value: insertValue }),
        table: tableName
      }).catch(err => {
        let errMsg = Reflect.get(err, "message");
        expect(errMsg).to.equal(`table '${tableName}' is not exists!`);
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

  it("when error", done => {
    let asyncFunc = async function() {
      let insertValue = `value${Math.random()}`;

      await Insert.insert(conn, {
        data: RowDataModel.create({
          id: 1,
          value: insertValue,
          value2: "aaa"
        }), // Duplicate entry '1' for key 'PRIMARY'
        table: tableName
      }).catch(err => {
        let errCode = Reflect.get(err, "code");
        expect(errCode).to.equal(`ER_DUP_ENTRY`);
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
