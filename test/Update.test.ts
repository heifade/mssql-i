import { expect } from "chai";
import "mocha";
import { initTable } from "./DataInit";
import {
  ConnectionHelper,
  Update,
  Select,
  ConnectionPool,
  Transaction
} from "../src/index";
import { connectionConfig } from "./connectionConfig";

describe("Update", function() {
  let tableName = "tbl_test_update";
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

  it("update must be success", done => {
    let asyncFunc = async function() {
      let newValue = `value${Math.random()}` + "_newValue1";

      let result = await Update.update(conn, {
        data: { id: 1, value: newValue },
        table: tableName
      });

      let rowData = await Select.selectTop1(conn, {
        sql: `select * from ${tableName} where id=?`,
        where: [1]
      });

      expect(Reflect.get(rowData, "value")).to.equal(newValue);

      newValue = `value${Math.random()}` + "_newValue2";

      result = await Update.updateByWhere(conn, {
        data: { value: newValue },
        table: tableName,
        where: { id: 2 }
      });

      rowData = await Select.selectTop1(conn, {
        sql: `select * from ${tableName} where id=?`,
        where: [2]
      });

      expect(Reflect.get(rowData, "value")).to.equal(newValue);

      newValue = `value${Math.random()}` + "_newValue3";

      await Update.update(conn, {
        data: { value: newValue },
        table: tableName
      });

      rowData = await Select.selectTop1(conn, {
        sql: `select * from ${tableName}`
      });

      expect(Reflect.get(rowData, "value")).to.equal(newValue);
    };

    asyncFunc()
      .then(() => {
        done();
      })
      .catch(err => {
        done(err);
      });
  });

  it("update with tran must be success", done => {
    let asyncFunc = async function() {
      let newValue = `value${Math.random()}` + "_newValue11";

      let tran;
      try {
        tran = await Transaction.begin(conn);

        let result = await Update.update(
          conn,
          {
            data: { id: 1, value: newValue },
            table: tableName
          },
          tran
        );

        await Transaction.commit(tran);
      } catch (err) {
        await Transaction.rollback(tran);
      }

      let rowData = await Select.selectTop1(conn, {
        sql: `select * from ${tableName} where id=?`,
        where: [1]
      });

      expect(Reflect.get(rowData, "value")).to.equal(newValue);

      newValue = `value${Math.random()}` + "_newValue22";

      try {
        tran = await Transaction.begin(conn);

        let result = await Update.updateByWhere(
          conn,
          {
            data: { value: newValue },
            table: tableName,
            where: { id: 2 }
          },
          tran
        );

        await Transaction.commit(tran);
      } catch (err) {
        await Transaction.rollback(tran);
      }

      rowData = await Select.selectTop1(conn, {
        sql: `select * from ${tableName} where id=?`,
        where: [2]
      });

      expect(Reflect.get(rowData, "value")).to.equal(newValue);
    };

    asyncFunc()
      .then(() => {
        done();
      })
      .catch(err => {
        done(err);
      });
  });

  it("when pars.data is null of update", done => {
    let asyncFunc = async function() {
      await Update.update(conn, {
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

  it("when pars.data is null of updateByWhere", done => {
    let asyncFunc = async function() {
      await Update.updateByWhere(conn, {
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

  it("when pars.table is null of update", done => {
    let asyncFunc = async function() {
      let insertValue = `value${Math.random()}`;

      await Update.update(conn, {
        data: { value: insertValue },
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

  it("when pars.table is null of updateByWhere", done => {
    let asyncFunc = async function() {
      let insertValue = `value${Math.random()}`;

      await Update.updateByWhere(conn, {
        data: { value: insertValue },
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

  it("when table is not exists of update", done => {
    let asyncFunc = async function() {
      let insertValue = `value${Math.random()}`;

      let tableName = `tbl_not_exists`;

      await Update.update(conn, {
        data: { value: insertValue },
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

  it("when table is not exists of updateByWhere", done => {
    let asyncFunc = async function() {
      let insertValue = `value${Math.random()}`;

      let tableName = `tbl_not_exists`;

      await Update.updateByWhere(conn, {
        data: { value: insertValue },
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

  it("update as data with no primary key", done => {
    let asyncFunc = async function() {
      let insertValue = `value${Math.random()}_update5`;

      await Update.update(conn, {
        data: {
          value: insertValue
        },
        table: tableName
      });

      let rowData = await Select.selectTop1(conn, {
        sql: `select * from ${tableName}`
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

  it("when error of update", done => {
    let asyncFunc = async function() {
      let insertValue = `123456789012345678901234567890123456789012345678901234567890`;

      await Update.update(conn, {
        data: {
          id: 1,
          dateValue: insertValue,
          value2: "aaa"
        },
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

  it("when error of updateByWhere", done => {
    let asyncFunc = async function() {
      let insertValue = `123456789012345678901234567890123456789012345678901234567890`;

      await Update.updateByWhere(conn, {
        data: {
          id: 2,
          dateValue: insertValue,
          value2: "aaa"
        },
        table: tableName,
        where: { id: 2 }
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
