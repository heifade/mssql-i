import { expect } from "chai";
import "mocha";
import { initTable } from "./DataInit";
import {
  ConnectionHelper,
  RowDataModel,
  Select,
  Exec,
  ConnectionPool
} from "../src/index";
import { connectionConfig } from "./connectionConfig";

describe("Exec", function() {
  let tableName = "tbl_test_exec";
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

  it("exec must be success", done => {
    let asyncFunc = async function() {
      await Exec.exec(conn, `delete from ${tableName} where id=1`);
      await Exec.execs(conn, [
        `delete from ${tableName} where id=2`,
        `delete from ${tableName} where id=3`
      ]);
      await Exec.execsSeq(conn, [
        `delete from ${tableName} where id=4`,
        `delete from ${tableName} where id=5`
      ]);

      await Select.selectTop1(conn, {
        sql: `select * from ${tableName} where id=?`,
        where: [1]
      }).then(result => {
        expect(result).to.be.null;
      });

      await Exec.exec(conn, `delete from ${tableName} where id1=1`).catch(
        err => {
          let errCode = Reflect.get(err, "code");
          expect(errCode).to.equal(`EREQUEST`);
        }
      );

      await Exec.execs(conn, [`delete from ${tableName} where id1=1`]).catch(
        err => {
          let errCode = Reflect.get(err, "code");
          expect(errCode).to.equal(`EREQUEST`);
        }
      );

      await Exec.execsSeq(conn, [`delete from ${tableName} where id1=1`]).catch(
        err => {
          let errCode = Reflect.get(err, "code");
          expect(errCode).to.equal(`EREQUEST`);
        }
      );
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
