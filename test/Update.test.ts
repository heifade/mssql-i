import { expect } from "chai";
import "mocha";
import { initTable } from "./DataInit";
import { ConnectionHelper, Update, Select, ConnectionPool, Transaction } from "../src/index";
import { getConnectionConfig } from "./connectionConfig";

describe("Update", function () {
  let tableName = "tbl_test_update";
  let conn: ConnectionPool;
  before(async () => {
    conn = await ConnectionHelper.create(getConnectionConfig());
    await initTable(conn, tableName, false);
  });
  after(async () => {
    await ConnectionHelper.close(conn);
  });

  it("update must be success", async () => {
    let newValue = `value${Math.random()}` + "_newValue1";

    let result = await Update.update(conn, {
      data: { id: 1, value: newValue },
      table: tableName,
    });

    let rowData = await Select.selectTop1(conn, {
      sql: `select * from ${tableName} where id=?`,
      where: [1],
    });

    expect(rowData.value).to.equal(newValue);

    newValue = `value${Math.random()}` + "_newValue2";

    result = await Update.updateByWhere(conn, {
      data: { value: newValue },
      table: tableName,
      where: { id: 2 },
    });

    rowData = await Select.selectTop1(conn, {
      sql: `select * from ${tableName} where id=?`,
      where: [2],
    });

    expect(rowData.value).to.equal(newValue);

    newValue = `value${Math.random()}` + "_newValue3";

    await Update.update(conn, {
      data: { id: 2, value: newValue },
      table: tableName,
    });

    rowData = await Select.selectTop1(conn, {
      sql: `select * from ${tableName} where id = ?`,
      where: [2],
    });

    expect(rowData.value).to.equal(newValue);
  });

  it("update with tran must be success", async () => {
    let newValue = `value${Math.random()}` + "_newValue11";

    let tran;
    try {
      tran = await Transaction.begin(conn);

      let result = await Update.update(
        conn,
        {
          data: { id: 1, value: newValue },
          table: tableName,
          updateBy: "djd1",
          updateDate: "2021-11-05 15:23:45",
        },
        tran
      );

      await Transaction.commit(tran);
    } catch (err) {
      await Transaction.rollback(tran);
    }

    let rowData = await Select.selectTop1(conn, {
      sql: `select * from ${tableName} where id=?`,
      where: [1],
    });

    expect(rowData.value).to.equal(newValue);

    newValue = `value${Math.random()}` + "_newValue22";

    try {
      tran = await Transaction.begin(conn);

      let result = await Update.updateByWhere(
        conn,
        {
          data: { value: newValue },
          table: tableName,
          where: { id: 2 },
          updateBy: "djd2",
          updateDate: "2021-11-05 23:45:56",
        },
        tran
      );

      await Transaction.commit(tran);
    } catch (err) {
      await Transaction.rollback(tran);
    }

    rowData = await Select.selectTop1(conn, {
      sql: `select value, createBy, convert(char(19), createDate, 120) as createDate, updateBy, convert(char(19), updateDate, 120) as updateDate from ${tableName} where id = ?`,
      where: [2],
    });

    expect(rowData.value).to.equal(newValue);
    expect(rowData.createBy).to.equal(null);
    expect(rowData.createDate).to.equal(null);
    expect(rowData.updateBy).to.equal('djd2');
    expect(rowData.updateDate).to.equal('2021-11-05 23:45:56');
  });

  it("when pars.data is null of update", async () => {
    await Update.update(conn, {
      data: null,
      table: tableName,
    })
      .then(() => {
        expect(true).to.be.false; // 进到这里就有问题
      })
      .catch((err) => {
        expect(err.message).to.equal("pars.data can not be null or empty!");
      });
  });

  it("when pars.data is null of updateByWhere", async () => {
    await Update.updateByWhere(conn, {
      data: null,
      table: tableName,
    })
      .then(() => {
        expect(true).to.be.false; // 进到这里就有问题
      })
      .catch((err) => {
        expect(err.message).to.equal("pars.data can not be null or empty!");
      });
  });

  it("when pars.table is null of update", async () => {
    let insertValue = `value${Math.random()}`;

    await Update.update(conn, {
      data: { value: insertValue },
      table: null,
    })
      .then(() => {
        expect(true).to.be.false; // 进到这里就有问题
      })
      .catch((err) => {
        expect(err.message).to.equal("pars.table can not be null or empty!");
      });
  });

  it("when pars.table is null of updateByWhere", async () => {
    let insertValue = `value${Math.random()}`;

    await Update.updateByWhere(conn, {
      data: { value: insertValue },
      table: null,
    })
      .then(() => {
        expect(true).to.be.false; // 进到这里就有问题
      })
      .catch((err) => {
        expect(err.message).to.equal("pars.table can not be null or empty!");
      });
  });

  it("when table is not exists of update", async () => {
    let insertValue = `value${Math.random()}`;

    let tableName = `tbl_not_exists`;

    await Update.update(conn, {
      data: { value: insertValue },
      table: tableName,
    })
      .then(() => {
        expect(true).to.be.false; // 进到这里就有问题
      })
      .catch((err) => {
        expect(err.message).to.equal(`Table '${tableName}' is not exists!`);
      });
  });

  it("when table is not exists of updateByWhere", async () => {
    let insertValue = `value${Math.random()}`;

    let tableName = `tbl_not_exists`;

    await Update.updateByWhere(conn, {
      data: { value: insertValue },
      table: tableName,
    })
      .then(() => {
        expect(true).to.be.false; // 进到这里就有问题
      })
      .catch((err) => {
        expect(err.message).to.equal(`Table '${tableName}' is not exists!`);
      });
  });

  it("update as data with no primary key", async () => {
    let insertValue = `value${Math.random()}_update5`;

    await Update.update(conn, {
      data: {
        value: insertValue,
      },
      table: tableName,
      onlyUpdateByPrimaryKey: false,
    });

    let rowData = await Select.selectTop1(conn, {
      sql: `select * from ${tableName}`,
    });

    expect(rowData.value).to.equal(insertValue);
  });

  it("when error of update", async () => {
    let insertValue = `123456789012345678901234567890123456789012345678901234567890`;

    await Update.update(conn, {
      data: {
        id: 1,
        dateValue: insertValue,
        value2: "aaa",
      },
      table: tableName,
    })
      .then(() => {
        expect(true).to.be.false; // 进到这里就有问题
      })
      .catch((err) => {
        expect(err.code).to.equal(`EREQUEST`);
      });
  });

  it("when error of updateByWhere", async () => {
    let insertValue = `123456789012345678901234567890123456789012345678901234567890`;

    await Update.updateByWhere(conn, {
      data: {
        id: 2,
        dateValue: insertValue,
        value2: "aaa",
      },
      table: tableName,
      where: { id: 2 },
    })
      .then(() => {
        expect(true).to.be.false; // 进到这里就有问题
      })
      .catch((err) => {
        expect(err.code).to.equal(`EREQUEST`);
      });
  });
});
