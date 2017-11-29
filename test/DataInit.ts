import { Save, Exec, RowDataModel, SaveType, Schema } from "../src/index";
import { ConnectionPool } from "mssql";

export let initTable = async function(
  conn: ConnectionPool,
  tableName: string,
  autoIncrement: boolean
) {
  await Exec.exec(conn, `drop table ${tableName}`);
  await Exec.exec(
    conn,
    `create table ${tableName} (
        id int not null ${autoIncrement ? "identity(1,1)" : ""} primary key,
        value varchar(50),
        dateValue datetime
      )`
  );

  // Schema.clear(conn.config.database);

  for (let i = 0; i < 10; i++) {
    let data = autoIncrement
      ? RowDataModel.create({ value: `value${Math.random()}` })
      : RowDataModel.create({ id: i, value: `value${Math.random()}` });

    await Save.save(conn, {
      data: data,
      table: tableName,
      saveType: SaveType.insert
    });
  }
};
