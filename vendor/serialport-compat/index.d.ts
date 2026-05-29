/// <reference types="node" />

import { Duplex } from "stream";

export interface PortInfo {
    path: string;
    comName: string;
    manufacturer?: string;
    serialNumber?: string;
    pnpId?: string;
    locationId?: string;
    vendorId?: string;
    productId?: string;
}

export interface OpenOptions {
    path?: string;
    baudRate?: number;
    autoOpen?: boolean;
    dataBits?: number;
    stopBits?: number;
    parity?: "none" | "even" | "mark" | "odd" | "space";
    rtscts?: boolean;
    xon?: boolean;
    xoff?: boolean;
    xany?: boolean;
    hupcl?: boolean;
    lock?: boolean;
    highWaterMark?: number;
}

export type ErrorCallback = (error?: Error) => void;

export class SerialPort extends Duplex {
    constructor(path: string, options?: OpenOptions, openCallback?: ErrorCallback);
    constructor(options: OpenOptions & { path: string }, openCallback?: ErrorCallback);

    static list(): Promise<PortInfo[]>;
    static list(callback: (error: Error, ports?: PortInfo[]) => void): Promise<PortInfo[]>;

    open(callback?: ErrorCallback): void;
    close(callback?: ErrorCallback): void;
    drain(callback?: ErrorCallback): void;
    flush(callback?: ErrorCallback): void;
    set(options: { brk?: boolean; cts?: boolean; dsr?: boolean; dtr?: boolean; rts?: boolean }, callback?: ErrorCallback): void;
}

export default SerialPort;
