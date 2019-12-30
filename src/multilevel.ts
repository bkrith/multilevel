
'use strict';

import * as net from 'net';
import { OptionsInterface, PacketInterface, StreamInterface, } from './interfaces';
import { binary } from './binary';
import { TransformStream } from './stream';
import { EventEmitter } from 'events';

const uuid = require('uuid-v4');
const level = require('level');

export class MultiLevel extends EventEmitter {

    private _options: OptionsInterface;
    private _socket: net.Socket;
    private _db: any;
    private _stream: TransformStream;
    private _readStreams: StreamInterface;
    private _keyStreams: StreamInterface;
    private _valueStreams: StreamInterface;

    constructor(netOptions?: Partial<OptionsInterface>) {
        super();

        if (!netOptions) netOptions = {} as OptionsInterface;
        this._options = {} as OptionsInterface;

        this._options.maxConnections = netOptions.maxConnections || 1000;
        this._options.address = netOptions.address || 'localhost';
        this._options.port = netOptions.port || 3600;

        this._socket = {} as net.Socket;

        this._stream = {} as TransformStream;

        this._readStreams = {} as StreamInterface;
        this._keyStreams = {} as StreamInterface;
        this._valueStreams = {} as StreamInterface;
    }

    readStream(id: string): EventEmitter {
        return this._readStreams[id];
    }

    keyStream(id: string): EventEmitter {
        return this._keyStreams[id];
    }

    valueStream(id: string): EventEmitter {
        return this._valueStreams[id];
    }

    deleteStream(stream: string, key: string) {
        switch (stream) {
            case 'read':
                this._readStreams[key].removeAllListeners();
                delete this._readStreams[key];
                break;
            case 'key':
                this._keyStreams[key].removeAllListeners();
                delete this._keyStreams[key];
                break;
            case 'value':
                this._valueStreams[key].removeAllListeners();
                delete this._valueStreams[key];
                break;
        }
    }

    set levelModule(module: any) {
        this._db = module;
        this._stream = new TransformStream(this._db);
    }

    level(path: string, options?: any, cb?: any) {
        this._db = level(path, options, cb);
        this._stream = new TransformStream(this._db);
    }

    listen(options?: Partial<OptionsInterface>) {
        this.setOptions(options);

        const onClientConnected = (socket: net.Socket) => {
            this._stream = new TransformStream(this._db);
            this._socket = socket;
            this.socketEvents(this._socket);
            this.emit('client', this._socket);
            this._socket.pipe(this._stream).pipe(this._socket);
        };

        const connection = net.createServer(onClientConnected);

        connection.maxConnections = this._options.maxConnections;

        connection.listen(this._options.port, () => {
            this.emit('listen', this._options.port);
        })
            .on('error', (err: Error) => {
                this.emit('error', err);
            });
    }

    connect(options?: Partial<OptionsInterface>) {
        this.setOptions(options);

        this._socket = new net.Socket();

        this._socket.connect(this._options.port, this._options.address, () => {
            this._stream = new TransformStream(undefined, this);
            this.socketEvents(this._socket);
            this.emit('connect', this._socket);
            this._socket.pipe(this._stream);
        });
    }

    stop() {
        try {
            if (this._db) this._db.close();
            this._socket.destroy();
        }
        catch (err) {
            // Do nothing
        }
    }

    private setOptions(options?: Partial<OptionsInterface>) {
        if (options) {
            this._options.maxConnections = options.maxConnections || this._options.maxConnections;
            this._options.address = options.address || this._options.address;
            this._options.port = options.port || this._options.port;
        }
    }

