import { ConnectionPool, Transaction as MssqlTransaction } from "mssql";
export declare class Replace {
    static replace(conn: ConnectionPool, pars: {
        data: {};
        chema?: string;
        database?: string;
        table: string;
    }, tran?: MssqlTransaction): Promise<{}>;
}
