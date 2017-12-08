import { config, ConnectionPool } from "mssql";
export declare class ConnectionHelper {
    static create(connConfig: config): Promise<ConnectionPool>;
    static close(conn: ConnectionPool): Promise<void>;
}
