'use strict';
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const net = __importStar(require("net"));
const jsBinary_1 = require("./jsBinary");
const stream_1 = require("./stream");
const events_1 = require("events");
const uuid = require('uuid-v4');
const level = require('level');
class MultiLevel extends events_1.EventEmitter {
    constructor(netOptions) {
        super();
        if (!netOptions)
            netOptions = {};
        this._options = {};
        this._options.maxConnections = netOptions.maxConnections || 10;
        this._options.address = netOptions.address || 'localhost';
        this._options.port = netOptions.port || 22500;
        this._socket = {};
        this._stream = {};
        this._readStream = new events_1.EventEmitter();
        this._keyStream = new events_1.EventEmitter();
        this._valueStream = new events_1.EventEmitter();
    }
    get readStream() {
        return this._readStream;
    }
    get keyStream() {
        return this._keyStream;
    }
    get valueStream() {
        return this._valueStream;
    }
    set db(module) {
        this._db = module;
        this._stream = new stream_1.TransformStream(this._db);
    }
    level(path, options, cb) {
        this._db = level(path, options, cb);
        this._stream = new stream_1.TransformStream(this._db);
    }
    listen(options) {
        this.setOptions(options);
        const onClientConnected = (socket) => {
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
            .on('error', (err) => {
            this.emit('error', err);
        });
    }
    connect(options) {
        this.setOptions(options);
        this._socket = new net.Socket();
        this._stream = new stream_1.TransformStream(undefined, this);
        this._socket.connect(this._options.port, this._options.address, () => {
            this.socketEvents(this._socket);
            this.emit('connect', this._socket);
            this._socket.pipe(this._stream);
        });
    }
    stop() {
        try {
            if (this._db)
                this._db.close();
            this._socket.destroy();
        }
        catch (err) {
            // Do nothing
        }
    }
    setOptions(options) {
        if (options) {
            this._options.maxConnections = options.maxConnections || this._options.maxConnections;
            this._options.address = options.address || this._options.address;
            this._options.port = options.port || this._options.port;
        }
    }
    socketEvents(socket) {
        socket.on('data', (data) => {
            this.emit('data', data);
        });
        socket.on('close', () => {
            this.emit('close', socket);
        });
        socket.on('error', (err) => {
            this.emit('error', err);
        });
    }
    // ------------------------ Start DB Commands ------------------------
    put(key, value, options) {
        return new Promise((resolve, reject) => {
            const packet = {
                id: uuid(),
                data: {
                    method: 'put',
                    parameters: [key, value, options || {}]
                }
            };
            this._socket.write(jsBinary_1.jsBinary.packet.encode(packet));
            this.once(packet.id, (result, err) => {
                if (err)
                    reject(err);
                else
                    resolve(result);
            });
        });
    }
    get(key, options) {
        return new Promise((resolve, reject) => {
            const packet = {
                id: uuid(),
                data: {
                    method: 'get',
                    parameters: [key, options || {}]
                }
            };
            this._socket.write(jsBinary_1.jsBinary.packet.encode(packet));
            this.once(packet.id, (result, err) => {
                if (err)
                    reject(err);
                else
                    resolve(result);
            });
        });
    }
    del(key, options) {
        return new Promise((resolve, reject) => {
            const packet = {
                id: uuid(),
                data: {
                    method: 'del',
                    parameters: [key, options || {}]
                }
            };
            this._socket.write(jsBinary_1.jsBinary.packet.encode(packet));
            this.once(packet.id, (result, err) => {
                if (err)
                    reject(err);
                else
                    resolve(result);
            });
        });
    }
    batch(batch, options) {
        return new Promise((resolve, reject) => {
            const packet = {
                id: uuid(),
                data: {
                    method: 'batch',
                    parameters: [batch, options || {}]
                }
            };
            this._socket.write(jsBinary_1.jsBinary.packet.encode(packet));
            this.once(packet.id, (result, err) => {
                if (err)
                    reject(err);
                else
                    resolve(result);
            });
        });
    }
    isOpen() {
        return new Promise((resolve, reject) => {
            const packet = {
                id: uuid(),
                data: {
                    method: 'isOpen',
                    parameters: [{}]
                }
            };
            this._socket.write(jsBinary_1.jsBinary.packet.encode(packet));
            this.once(packet.id, (result, err) => {
                if (err)
                    reject(err);
                else
                    resolve(result);
            });
        });
    }
    isClosed() {
        return new Promise((resolve, reject) => {
            const packet = {
                id: uuid(),
                data: {
                    method: 'isClosed',
                    parameters: [{}]
                }
            };
            this._socket.write(jsBinary_1.jsBinary.packet.encode(packet));
            this.once(packet.id, (result, err) => {
                if (err)
                    reject(err);
                else
                    resolve(result);
            });
        });
    }
    createReadStream(options) {
        const packet = {
            id: uuid(),
            data: {
                method: 'createReadStream',
                parameters: [options || {}]
            }
        };
        this._socket.write(jsBinary_1.jsBinary.packet.encode(packet));
        return this._readStream;
    }
    createKeyStream(options) {
        const packet = {
            id: uuid(),
            data: {
                method: 'createKeyStream',
                parameters: [options || {}]
            }
        };
        this._socket.write(jsBinary_1.jsBinary.packet.encode(packet));
        return this._keyStream;
    }
    createValueStream(options) {
        const packet = {
            id: uuid(),
            data: {
                method: 'createValueStream',
                parameters: [options || {}]
            }
        };
        this._socket.write(jsBinary_1.jsBinary.packet.encode(packet));
        return this._valueStream;
    }
}
exports.MultiLevel = MultiLevel;
