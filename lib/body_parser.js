const cheerio = require('cheerio')

const convertDate = function convertDate (dateString) {
  if (!dateString) { return null; }

  let [_, year, month, day, hour, minutes, seconds] = dateString.match(/(\d{4})(\d{2})(\d{2})(?:(\d{2})(\d{2})(\d{2}))?/)

  date = `${year}-${month}-${day} `
  if (hour && minutes && seconds) {
    date += `${hour}:${minutes}:${seconds}`;
  }

  return date;
}

const BodyParser = {
  parseSignOn (html) {
    return {
      language: html('signonmsgsrsv1 > sonrs > language').text(),
			fiId: html('signonmsgsrsv1 > sonrs > fi > fid').text(),
			fiName: html('signonmsgsrsv1 > sonrs > fi > org').text()
    }
  },

  parseAccount (html, el) {
    return {
      bankId: el.find('bankacctfrom > bankid').text(),
      id: el.find('bankacctfrom > acctid, ccacctfrom > acctid').text(),
      type: el.find('bankacctfrom > accttype').text(),
      balance: this._parseBalance(el),
      available_balance: this._parseAvailableBalance(el),
      currency: el.find('curdef').text(),
      transactions: this.parseTransactions(html, el).toArray()
    };
  },

  parseTransactions (html, el) {
    return el.find('banktranlist > stmttrn')
      .map((_, tranEl) => this._parseTransaction(html(tranEl)))
  },

  _parseTransaction (el) {
    let amount = Number.parseFloat(el.find('trnamt').text());

    return {
      amount: Math.round(amount * 100),
      fitId: el.find('fitid').text(),
      memo: el.find('memo').text(),
      name: el.find('name').text(),
      payee: el.find('payee').text(),
      checkNumber: el.find('checknum').text(),
      refNumber: el.find('refnum').text(),
      postedAt: convertDate(el.find('dtposted').text()),
      type: el.find('trntype').text(),
      sic: el.find('sic').text()
    };
  },

  _parseBalance (el) {
    let amount = el.find('ledgerbal > balamt').text();
    let dateString = el.find('ledgerbal > dtasof').text();
    return this._buildBalance(amount, dateString);
  },

  _parseAvailableBalance (el) {
    if (el.find('availbal').length) {
      let amount = el.find('availbal > balamt').text();
      let dateString = el.find('availbal > dtasof').text();
      return this._buildBalance(amount, dateString);
    } else {
      return null;
    }
  },

  _buildBalance (amount, dateString) {
    return {
      // amount in pennies
      amount: Math.round(Number.parseFloat(amount) * 100),
      postedAt: convertDate(dateString)
    }
  }
};

module.exports = {
  parse (bodyText) {
    let html = cheerio.load(bodyText);

    let accountElements = html(
      `bankmsgsrsv1 > stmttrnrs,
      creditcardmsgsrsv1 > ccstmttrnrs`
    );

    let accounts = accountElements.map((_, el) => {
      el = html(el);
      return BodyParser.parseAccount(html, el)
    }).toArray();

    let signOn = BodyParser.parseSignOn(html);

    return [signOn, accounts];
  }
};
