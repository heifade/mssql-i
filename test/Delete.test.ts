import {
  ConnectionHelper,
  Select,
  Exec,
  Schema,
  Insert,
  Update,
  Delete,
  ConnectionPool
} from "../src/index";
import { expect } from "chai";
import "mocha";
import { initTable } from "./DataInit";
import { connectionConfig } from "./connectionConfig";
import { Utils } from "../src/util/Utils";
import { Replace } from "../src/Replace";
import { Transaction } from "../src/Transaction";

describe("Delete", function() {
  let tableName = "tbl_test_delete";
  let conn: ConnectionPool;
  before(done => {
    (async function() {
      conn = await ConnectionHelper.create(connectionConfig);
      await initTable(conn, tableName, false);
    })()
      .then(() => {
        done();
      })
      .catch(err => {
        done(err);
      });
  });

  after(done => {
    (async function() {
      await ConnectionHelper.close(conn);
    })().then(() => {
      done();
    });
  });

  it("delete must be success", done => {
    let asyncFunc = async function() {
      let deleteId = 1;
      let count = await Select.selectCount(conn, {
        sql: `select * from ${tableName} where id=?`,
        where: [deleteId]
      });
      expect(count).to.equal(1);

      await Delete.delete(conn, {
        where: { id: deleteId },
        table: tableName
      });

      count = await Select.selectCount(conn, {
        sql: `select * from ${tableName} where id=?`,
        where: [deleteId]
      });
      expect(count).to.equal(0);
    };

    asyncFunc()
      .then(() => {
        done();
      })
      .catch(err => {
        done(err);
      });
  });

  it("delete with tran must be success", done => {
    let asyncFunc = async function() {
      let deleteId = 2;

      let count = await Select.selectCount(conn, {
        sql: `select * from ${tableName} where id=?`,
        where: [deleteId]
      });
      expect(count).to.equal(1);

      let tran;
      try {
        tran = await Transaction.begin(conn);
        await Delete.delete(
          conn,
          {
            where: { id: deleteId },
            table: tableName
          },
          tran
        );
        await Transaction.commit(tran);
      } catch (err) {
        await Transaction.rollback(tran);
      }

      count = await Select.selectCount(conn, {
        sql: `select * from ${tableName} where id=?`,
        where: [deleteId]
      });
      expect(count).to.equal(0);
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
      await Delete.delete(conn, {
        where: { id: 1 },
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
      let insertName = `name${Math.random()}`;

      let tableName = `tbl_not_exists`;

      await Delete.delete(conn, {
        where: { id: 1 },
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
      await Delete.delete(conn, {
        where: { id: "Hellow" },
        table: tableName
      }).catch(err => {
        let errCode = Reflect.get(err, "code");
        expect(errCode).to.equal(`EREQUEST`);
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
