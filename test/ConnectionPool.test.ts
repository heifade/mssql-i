import { expect } from "chai";
import "mocha";
import { ConnectionPool } from "../src/index";
import { connectionConfig } from "./connectionConfig";

describe("ConnectionPool", function() {
  it("init", done => {
    let asyncFunc = async function() {
      ConnectionPool.init(connectionConfig);
      ConnectionPool.init(connectionConfig);

      let conn = await ConnectionPool.getConnection();

      await ConnectionPool.closeConnection(conn);
      await ConnectionPool.closeConnection(conn);
      await ConnectionPool.closeConnection(null);

      await ConnectionPool.closePool();
      await ConnectionPool.closePool();

      let o = Object.assign({}, connectionConfig);
      o.user = "";

      ConnectionPool.init(o);

      try {
        conn = await ConnectionPool.getConnection();
      } catch {}

      await ConnectionPool.closePool();

      await ConnectionPool.closePool();
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
