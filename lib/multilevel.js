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
const binary_1 = require("./binary");
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
        this._options.maxConnections = netOptions.maxConnections || 1000;
        this._options.address = netOptions.address || 'localhost';
        this._options.port = netOptions.port || 3600;
        this._socket = {};
        this._stream = {};
        this._readStreams = {};
        this._keyStreams = {};
        this._valueStreams = {};
    }
    readStream(id) {
        return this._readStreams[id];
    }
    keyStream(id) {
        return this._keyStreams[id];
    }
    valueStream(id) {
        return this._valueStreams[id];
    }
    deleteStream(stream, key) {
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
    set levelModule(module) {
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
            this._stream = new stream_1.TransformStream(this._db);
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
        this._socket.connect(this._options.port, this._options.address, () => {
            this._stream = new stream_1.TransformStream(undefined, this);
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
        socket.on('error', (err) => {
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
    put(key, value, options) {
        return new Promise((resolve, reject) => {
            const packet = {
                id: uuid(),
                data: {
                    method: 'put',
                    parameters: [key, value, options || {}]
                }
            };
            this._socket.write(binary_1.binary.packet.encode(packet));
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
            this._socket.write(binary_1.binary.packet.encode(packet));
            this.once(packet.id, (result, err) => {
                // Non exist Key returns error
                if (err)
                    resolve(false);
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
            this._socket.write(binary_1.binary.packet.encode(packet));
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
            this._socket.write(binary_1.binary.packet.encode(packet));
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
            this._socket.write(binary_1.binary.packet.encode(packet));
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
            this._socket.write(binary_1.binary.packet.encode(packet));
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
        this._socket.write(binary_1.binary.packet.encode(packet));
        this._readStreams[packet.id] = new events_1.EventEmitter();
        return this._readStreams[packet.id];
    }
    createKeyStream(options) {
        const packet = {
            id: uuid(),
            data: {
                method: 'createKeyStream',
                parameters: [options || {}]
            }
        };
        this._socket.write(binary_1.binary.packet.encode(packet));
        this._keyStreams[packet.id] = new events_1.EventEmitter();
        return this._keyStreams[packet.id];
    }
    createValueStream(options) {
        const packet = {
            id: uuid(),
            data: {
                method: 'createValueStream',
                parameters: [options || {}]
            }
        };
        this._socket.write(binary_1.binary.packet.encode(packet));
        this._valueStreams[packet.id] = new events_1.EventEmitter();
        return this._valueStreams[packet.id];
    }
}
exports.MultiLevel = MultiLevel;
