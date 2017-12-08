import { ConnectionPool, Transaction as MssqlTransaction } from "mssql";
import { SaveType } from "./model/SaveType";
export declare class Save {
    static save(conn: ConnectionPool, pars: {
        data: {};
        database?: string;
        table: string;
        saveType: SaveType;
    }, tran?: MssqlTransaction): Promise<{}>;
    static saves(conn: ConnectionPool, list: Array<{
        data: {};
        database?: string;
        table: string;
        saveType: SaveType;
    }>, tran?: MssqlTransaction): Promise<any[]>;
    static savesSeq(conn: ConnectionPool, list: Array<{
        data: {};
        database?: string;
        table: string;
        saveType: SaveType;
    }>, tran?: MssqlTransaction): Promise<void>;
    static savesSeqWithTran(conn: ConnectionPool, list: Array<{
        data: {};
        database?: string;
        table: string;
        saveType: SaveType;
    }>): Promise<never>;
}
