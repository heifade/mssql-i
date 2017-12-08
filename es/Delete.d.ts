import { ConnectionPool, Transaction as MssqlTransaction } from "mssql";
export declare class Delete {
    static delete(conn: ConnectionPool, pars: {
        where?: {};
        database?: string;
        chema?: string;
        table: string;
    }, tran?: MssqlTransaction): Promise<never>;
}
