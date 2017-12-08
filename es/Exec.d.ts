import { ConnectionPool, Transaction as MssqlTransaction } from "mssql";
export declare class Exec {
    static exec(conn: ConnectionPool, sql: string, tran?: MssqlTransaction): Promise<boolean>;
    static execs(conn: ConnectionPool, sqls: string[]): Promise<{}[]>;
    static execsSeq(conn: ConnectionPool, sqls: string[], tran?: MssqlTransaction): Promise<void>;
}
