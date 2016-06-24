const ofx211AttributeRegex = /([a-zA-Z]*?)=\"([^"]*)\"/g;

const buildOfx102Headers = function buildOfx102Headers (headerMatches) {
  return headerMatches.reduce((headers, match) => {
    let [_, key, value] = match;
    headers[key] = (value == 'NONE' ? null : value)
    return headers;
  }, {});
};

const buildOfx211headers = function buildOfx211headers (headerLine) {
  ofx211AttributeRegex.lastIndex = 0; // ensure last index is reset

  let headers = {}, match;
  while (match = ofx211AttributeRegex.exec(headerLine)) {
    let [_, key, value] = match;
    headers[key] = (value == 'NONE' ? null : value)
  }

  return headers;
}

const ofx102 = function ofx102(headerText) {
  let headerLines = headerText
    .split(/\r|\n/); // split on new lines or carriage returns

  let lineMatches = headerLines
    .map((line) => line.match(/^(.*?):(.*?)\s*(\r?\n)*$/))
    .filter((match) => match);

  let headers;
  if (lineMatches.length) {
    headers = buildOfx102Headers(lineMatches);
  }

  return headers;
};

const ofx211 = function ofx211 (headerText) {
  let headerLine = headerText
    .split(/\r|\n/) // split on new lines or carriage returns
    .filter((l) => l.includes('OFX'))[0]

  let headers;
  if (ofx211AttributeRegex.test(headerLine)) {
    headers = buildOfx211headers(headerLine)
  }

  return headers;
}

module.exports = {
  ofx102,
  ofx211
}
