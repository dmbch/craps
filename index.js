'use strict';

var Ajv = require('ajv');
const flatten = require('flat');
const hash = require('string-hash');

const validateExperiments = new Ajv().compile(require('./schemas/experiments'));
const validateUser = new Ajv().compile(require('./schemas/user'));

module.exports = class Craps {
  constructor(experiments, user) {
    if (validateExperiments(experiments)) {
      this.experiments = experiments;
    } else {
      const errors = JSON.stringify(validateExperiments.errors, null, 2);
      throw new Error(`invalid experiment: \n${errors}`);
    }
    if (validateUser(user)) {
      this.user = flatten(user);
    } else {
      const errors = JSON.stringify(validateUser.errors, null, 2);
      throw new Error(`invalid user: \n${errors}`);
    }
  }
  evaluate({ operator, key, value, conditions }) {
    const { user } = this;
    switch (operator) {
      case undefined:
        return true;
      case '&':
        return conditions.every((c) => this.evaluate(c));
      case '-':
        return !conditions.some((c) => this.evaluate(c));
      case '|':
        return conditions.some((c) => this.evaluate(c));
      case '^':
        return conditions.filter((c) => this.evaluate(c)).length === 1;
      case '=':
        return user[key] == value;
      case '!':
        return user[key] != value;
      case '<':
        return user[key] < value;
      case '>':
        return user[key] > value;
    }
  }
  execute({ id: eid, variants }) {
    const { id: uid } = this.user;
    const remainder =
      hash(`${eid}|${uid}`) %
      variants.reduce((result, { ratio }) => result + ratio, 0);
    let minRemainder = 0;
    return variants.reduce((result, variant, index) => {
      const { ratio, payload } = variant;
      if (remainder >= minRemainder && remainder < (minRemainder += ratio)) {
        Object.assign(result, { id: `${eid}[${index}]`, payload });
      }
      return result;
    }, {});
  }
  roll() {
    const { experiments } = this;
    return experiments
      .filter(({ condition = {} }) => this.evaluate(condition))
      .reduce(
        (result, { id, variants }) =>
          Object.assign(result, { [id]: this.execute({ id, variants }) }),
        {}
      );
  }
};
