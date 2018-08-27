'use strict';

var Ajv = require('ajv');
const flatten = require('flat');
const crypto = require('crypto');
const bigInt = require('big-integer');

const validateExperiments = new Ajv().compile(require('./schemas/experiments'));
const validateUser = new Ajv().compile(require('./schemas/user'));

const assignExperimentStrategy = (experimentName, userId, distribution) => {
  const hashedExperiment = crypto
    .createHash('sha256')
    .update(`${experimentName}|${userId}`)
    .digest('hex');

  return bigInt(hashedExperiment, 16)
    .mod(distribution)
    .toJSNumber();
};

class Craps {
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
    this.now = Date.now();
  }
  evaluateConditions(conditions) {
    const { user } = this;

    return conditions.every(({ key, operator, value }) => {
      switch (operator) {
        case '=':
          return user[key] == value;
        case '!':
          return user[key] != value;
        case '<':
          return user[key] < value;
        case '>':
          return user[key] > value;
      }

      return false;
    });
  }
  checkDates(startDate, endDate) {
    if (!startDate) {
      return false;
    }
    if (
      new Date(startDate) <= new Date(this.now) &&
      (!endDate || this.now < new Date(endDate))
    ) {
      return true;
    }

    return false;
  }
  assignExperimentVariant({ name: experimentName, variants }) {
    const { userId } = this.user;

    const remainder = assignExperimentStrategy(
      experimentName,
      userId,
      variants.reduce((result, { ratio }) => result + ratio, 0)
    );

    let minRemainder = 0;
    const assignedVariants = variants.filter((experimentVariant) => {
      const { ratio } = experimentVariant;
      return remainder >= minRemainder && remainder < (minRemainder += ratio);
    });

    if (assignedVariants.length != 1) {
      const assigmentErrors = JSON.stringify(assignedVariants, null, 2);
      throw new Error(`experiment assignment failed: \n${assigmentErrors}`);
    }

    return assignedVariants.pop();
  }
  getExperiments() {
    const { experiments } = this;

    return experiments
      .filter(({ startDate, endDate }) => this.checkDates(startDate, endDate))
      .filter(({ conditions = [] }) => this.evaluateConditions(conditions))
      .reduce((result, experiment) => {
        const assignedVariant = this.assignExperimentVariant(experiment);
        return Object.assign(result, {
          [experiment.name]: assignedVariant.variant,
        });
      }, {});
  }
}

module.exports = Craps;
