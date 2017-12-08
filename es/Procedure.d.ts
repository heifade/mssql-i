import { ConnectionPool, Transaction as MssqlTransaction, IProcedureResult } from "mssql";
export interface ProcedureResult extends IProcedureResult<any> {
}
export declare class Procedure {
    static exec(conn: ConnectionPool, pars: {
        data?: {};
        database?: string;
        chema?: string;
        procedure: string;
    }, tran?: MssqlTransaction): Promise<ProcedureResult>;
}
