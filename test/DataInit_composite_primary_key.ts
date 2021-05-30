import { Save, Exec, SaveType, Schema, Utils, ConnectionPool } from "../src/index";

export let initTable = async function (conn: ConnectionPool, tableName: string) {
  await Exec.exec(conn, `if exists (select top 1 1 from sys.tables where name = '${tableName}') drop table ${tableName}`);
  await Exec.exec(
    conn,
    `create table ${tableName} (
        key1 int,
        key2 int,
        key3 int,
        value varchar(50),
        dateValue datetime,
        primary key(key1, key2, key3)
      )`
  );

  Schema.clear(Utils.getDataBaseFromConnection(conn));

  for (let i = 0; i < 10; i++) {
    let data = { key1: i, key2: i, key3: i, value: `value${Math.random()}` };
    await Save.save(conn, {
      data: data,
      table: tableName,
      saveType: SaveType.insert,
    });
  }
};
