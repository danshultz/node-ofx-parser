var fs = require('fs');
var path = require('path');
let { expect } = require('chai');

let Parser = require('../lib/index.js').Parser;

var loadFixture = function(fixtures, name, filename) {
  var data = fs.readFileSync(filename, 'utf-8');
  fixtures[name] = data.toString();
};

describe('parsing 2.1.1 spec', function () {
  var FIXTURE_FILE = path.join(__dirname, './fixtures/v211Sample.ofx');

  beforeEach(function () {
    this.fixtures = {};
    loadFixture(this.fixtures, 'ofxFile', FIXTURE_FILE);

    let parser = new Parser(this.fixtures.ofxFile);
    this.result = parser.parse();
  });

  it('parses headers properly', function () {
    let headers = this.result.headers;

    expect(headers).to.deep.equal({
      NEWFILEUID: null,
      OLDFILEUID: null,
      SECURITY: null,
      OFXHEADER: '200',
      VERSION: '211'
    });
  });

  it('parses the sign on info properly', function () {
    let signOnInfo = this.result.signOn;

    expect(signOnInfo).to.deep.equal({
      language: 'ENG',
      fiId: '',
      fiName: 'FOO BANK'
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
        postedAt: '2005-08-31 16:51:53'
      })
    });

    it('parses transactions properly', function () {
      let transactions = this.checkingAccount.transactions;

      expect(transactions.length).to.equal(1);
      expect(transactions[0]).to.deep.include({
        amount: -8000,
        fitId: '219378',
        name: 'FrogKick Scuba Gear',
        postedAt: '2005-08-24 08:00:00',
        type: 'POS'
      });
    });

  });

  describe('parsing the credit account', function () {
    beforeEach(function () {
      this.creditAccount = this.result.accounts[1];
    });

    it('parses the account properly', function () {
      let account = this.creditAccount;

      expect(account).to.deep.include({
        bankId: '',
        id: '123412341234',
        type: '',
        available_balance: null,
        currency: 'USD'
      });

      expect(account.balance).to.deep.equal({
        amount: -56200, // in pennies
        postedAt: '2005-08-31 16:51:53'
      })
    });

    it('parses transactions properly', function () {
      let transactions = this.creditAccount.transactions;

      expect(transactions.length).to.equal(2);
      expect(transactions[0]).to.deep.include({
        amount: -2300,
        fitId: '219867',
        name: 'Interest Charge',
        postedAt: '2005-08-11 08:00:00',
        type: 'INT'
      });
      expect(transactions[1]).to.deep.include({
        amount: 35000,
        fitId: '219868',
        name: 'Payment - Thank You',
        postedAt: '2005-08-11 08:00:00',
        type: 'CREDIT'
      });
    });

  });

});
