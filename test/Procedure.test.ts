import { expect } from "chai";
import "mocha";
import { initTable } from "./DataInit";
import { ConnectionHelper, Select, Procedure, Exec, Schema, ConnectionPool, Utils } from "../src/index";
import { connectionConfig } from "./connectionConfig";
import { Transaction } from "../src/Transaction";

describe("Procedure", function() {
  let tableName = "tbl_test_procedure";
  let procedureName = "p_insert_procedure";
  let conn: ConnectionPool;

  before(async () => {
    conn = await ConnectionHelper.create(connectionConfig);
    await initTable(conn, tableName, false);
    await Exec.exec(
      conn,
      `if exists(
            select * from
            sys.objects
            where type = 'P' and name ='${procedureName}')
          drop PROCEDURE ${procedureName}`
    );
    await Exec.exec(
      conn,
      ` CREATE PROCEDURE ${procedureName}
            @pId int, @pValue varchar(50), @pOut varchar(50) out
          as
          BEGIN
            insert into tbl_test_procedure(id, value) values(@pId, @pValue);
            set @pOut = 'aaaabbbccc'
          END
        `
    );

    await Exec.exec(
      conn,
      `if exists(
            select * from
            sys.objects
            where type = 'P' and name='${procedureName}_no_par')
          drop PROCEDURE ${procedureName}_no_par`
    );
    await Exec.exec(
      conn,
      ` CREATE PROCEDURE ${procedureName}_no_par
          as
          BEGIN
            insert into tbl_test_procedure(id, value) values(100, '100');
          END
        `
    );
    await Exec.exec(
      conn,
      `if exists(
            select * from
            sys.objects
            where type = 'P' and name='${procedureName}_no_par2')
          drop PROCEDURE ${procedureName}_no_par2`
    );
    await Exec.exec(
      conn,
      ` CREATE PROCEDURE ${procedureName}_no_par2
          as
          BEGIN
            insert into tbl_test_procedure(id, value) values(102, '102');
          END
        `
    );
    Schema.clear(Utils.getDataBaseFromConnection(conn));
  });
  after(async () => {
    await ConnectionHelper.close(conn);
  });

  it("procedure must be success", async () => {
    let insertValue = `value${Math.random()}`;
    let result = await Procedure.exec(conn, {
      data: { pId: 11, pValue: insertValue, pOut: "" },
      procedure: procedureName
    });

    expect(result.output["pOut"]).to.equals("aaaabbbccc");

    let row = await Select.selectTop1(conn, {
      sql: `select * from ${tableName} where id=?`,
      where: [11]
    });
    expect(Reflect.get(row, "value")).to.equals(insertValue);
  });

  it("procedure with tran must be success", async () => {
    let insertValue = `value${Math.random()}`;

    let tran;
    let result;
    try {
      tran = await Transaction.begin(conn);
      result = await Procedure.exec(
        conn,
        {
          data: { pId: 111, pValue: insertValue, pOut: "" },
          procedure: procedureName
        },
        tran
      );
      await Transaction.commit(tran);
    } catch (err) {
      await Transaction.rollback(tran);
    }

    expect(result && result.output["pOut"] == "aaaabbbccc").to.be.true;

    let row = await Select.selectTop1(conn, {
      sql: `select * from ${tableName} where id=?`,
      where: [111]
    });
    expect(Reflect.get(row, "value")).to.equals(insertValue);
  });

  it("when pars.procedure is null", async () => {
    await Procedure.exec(conn, {
      data: { pId: 11, pValue: "111111", pOut: "" },
      procedure: null
    }).catch(err => {
      let errMsg = Reflect.get(err, "message");
      expect(errMsg).to.equal("pars.procedure can not be null or empty!");
    });
  });

  it("when procedure is not exists", async () => {
    let insertValue = `value${Math.random()}`;

    let procedureName = `p_not_exists`;

    await Procedure.exec(conn, {
      data: { pId: 11, pValue: "111111", pOut: "" },
      procedure: procedureName
    }).catch(err => {
      let errMsg = Reflect.get(err, "message");
      expect(errMsg).to.equal(`procedure '${procedureName}' is not exists!`);
    });
  });

  it("when error", async () => {
    let insertValue = `123456789012345678901234567890123456789012345678901234567890`;

    await Procedure.exec(conn, {
      data: {
        pId: 15,
        pValue: insertValue,
        pOut: ""
      },
      procedure: procedureName
    }).catch(err => {
      let errCode = Reflect.get(err, "code");
      expect(errCode).to.equal(`ER_DATA_TOO_LONG`);
    });
  });

  it("procedure with no par should success", async () => {
    await Procedure.exec(conn, {
      procedure: `${procedureName}_no_par`
    });

    let row = await Select.selectTop1(conn, {
      sql: `select * from ${tableName} where id=?`,
      where: [100]
    });
    expect(Reflect.get(row, "value")).to.equals("100");
  });

  it("procedure with other par should success", async () => {
    await Procedure.exec(conn, {
      data: { p1: 1 },
      procedure: `${procedureName}_no_par2`
    });

    let row = await Select.selectTop1(conn, {
      sql: `select * from ${tableName} where id=?`,
      where: [102]
    });
    expect(Reflect.get(row, "value")).to.equals("102");
  });
});
