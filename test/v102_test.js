var fs = require('fs');
var path = require('path');
let { expect } = require('chai');

let Parser = require('../lib/index.js').Parser;

var loadFixture = function(fixtures, name, filename) {
  var data = fs.readFileSync(filename, 'utf-8');
  fixtures[name] = data.toString();
};

describe('parsing 1.0.2 spec', function () {
  var FIXTURE_FILE = path.join(__dirname, './fixtures/v102Sample.ofx');

  beforeEach(function () {
    this.fixtures = {};
    loadFixture(this.fixtures, 'ofxFile', FIXTURE_FILE);

    let parser = new Parser(this.fixtures.ofxFile);
    this.result = parser.parse();
  });

  it('parses headers properly', function () {
    let headers = this.result.headers;

    expect(headers).to.deep.equal({
      CHARSET: '1252',
      COMPRESSION: null,
      DATA: 'OFXSGML',
      ENCODING: 'USASCII',
      NEWFILEUID: null,
      OFXHEADER: '100',
      OLDFILEUID: null,
      SECURITY: null,
      VERSION: '102'
    });
  });

  it('parses all accounts', function () {
    expect(this.result.accounts.length).to.equal(2);
  });

  describe('parsing the checking account', function () {
    beforeEach(function () {
      this.checkingAccount = this.result.accounts[0];
    });

    it('parses the account properly', function () {
      let account = this.checkingAccount;

      expect(account).to.deep.include({
        bankId: '000000123',
        id: '123456',
        type: 'CHECKING',
        available_balance: null,
        currency: 'USD'
      });

      expect(account.balance).to.deep.equal({
        amount: 215656, // in pennies
        postedAt: '2005-08-31 16:50:56'
      })
    });

    it('parses transactions properly', function () {
      let transactions = this.checkingAccount.transactions;

      expect(transactions.length).to.equal(1);
      expect(transactions[0]).to.deep.include({
        amount: -8032,
        fitId: '219378',
        postedAt: '2005-08-24 08:00:00',
        checkNumber: '1044',
        name: 'FrogKick Scuba Gear',
        type: 'PAYMENT'
      });
    });

  });

  describe('parsing the savings account', function () {
    beforeEach(function () {
      this.savingsAccount = this.result.accounts[1];
    });

    it('parses the account properly', function () {
      let account = this.savingsAccount;

      expect(account).to.deep.include({
        bankId: '000000123',
        id: '654321',
        type: 'SAVINGS',
        available_balance: null,
        currency: 'USD'
      });

      expect(account.balance).to.deep.equal({
        amount: 345200, // in pennies
        postedAt: '2005-08-31 16:50:56'
      })
    });

    it('parses transactions properly', function () {
      let transactions = this.savingsAccount.transactions;
      expect(transactions.length).to.equal(0);
    });

  });
});

