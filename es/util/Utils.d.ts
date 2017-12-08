import { ConnectionPool } from "mssql";
export declare class Utils {
    static getDbObjectName(database: string, chema: string, objectName: string): string;
    static getDataBaseFromConnection(conn: ConnectionPool): any;
}
