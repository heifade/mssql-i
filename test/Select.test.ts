import { expect } from "chai";
import "mocha";
import { initTable } from "./DataInit";
import { PoolConnection, Connection } from "mysql";
import { ConnectionHelper, RowDataModel, Select } from "../src/index";
import { connectionConfig } from "./connectionConfig";

describe("Select", function() {
  let tableName = "tbl_test_select";
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

  it("select", done => {
    let asyncFunc = async function() {
      let list = await Select.select(conn, {
        sql: `select * from ${tableName} where id=?`,
        where: [1]
      });

      expect(list != null && list.length == 1).to.be.true;

      await Select.select(conn, {
        sql: `select * from tbl_not_exists`
      }).catch(err => {
        let errCode = Reflect.get(err, "code");
        expect(errCode).to.equal(`ER_NO_SUCH_TABLE`);
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

  it("selectCount", done => {
    let asyncFunc = async function() {
      let count = await Select.selectCount(conn, {
        sql: `select * from ${tableName} where id=?`,
        where: [1]
      });

      expect(count).to.equal(1);

      await Select.selectCount(conn, {
        sql: `select * from tbl_not_exists`
      }).catch(err => {
        let errCode = Reflect.get(err, "code");
        expect(errCode).to.equal(`ER_NO_SUCH_TABLE`);
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

  it("selects", done => {
    let asyncFunc = async function() {
      let results = await Select.selects(conn, [
        { sql: `select * from ${tableName} where id=?`, where: [1] },
        { sql: `select * from ${tableName} where id=?`, where: [2] }
      ]);

      expect(
        results != null &&
          results.length == 2 &&
          results[0] != null &&
          results[1] != null &&
          results[0].length == 1 &&
          results[1].length == 1
      ).to.be.true;
    };
    asyncFunc()
      .then(() => {
        done();
      })
      .catch(err => {
        done(err);
      });
  });

  it("selectTop1", done => {
    let asyncFunc = async function() {
      let result = await Select.selectTop1(conn, {
        sql: `select * from ${tableName} where id=?`,
        where: [1]
      });
      expect(result != null).to.be.true;

      await Select.selectTop1(conn, {
        sql: `select * from tbl_not_exists`
      }).catch(err => {
        let errCode = Reflect.get(err, "code");
        expect(errCode).to.equal(`ER_NO_SUCH_TABLE`);
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

  it("selectSplitPage", done => {
    let asyncFunc = async function() {
      let splitResult = await Select.selectSplitPage(conn, {
        sql: `select * from ${tableName} where id=?`,
        where: [1],
        pageSize: 10,
        index: 0
      });

      expect(splitResult.count).to.equal(1);
      expect(splitResult.list != null && splitResult.list.length == 1).to.be
        .true;

      splitResult = await Select.selectSplitPage(conn, {
        sql: `select * from ${tableName} where id=?`,
        where: [1],
        pageSize: 10,
        index: 1
      });

      expect(splitResult.count).to.equal(1);
      expect(splitResult.list != null && splitResult.list.length == 1).to.be
        .true;

      await Select.selectSplitPage(conn, {
        sql: `select * from tbl_not_exists where id=?`,
        where: [1],
        pageSize: 10,
        index: 1
      }).catch(err => {
        let errCode = Reflect.get(err, "code");
        expect(errCode).to.equal(`ER_NO_SUCH_TABLE`);
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
