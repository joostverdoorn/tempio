const moment = require('momentjs');

const MILLISECOND = 1;
const SECOND = 1000 * MILLISECOND;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const FORTNIGHT = 14 * DAY;
const MONTH = 31 * DAY;
const YEAR = 365 * DAY;
const DECADE = 10 * YEAR;
const CENTURY = 100 * YEAR;

const units = {
  millisecond: MILLISECOND,
  second: SECOND,
  minute: MINUTE,
  hour: HOUR,
  day: DAY,
  week: WEEK,
  fortnight: FORTNIGHT,
  month: MONTH,
  year: YEAR,
  decade: DECADE,
  century: CENTURY
};

const tokenizers = {
  scalar: word => {
    const scalar = Number(word);
    if (isNaN(scalar)) return null;
    return { type: 'scalar', value: scalar };
  },

  unit: word => {
    if (word in units) return { type: 'unit', value: units[word] };
    return null;
  },

  ago: word => {
    if (word === 'ago') return { type: 'ago' };
    return null;
  },

  from: word => {
    if (word === 'from') return { type: 'from' };
    return null;
  },

  date: word => {
    switch (word) {
      case 'now':
        return { type: 'date', value: Date.now() };
      case 'yesterday':
        return { type: 'date', value: Date.now() - (1 * DAY) };

    }
    return null;
  }
}

const tokenize = word => {
  const tokenTypes = Object.keys(tokenizers);
  for (type of tokenTypes) {
    let tokenizer = tokenizers[type];
    let token = tokenizer(word);
    if (token) return token;
  }
  return null;
}

const parsers = {
  span: tokens => {
    let [a, b, ...rest] = tokens;
    if (a && b && a.type === 'scalar' && b.type === 'unit') return [{ type: 'span', value: a.value * b.value }, ...rest];
    return tokens;
  },

  ago: tokens => {
    let [a, b, ...rest] = tokens;
    if (a && b && a.type === 'span' && b.type === 'ago') return [{type: 'date', value: Date.now() - a.value}, ...rest];
    return tokens;
  },

  from: tokens => {
    let [a, b, c, ...rest] = tokens;
    if (a && b  && c && a.type === 'span' && b.type === 'from' && c.type === 'date') return [{type: 'date', value: c.value + a.value}, ...rest];
    if (a && b  && c && a.type === 'date' && b.type === 'from' && c.type === 'date') return [{type: 'date', value: c.value + (a.value - Date.now())}, ...rest];
    return tokens;
  }
}

const parse = tokens => {
  const parserTypes = Object.keys(parsers);

  let [ first, ...rest ] = tokens;
  if (first.type === 'date' && !rest.length) return [ first ];

  for (type of parserTypes) {
    let parser = parsers[type];
    let newTokens = parser(tokens);

    if (tokens !== newTokens) return parse(newTokens);
  }

  throw new Error(`Parse Error: Unexpected token ${first.type}`);

}


function tempio(string) {
  let words = string.split(' ');
  return parse(words.map(tokenize));
}

module.exports = tempio;
global.tempio = tempio;
