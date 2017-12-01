import { expect } from "chai";
import "mocha";
import { ConnectionHelper } from "../src/index";
import { connectionConfig } from "./connectionConfig";

describe("ConnectionHelper", function() {
  it("create close", done => {
    let asyncFunc = async function() {
      let conn = await ConnectionHelper.create(connectionConfig);
      await ConnectionHelper.close(conn);

      let o = Object.assign({}, connectionConfig);
      o.user = "";
      ConnectionHelper.create(o).catch(err => {
        let errCode = Reflect.get(err, "code");
        expect(errCode).to.equal(`ELOGIN`);
      });

      await ConnectionHelper.close(conn);
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
