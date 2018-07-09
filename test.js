'use strict';

const test = require('ava');

const Craps = require('./index');

const getRandomID = () =>
  Math.random()
    .toString(36)
    .substring(2);

test('argument validation', (t) => {
  t.throws(() => new Craps());
  t.throws(() => new Craps({}));
  t.throws(() => new Craps([]));
  t.throws(() => new Craps([], {}));
  t.throws(() => new Craps([{}], { id: '' }));
});

test('unconditional dice roll', (t) => {
  const craps = new Craps(
    [
      {
        id: 'foo',
        variants: [
          {
            ratio: 1,
            payload: 'bar',
          },
        ],
      },
    ],
    {
      id: '123',
    }
  );
  const { foo: result } = craps.roll();
  t.is(result.id, 'foo[0]');
  t.is(result.payload, 'bar');
});

test('conditional dice roll', (t) => {
  const createCraps = (user) =>
    new Craps(
      [
        {
          id: 'foo',
          condition: {
            operator: '=',
            key: 'baz',
            value: 'qux',
          },
          variants: [
            {
              ratio: 1,
              payload: 'bar',
            },
          ],
        },
      ],
      user
    );
  const { foo: result1 } = createCraps({ id: '1', baz: 'qux' }).roll();
  const { foo: result2 } = createCraps({ id: '1', baz: 'quux' }).roll();
  t.is(result1.id, 'foo[0]');
  t.is(result1.payload, 'bar');
  t.is(result2, undefined);
});

test('consecutive fairness', (t) => {
  const createCraps = (user) =>
    new Craps(
      [
        {
          id: 'foo',
          variants: [
            {
              ratio: 5,
              payload: 'bar',
            },
            {
              ratio: 10,
              payload: 'baz',
            },
          ],
        },
      ],
      user
    );
  const counters = { bar: 0, baz: 0 };
  for (let i = 0; i < 100000; i++) {
    let { foo: result } = createCraps({ id: `${i}` }).roll();
    counters[result.payload]++;
  }
  t.true(counters.bar > (counters.baz / 2) * 0.95);
  t.true(counters.bar < (counters.baz / 2) * 1.05);
});

test('random fairness', (t) => {
  const createCraps = (user) =>
    new Craps(
      [
        {
          id: 'foo',
          variants: [
            {
              ratio: 5,
              payload: 'bar',
            },
            {
              ratio: 10,
              payload: 'baz',
            },
          ],
        },
      ],
      user
    );
  const counters = { bar: 0, baz: 0 };
  for (let i = 0; i < 100000; i++) {
    const { foo: result } = createCraps({ id: getRandomID() }).roll();
    counters[result.payload]++;
  }
  t.true(counters.bar > (counters.baz / 2) * 0.95);
  t.true(counters.bar < (counters.baz / 2) * 1.05);
});

test('multi random fairness', (t) => {
  const createCraps = (user) =>
    new Craps(
      [
        {
          id: 'foo',
          variants: [
            {
              ratio: 5,
              payload: 'bar',
            },
            {
              ratio: 10,
              payload: 'baz',
            },
            {
              ratio: 20,
              payload: 'qux',
            },
          ],
        },
      ],
      user
    );
  const counters = { bar: 0, baz: 0, qux: 0 };
  for (let i = 0; i < 100000; i++) {
    const { foo: result } = createCraps({ id: getRandomID() }).roll();
    counters[result.payload]++;
  }
  t.true(counters.bar > (counters.baz / 2) * 0.95);
  t.true(counters.bar < (counters.baz / 2) * 1.05);
  t.true(counters.baz > (counters.qux / 2) * 0.95);
  t.true(counters.baz < (counters.qux / 2) * 1.05);
  t.true(counters.bar > (counters.qux / 4) * 0.95);
  t.true(counters.bar < (counters.qux / 4) * 1.05);
});
