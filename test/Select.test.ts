import { expect } from "chai";
import "mocha";
import { initTable } from "./DataInit";
import { ConnectionPool } from "mssql";
import { ConnectionHelper, Select } from "../src/index";
import { getConnectionConfig } from "./connectionConfig";
import { IHash } from "../src/interface/iHash";

describe("Select", function () {
  let tableName = "tbl_test_select";
  let conn: ConnectionPool;

  before(async () => {
    conn = await ConnectionHelper.create(getConnectionConfig());
    await initTable(conn, tableName, true);
  });
  after(async () => {
    await ConnectionHelper.close(conn);
  });

  it("select", async () => {
    let list = await Select.select(conn, {
      sql: `select * from ${tableName} where id=?`,
      where: [1],
    });

    expect(list != null && list.length == 1).to.be.true;
  });

  it("select error", async () => {
    await Select.select(conn, {
      sql: `select * from tbl_not_exists`,
    })
      .then(() => {
        expect(true).to.be.false; // 进到这里就有问题
      })
      .catch((err) => {
        expect(err.message.substr(0, 40)).to.equal(`执行SQL: select * from tbl_not_exists 时出错!`);
      });
  });

  it("selectCount", async () => {
    let count = await Select.selectCount(conn, {
      sql: `select * from ${tableName} where id=?`,
      where: [1],
    });

    expect(count).to.equal(1);
  });

  it("selectCount error", async () => {
    await Select.selectCount(conn, {
      sql: `select * from tbl_not_exists`,
    })
      .then(() => {
        expect(true).to.be.false; // 进到这里就有问题
      })
      .catch((err) => {
        expect(err.message.substr(0, 79)).to.equal(`执行SQL: select count(*) as value from (select * from tbl_not_exists) tCount 时出错!`);
      });
  });

  it("selects", async () => {
    let results = await Select.selects<IHash>(conn, [
      { sql: `select * from ${tableName} where id=?`, where: [1] },
      { sql: `select * from ${tableName} where id=?`, where: [2] },
    ]);

    expect(results != null && results.length == 2 && results[0] != null && results[1] != null && results[0].length == 1 && results[1].length == 1).to.be.true;
  });

  it("selectTop1", async () => {
    let result = await Select.selectTop1(conn, {
      sql: `select * from ${tableName} where id=?`,
      where: [1],
    });
    expect(result != null).to.be.true;
  });

  it("selectTop1 error", async () => {
    await Select.selectTop1<IHash>(conn, {
      sql: `select * from tbl_not_exists`,
    })
      .then(() => {
        expect(true).to.be.false; // 进到这里就有问题
      })
      .catch((err) => {
        expect(err.message.substr(0, 40)).to.equal(`执行SQL: select * from tbl_not_exists 时出错!`);
      });
  });

  it("getGUID", async () => {
    let guid = await Select.selectGUID(conn);
    expect(guid !== undefined && guid !== null && guid !== "" && guid.length > 0).to.be.true;
  });

  it("selectOneValue", async () => {
    let value = await Select.selectOneValue(conn, {
      sql: `select * from ${tableName}`,
    });
    expect(value).to.be.equal(1);
  });

  it("selectOneValue with no value", async () => {
    let value = await Select.selectOneValue(conn, {
      sql: `select * from ${tableName} where 1=0`,
    });
    expect(value).to.be.null;
  });

  it("selectOneValue with error", async () => {
    let value = await Select.selectOneValue(conn, {
      sql: `select  from ${tableName}`,
    })
      .then(() => {
        expect(true).to.be.false; // 进到这里就有问题
      })
      .catch((err) => {
        expect(err.message.substr(0, 40)).to.be.equal("执行SQL: select  from tbl_test_select 时出错!");
      });
  });

  it("selectSplitPage", async () => {
    let splitResult = await Select.selectSplitPage(conn, {
      sql: `select *, ROW_NUMBER() over(order by id) as row_number from ${tableName} where id=?`,
      where: [1],
      pageSize: 10,
      index: 0,
    });

    expect(splitResult.count).to.equal(1);
    expect(splitResult.list != null && splitResult.list.length == 1).to.be.true;

    splitResult = await Select.selectSplitPage(conn, {
      sql: `select *, ROW_NUMBER() over(order by id) as row_number from ${tableName} where id=?`,
      where: [1],
      pageSize: 10,
      index: 1,
    });

    expect(splitResult.count).to.equal(1);
    expect(splitResult.list != null && splitResult.list.length == 1).to.be.true;
  });

  it("selectSplitPage error", async () => {
    await Select.selectSplitPage(conn, {
      sql: `select *, ROW_NUMBER() over(order by id) as row_number from tbl_not_exists where id=?`,
      where: [1],
      pageSize: 10,
      index: 1,
    })
      .then(() => {
        expect(true).to.be.false; // 进到这里就有问题
      })
      .catch((err) => {
        expect(err.message.substr(0, 150)).to.equal(`执行SQL: select count(*) as value from (select *, ROW_NUMBER() over(order by id) as row_number from tbl_not_exists where id=@wpar0) tCount 时, 参数: [1]出错!`);
      });
  });
});