    private socketEvents(socket: net.Socket) {
        socket.on('data', (data: Buffer) => {
            this.emit('data', data);
        });

        socket.on('close', () => {
            Object.keys(this._readStreams).forEach((key) => {
                this._readStreams[key].removeAllListeners();
                this.deleteStream('read', key);
            });
            Object.keys(this._keyStreams).forEach((key) => {
                this._keyStreams[key].removeAllListeners();
                this.deleteStream('key', key);
            });
            Object.keys(this._valueStreams).forEach((key) => {
                this._valueStreams[key].removeAllListeners();
                this.deleteStream('value', key);
            });
            this.emit('close', socket);
        });

        socket.on('end', () => {
            Object.keys(this._readStreams).forEach((key) => {
                this._readStreams[key].removeAllListeners();
                this.deleteStream('read', key);
            });
            Object.keys(this._keyStreams).forEach((key) => {
                this._keyStreams[key].removeAllListeners();
                this.deleteStream('key', key);
            });
            Object.keys(this._valueStreams).forEach((key) => {
                this._valueStreams[key].removeAllListeners();
                this.deleteStream('value', key);
            });
            this.emit('end', socket);
        });

        socket.on('error', (err: Error) => {
            Object.keys(this._readStreams).forEach((key) => {
                this._readStreams[key].removeAllListeners();
                this.deleteStream('read', key);
            });
            Object.keys(this._keyStreams).forEach((key) => {
                this._keyStreams[key].removeAllListeners();
                this.deleteStream('key', key);
            });
            Object.keys(this._valueStreams).forEach((key) => {
                this._valueStreams[key].removeAllListeners();
                this.deleteStream('value', key);
            });
            this.emit('error', err);
        });
    }

    // ------------------------ Start DB Commands ------------------------

    put(key: any, value: any, options?: any): Promise<any> {
        return new Promise((resolve, reject) => {
            const packet: PacketInterface = {
                id: uuid(),
                data: {
                    method: 'put',
                    parameters: [key, value, options || {}]
                }
            };

            this._socket.write(binary.packet.encode(packet));

            this.once(packet.id, (result, err) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }

    get(key: any, options?: any): Promise<any> {
        return new Promise((resolve, reject) => {
            const packet: PacketInterface = {
                id: uuid(),
                data: {
                    method: 'get',
                    parameters: [key, options || {}]
                }
            };

            this._socket.write(binary.packet.encode(packet));

            this.once(packet.id, (result, err) => {
                // Non exist Key returns error
                if (err) resolve(false);
                else resolve(result);
            });
        });
    }

    del(key: any, options?: any): Promise<any> {
        return new Promise((resolve, reject) => {
            const packet: PacketInterface = {
                id: uuid(),
                data: {
                    method: 'del',
                    parameters: [key, options || {}]
                }
            };

            this._socket.write(binary.packet.encode(packet));

            this.once(packet.id, (result, err) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }

    batch(batch: any, options?: any): Promise<any> {
        return new Promise((resolve, reject) => {
            const packet: PacketInterface = {
                id: uuid(),
                data: {
                    method: 'batch',
                    parameters: [batch, options || {}]
                }
            };

            this._socket.write(binary.packet.encode(packet));

            this.once(packet.id, (result, err) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }

    isOpen(): Promise<any> {
        return new Promise((resolve, reject) => {
            const packet: PacketInterface = {
                id: uuid(),
                data: {
                    method: 'isOpen',
                    parameters: [{}]
                }
            };

            this._socket.write(binary.packet.encode(packet));

            this.once(packet.id, (result, err) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }

    isClosed(): Promise<any> {
        return new Promise((resolve, reject) => {
            const packet: PacketInterface = {
                id: uuid(),
                data: {
                    method: 'isClosed',
                    parameters: [{}]
                }
            };

            this._socket.write(binary.packet.encode(packet));

            this.once(packet.id, (result, err) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }

    createReadStream(options?: any): EventEmitter {
        const packet: PacketInterface = {
            id: uuid(),
            data: {
                method: 'createReadStream',
                parameters: [options || {}]
            }
        };

        this._socket.write(binary.packet.encode(packet));

        this._readStreams[packet.id] = new EventEmitter();

        return this._readStreams[packet.id];
    }

    createKeyStream(options?: any): EventEmitter {
        const packet: PacketInterface = {
            id: uuid(),
            data: {
                method: 'createKeyStream',
                parameters: [options || {}]
            }
        };

        this._socket.write(binary.packet.encode(packet));

        this._keyStreams[packet.id] = new EventEmitter();

        return this._keyStreams[packet.id];
    }

    createValueStream(options?: any): EventEmitter {
        const packet: PacketInterface = {
            id: uuid(),
            data: {
                method: 'createValueStream',
                parameters: [options || {}]
            }
        };

        this._socket.write(binary.packet.encode(packet));

        this._valueStreams[packet.id] = new EventEmitter();

        return this._valueStreams[packet.id];
    }

    // ------------------------- End DB Commands -------------------------

}
