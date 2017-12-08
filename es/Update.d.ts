import { ConnectionPool, Transaction as MssqlTransaction } from "mssql";
export declare class Update {
    static update(conn: ConnectionPool, pars: {
        data: {};
        database?: string;
        chema?: string;
        table: string;
    }, tran?: MssqlTransaction): Promise<boolean>;
    static updateByWhere(conn: ConnectionPool, pars: {
        data: {};
        where?: {};
        database?: string;
        chema?: string;
        table: string;
    }, tran?: MssqlTransaction): Promise<boolean>;
}
