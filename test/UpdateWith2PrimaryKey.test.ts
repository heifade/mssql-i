import { expect } from "chai";
import "mocha";
import { initTableWith2PrimaryKey } from "./DataInit";
import { ConnectionHelper, Update, Select, ConnectionPool, Transaction } from "../src/index";
import { getConnectionConfig } from "./connectionConfig";

describe("Update with 2 primary key", function () {
  let tableName = "tbl_test_update_with_2primarykey";
  let conn: ConnectionPool;
  before(async () => {
    conn = await ConnectionHelper.create(getConnectionConfig());
    await initTableWith2PrimaryKey(conn, tableName);
  });
  after(async () => {
    await ConnectionHelper.close(conn);
  });

  it("with 2 primary key must be success", async () => {
    let newValue = `value${Math.random()}` + "_newValue1";

    let result = await Update.update(conn, {
      data: { id1: 1, id2: 1, value: newValue },
      table: tableName,
    });

    let rowData = await Select.selectTop1(conn, {
      sql: `select * from ${tableName} where id1 = ? and id2 = ?`,
      where: [1, 1],
    });

    expect(rowData.value).to.equal(newValue);

    newValue = `value${Math.random()}` + "_newValue2";

    result = await Update.updateByWhere(conn, {
      data: { value: newValue },
      table: tableName,
      where: { id1: 2, id2: 2 },
    });

    rowData = await Select.selectTop1(conn, {
      sql: `select * from ${tableName} where id1 = ? and id2 = ?`,
      where: [2, 2],
    });

    expect(rowData.value).to.equal(newValue);

    newValue = `value${Math.random()}` + "_newValue3";

    await Update.update(conn, {
      data: { id1: 2, id2: 2, value: newValue },
      table: tableName,
      updateBy: 'djd2',
      updateDate: '2021-11-05 23:45:56'
    });

    rowData = await Select.selectTop1(conn, {
      sql: `select * from ${tableName} where id1 = ? and id2 = ?`,
      where: [2, 2],
    });

    expect(rowData.value).to.equal(newValue);
  });

  it("with 2 primary key when primary key is null", async () => {
    let newValue = `value${Math.random()}` + "_newValue1";

    try {
      await Update.update(conn, {
        data: { id1: 1, value: newValue },
        table: tableName,
      });
      expect(true).to.be.false; // 进到这里就有问题
    } catch (e) {
      expect(e.message).to.equal("Field: id2 can not be null!");
    }
  });

  it("with 2 primary key with tran must be success", async () => {
    let newValue = `value${Math.random()}` + "_newValue11";

    let tran;
    try {
      tran = await Transaction.begin(conn);

      let result = await Update.update(
        conn,
        {
          data: { id1: 1, id2: 1, value: newValue },
          table: tableName,
        },
        tran
      );

      await Transaction.commit(tran);
    } catch (err) {
      await Transaction.rollback(tran);
    }

    let rowData = await Select.selectTop1(conn, {
      sql: `select * from ${tableName} where id1 = ? and id2 = ?`,
      where: [1, 1],
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
          where: { id1: 2, id2: 2 },
        },
        tran
      );

      await Transaction.commit(tran);
    } catch (err) {
      await Transaction.rollback(tran);
    }

    rowData = await Select.selectTop1(conn, {
      sql: `select * from ${tableName} where id1 = ? and id2 = ?`,
      where: [2, 2],
    });

    expect(rowData.value).to.equal(newValue);
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

  it("with 2 primary key as data with no primary key", async () => {
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
        id1: 1,
        id2: 1,
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
        id1: 2,
        id2: 2,
        dateValue: insertValue,
        value2: "aaa",
      },
      table: tableName,
      where: { id1: 2, id2: 2 },
    })
      .then(() => {
        expect(true).to.be.false; // 进到这里就有问题
      })
      .catch((err) => {
        expect(err.code).to.equal(`EREQUEST`);
      });
  });
});
