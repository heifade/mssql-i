import { expect } from "chai";
import "mocha";
import { ConnectionHelper } from "../src/index";
import { getConnectionConfig } from "./connectionConfig";

describe("ConnectionHelper", function() {
  it("create close", async () => {
    let conn = await ConnectionHelper.create(getConnectionConfig());
    await ConnectionHelper.close(conn);

    let o = Object.assign({}, getConnectionConfig());
    o.user = "";
    ConnectionHelper.create(o).catch(err => {
      expect(err.code).to.equal(`ELOGIN`);
    });

    await ConnectionHelper.close(conn);
  });
});
