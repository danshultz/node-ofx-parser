const headerParsers = require('./header_parsers');
const bodyParser = require('./body_parser');

class Parser {
  constructor (data) {
    this.data = data;
  }

  parse () {
    if (this.data.indexOf('<OFX>') === -1) {
      throw new Error('Not a valid OFX document.');
    }

    let [headers, bodyText] = this._prepareData(this.data);

    let [signOn, accounts] = bodyParser.parse(bodyText);
    return {
      headers,
      signOn,
      accounts
    }
  }

  _prepareData (data) {
    let [headerText, body] = data.split('<OFX>', 2);

    let headers = this._parseHeader(headerText);
    body = this._prepareBody(body);

    return [headers, body]
  }

  _parseHeader (headerText) {
    return headerParsers.ofx102(headerText) || headerParsers.ofx211(headerText);
  }

  _prepareBody (body) {
    body = '<OFX>' + body;

    // TODO (EK): Check for closing tags if so just return the XML
    return body
      .replace(/>\s+</g, '><')
      .replace(/\s+</g, '<')
      .replace(/>\s+/g, '>')
      .replace(/<([A-Z0-9_]*)+\.+([A-Z0-9_]*)>([^<]+)/g, '<\$1\$2>\$3' )
      .replace(/<(\w+?)>([^<]+)/g, '<\$1>\$2</\$1>');
  }
}

module.exports = {
  Parser
};


