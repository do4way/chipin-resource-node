import buffer from 'buffer';

var Buffer = buffer.Buffer;
export default class WSResponse {
  constructor(msg, req) {
    this.msg = msg;
    this.req = req;
    this.cookies = []
    this.headers = {};
    this.statusCode = 200;
    this.answered = false;
  }
  static copyTo(dst, from) {
    Object.assign(dst, from);
    const ignorable = ["msg", "req", "answered", "timeoutId"]
    for (var i = 0; i < ignorable.length; i++) {
      delete dst[ignorable[i]];
    }
  }
  append(field, value) {
    this.headers[field] = this.headers[field] || [];
    this.headers[field].push(value);
  }
  cookie(name, value, options) {
    this.cookies.push({
      name: name,
      value: value,
      option: options
    });
  }
  end(data, encoding, cb) {
    this.write(data, encoding, cb);
    Promise.resolve()
      .then(() => this._end())
      .then(() => {
        if (typeof cb === "function") cb();
      });
  }
  get(field) {
    return this.headers[field][0];
  }
  location(path) {
    this.location = path;
  }
  redirect(status, path) {
    this.statusCode = status;
    this.location = path;
  }
  send(body) {
    this.body = body;
    this._end();
  }
  sendStatus(sc) {
    this.statusCode = sc;
    this._end();
  }
  set(field, value) {
    this.headers[field] = [];
    this.headers[field].push(value);
  }
  status(code) {
    this.statusCode = code;
    return this;
  }
  type(t) {
    this.type = t;
  }
  vary(field) {
    this.set("Vary", field);
  }
  getHeader(h) {
    return this.get(h);
  }
  getHeaderNames() {
    return Object.keys(this.headers);
  }
  getHeaders() {
    return this.headers;
  }
  hasHeader(name) {
    return this.headers[name] ? true : false;
  }
  removeHeader(name) {
    delete this.headers[name];
  }
  setHeader(name, value) {
    this.set(name, value);
  }
  setTimeout(ms, cb) {
    this.timeoutId = setTimeout(()=>{
      this.timeoutId = null;
      this.status(503)
      this.end("WSResponse: response timeout");
      if (typeof cb === "function") cb();
    }, ms);
  }
  write(chunk, encoding, cb) {/*eslint-disable-line no-unused-vars*/
    if (typeof encoding === "function") {
      cb = encoding; /*eslint-disable-line no-unused-vars*/
      encoding = null;
    }
    if (encoding) {
      this.encoding = encoding;
    }
    if (chunk == null) {
      return;
    }
    if (typeof chunk === "string") {
      if (this.body != null) {
        this.body += chunk;
      } else {
        this.body = chunk;
      }
    } else if (Buffer.isBuffer(chunk)) {
      if (this.body != null) {
        this.body = Buffer.concat(this.body, chunk);
      } else {
        this.body = chunk;
      }
    } else if (chunk != null) {
      //???
      if (this.body != null) {
        this.body += chunk.toString();
      } else {
        this.body = chunk.toString();
      }
    }
  }
  writeContinue() {
    this.status(101)
    this._end();
  }
  writeHead(sc, statusMessage, headers) {
    this.status(sc);
    if (headers == null && typeof statusMessage === "object") {
      headers = statusMessage;
      statusMessage = null;
    }
    if (headers == null) {
      return;
    }
    Object.keys(headers).map((k)=>this.append(k, headers[k]));
  }

  _end() {
    return Promise.resolve()
    .then(()=>{
      if (this.answered) {
        return Promise.resolve(this);
      }
      this.answered = true
      return Promise.resolve()
        .then(()=>{
          if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
          }
        }).then(()=>this.req.emit("close"))
    })
  }
}