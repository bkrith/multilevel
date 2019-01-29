export interface OptionsInterface {
    address: string;
    port: number;
    maxConnections: number;
}
export interface PacketInterface {
    id: string;
    data: DataInterface;
}
export interface DataInterface {
    method: string;
    parameters?: any[];
    result?: any;
    error?: any;
    end?: boolean;
}
