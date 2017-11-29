import { expect } from "chai";
import "mocha";
import { connectionConfig } from "./connectionConfig";
import { initTable } from "./DataInit";
import { PoolConnection, Connection } from "mysql";
import { ConnectionHelper, Replace, RowDataModel, Select } from "../src/index";

describe("Replace", function() {
  let tableName = "tbl_test_replace";
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

  it("replace must be success", done => {
    let asyncFunc = async function() {
      let insertValue = `value${Math.random()}`;

      let result = await Replace.replace(conn, {
        data: RowDataModel.create({ id: 1, value: insertValue }),
        table: tableName
      });

      let rowData = await Select.selectTop1(conn, {
        sql: `select value from ${tableName} where id=?`,
        where: [1]
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
      await Replace.replace(conn, {
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

      await Replace.replace(conn, {
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

      await Replace.replace(conn, {
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
      let insertValue = `123456789012345678901234567890123456789012345678901234567890`;

      await Replace.replace(conn, {
        data: RowDataModel.create({
          id: 1,
          value: insertValue,
          value2: "aaa"
        }),
        table: tableName
      }).catch(err => {
        let errCode = Reflect.get(err, "code");
        expect(errCode).to.equal(`ER_DATA_TOO_LONG`);
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
