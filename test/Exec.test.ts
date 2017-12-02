import { expect } from "chai";
import "mocha";
import { initTable } from "./DataInit";
import {
  ConnectionHelper,
  Select,
  Exec,
  ConnectionPool,
  Transaction
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

  it("exec with tran must be success", done => {
    let asyncFunc = async function() {
      let tran;
      try {
        tran = await Transaction.begin(conn);

        await Exec.exec(conn, `delete from ${tableName} where id=6`, tran);

        await Exec.execsSeq(
          conn,
          [
            `delete from ${tableName} where id=7`,
            `delete from ${tableName} where id=8`
          ],
          tran
        );

        await Transaction.commit(tran);
      } catch (err) {
        await Transaction.rollback(tran);
      }

      let result = await Select.selectTop1(conn, {
        sql: `select * from ${tableName} where id=?`,
        where: [6]
      });
      expect(result).to.be.null;

      try {
        tran = await Transaction.begin(conn);

        await Exec.exec(conn, `delete from ${tableName} where id=9`, tran);

        await Exec.exec(conn, `delete from ${tableName} where id1=1`, tran);

        await Transaction.commit(tran);
      } catch (err) {
        await Transaction.rollback(tran);
      }

      let result2 = await Select.selectTop1(conn, {
        sql: `select * from ${tableName} where id=?`,
        where: [9]
      });


      expect(result2).not.to.be.null;
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
