/// <reference types="node" />
import { OptionsInterface } from './interfaces';
import { EventEmitter } from 'events';
export declare class MultiLevel extends EventEmitter {
    private _options;
    private _socket;
    private _db;
    private _stream;
    private _readStream;
    private _keyStream;
    private _valueStream;
    constructor(netOptions?: Partial<OptionsInterface>);
    readonly readStream: EventEmitter;
    readonly keyStream: EventEmitter;
    readonly valueStream: EventEmitter;
    levelModule: any;
    level(path: string, options?: any, cb?: any): void;
    listen(options?: Partial<OptionsInterface>): void;
    connect(options?: Partial<OptionsInterface>): void;
    stop(): void;
    private setOptions;
    private socketEvents;
    put(key: any, value: any, options?: any): Promise<any>;
    get(key: any, options?: any): Promise<any>;
    del(key: any, options?: any): Promise<any>;
    batch(batch: any, options?: any): Promise<any>;
    isOpen(): Promise<any>;
    isClosed(): Promise<any>;
    createReadStream(options?: any): EventEmitter;
    createKeyStream(options?: any): EventEmitter;
    createValueStream(options?: any): EventEmitter;
}
