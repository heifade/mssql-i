import { ConnectionPool } from "mssql";
import * as mssql from "mssql";
export declare class Transaction {
    static begin(conn: ConnectionPool): Promise<mssql.Transaction>;
    static commit(transaction: mssql.Transaction): Promise<void>;
    static rollback(transaction: mssql.Transaction): Promise<void>;
}
