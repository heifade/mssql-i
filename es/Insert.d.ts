import { ConnectionPool, Transaction as MssqlTransaction } from "mssql";
export declare class Insert {
    static insert(conn: ConnectionPool, pars: {
        data: {};
        database?: string;
        chema?: string;
        table: string;
    }, tran?: MssqlTransaction): Promise<{}>;
}
