import WSResponse from './ws-response';

export default class LocalResponse extends WSResponse{
  constructor(req) {
    super({}, req);
    this.req = req;
    this.url = req.url;
  }
  text() {
    return Promise.resolve(this.body != null ? String(this.body) : "");
  }

  json() {
    var val = null;
    try {
      val = typeof this.body === "string" ?
        JSON.parse(this.body) : this.body;
    } catch (e) {
      //IGNORE
    }
    return Promise.resolve(val);
  }

  blob() {
    return Promise.resolve(this.body instanceof Blob ? this.body : null);
  }

  arrayBuffer() {
    return Promise.resolve(this.body instanceof ArrayBuffer ? this.body : null);
  }

  formData() {
    return Promise.resolve(this.body instanceof FormData ? this.body : null);
  }


}