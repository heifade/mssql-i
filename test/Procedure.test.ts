import { expect } from "chai";
import "mocha";
import { initTable } from "./DataInit";
import { PoolConnection, Connection } from "mysql";
import {
  ConnectionHelper,
  RowDataModel,
  Select,
  Procedure,
  Exec,
  Schema
} from "../src/index";
import { connectionConfig } from "./connectionConfig";

describe("Procedure", function() {
  let tableName = "tbl_test_procedure";
  let procedureName = "p_insert_procedure";
  let conn: Connection;

  before(done => {
    (async function() {
      conn = await ConnectionHelper.create(connectionConfig);
      await initTable(conn, tableName, false);
      await Exec.exec(conn, `drop PROCEDURE if exists ${procedureName}`);
      await Exec.exec(
        conn,
        ` CREATE PROCEDURE ${procedureName}(in pId int, in pValue varchar(50), out pOut varchar(50))
          BEGIN
            insert into tbl_test_procedure(id, value) values(pId, pValue);
            set pOut = 'OK1111';
          END
        `
      );

      await Exec.exec(conn, `drop PROCEDURE if exists ${procedureName}_no_par`);
      await Exec.exec(
        conn,
        ` CREATE PROCEDURE ${procedureName}_no_par()
          BEGIN
            insert into tbl_test_procedure(id, value) values(100, '100');
          END
        `
      );
      await Exec.exec(
        conn,
        `drop PROCEDURE if exists ${procedureName}_no_par_2`
      );
      await Exec.exec(
        conn,
        ` CREATE PROCEDURE ${procedureName}_no_par_2()
          BEGIN
            insert into tbl_test_procedure(id, value) values(102, '102');
          END
        `
      );
      Schema.clear(conn.config.database);
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

  it("procedure must be success", done => {
    let asyncFunc = async function() {
      let insertValue = `value${Math.random()}`;
      let result = await Procedure.exec(conn, {
        data: RowDataModel.create({ pId: 11, pValue: insertValue, pOut: "" }),
        procedure: procedureName
      });

      let row = await Select.selectTop1(conn, {
        sql: `select * from ${tableName} where id=?`,
        where: [11]
      });
      expect(row.get("value")).to.equals(insertValue);
    };

    asyncFunc()
      .then(() => {
        done();
      })
      .catch(err => {
        done(err);
      });
  });

  it("when pars.procedure is null", done => {
    let asyncFunc = async function() {
      await Procedure.exec(conn, {
        data: RowDataModel.create({ pId: 11, pValue: "111111", pOut: "" }),
        procedure: null
      }).catch(err => {
        let errMsg = Reflect.get(err, "message");
        expect(errMsg).to.equal("pars.procedure can not be null or empty!");
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

  it("when procedure is not exists", done => {
    let asyncFunc = async function() {
      let insertValue = `value${Math.random()}`;

      let procedureName = `p_not_exists`;

      await Procedure.exec(conn, {
        data: RowDataModel.create({ pId: 11, pValue: "111111", pOut: "" }),
        procedure: procedureName
      }).catch(err => {
        let errMsg = Reflect.get(err, "message");
        expect(errMsg).to.equal(`procedure '${procedureName}' is not exists!`);
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

      await Procedure.exec(conn, {
        data: RowDataModel.create({
          pId: 15,
          pValue: insertValue,
          pOut: ""
        }),
        procedure: procedureName
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

  it("procedure with no par should success", done => {
    let asyncFunc = async function() {
      await Procedure.exec(conn, {
        procedure: `${procedureName}_no_par`
      });

      let row = await Select.selectTop1(conn, {
        sql: `select * from ${tableName} where id=?`,
        where: [100]
      });
      expect(row.get("value")).to.equals("100");
    };

    asyncFunc()
      .then(() => {
        done();
      })
      .catch(err => {
        done(err);
      });
  });

  it("procedure with other par should success", done => {
    let asyncFunc = async function() {
      await Procedure.exec(conn, {
        data: RowDataModel.create({ p1: 1 }),
        procedure: `${procedureName}_no_par_2`
      });

      let row = await Select.selectTop1(conn, {
        sql: `select * from ${tableName} where id=?`,
        where: [102]
      });
      expect(row.get("value")).to.equals("102");
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
