/* eslint-env node, jest */
'use strict';

const Craps = require('./index');

describe('crabs', () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  it('should validate constrcutor arguments', () => {
    expect(() => {
      new Craps();
    }).toThrow();
    expect(() => {
      new Craps({});
    }).toThrow();
    expect(() => {
      new Craps([]);
    }).toThrow();
    expect(() => {
      new Craps([], {});
    }).toThrow();
    expect(() => {
      new Craps([{}], { name: '' });
    }).toThrow();
  });

  it('should assign the user to an experiment without conditions', () => {
    const craps = new Craps(
      [
        {
          name: 'foo',
          hashId: '123abc',
          startDate: yesterday.toISOString(),
          endDate: tomorrow.toISOString(),
          variants: [
            {
              variant: 'test',
              ratio: 1,
            },
          ],
        },
      ],
      {
        userId: '123',
      }
    );

    const result = craps.getExperiments();
    expect(result).toEqual({ foo: 'test' });
  });

  it('should assign the user to an experiment with matching conditions', () => {
    const craps = new Craps(
      [
        {
          name: 'foo',
          hashId: '123abc',
          startDate: yesterday.toISOString(),
          endDate: tomorrow.toISOString(),
          conditions: [
            {
              operator: '=',
              key: 'baz',
              value: 'qux',
            },
          ],
          variants: [
            {
              variant: 'test',
              ratio: 100,
            },
          ],
        },
      ],
      {
        userId: '123',
        baz: 'qux',
      }
    );

    const result = craps.getExperiments();
    expect(result).toEqual({ foo: 'test' });
  });

  it('should not assign the user to an experiment with not matching conditions', () => {
    const craps = new Craps(
      [
        {
          name: 'foo',
          hashId: '123abc',
          startDate: yesterday.toISOString(),
          endDate: tomorrow.toISOString(),
          conditions: [
            {
              operator: '=',
              key: 'baz',
              value: 'qux',
            },
          ],
          variants: [
            {
              variant: 'test',
              ratio: 100,
            },
          ],
        },
      ],
      {
        userId: '123',
        baz: 'something_different',
      }
    );

    const result = craps.getExperiments();
    expect(result).toEqual({});
  });

  describe('with plain userIDs', () => {
    it('should show less than 5% deviation in experiment assigments for a 50/50 ratio', () => {
      const createCraps = (user) =>
        new Craps(
          [
            {
              name: 'foo',
              hashId: '123abc',
              startDate: yesterday.toISOString(),
              endDate: tomorrow.toISOString(),
              variants: [
                {
                  variant: 'bar',
                  ratio: 50,
                },
                {
                  variant: 'baz',
                  ratio: 50,
                },
              ],
            },
          ],
          user
        );

      const counters = { bar: 0, baz: 0 };
      for (let i = 0; i < 100000; i++) {
        let { foo: result } = createCraps({ userId: `${i}` }).getExperiments();
        counters[result]++;
      }

      expect(counters.bar).toBeGreaterThan(50000 * 0.95);
      expect(counters.bar).toBeLessThan(50000 * 1.05);
    });

    it('should show less than 5% deviation in experiment assigments for a 5/10 ratio', () => {
      const createCraps = (user) =>
        new Craps(
          [
            {
              name: 'foo',
              hashId: '123abc',
              startDate: yesterday.toISOString(),
              endDate: tomorrow.toISOString(),
              variants: [
                {
                  variant: 'bar',
                  ratio: 5,
                },
                {
                  variant: 'baz',
                  ratio: 10,
                },
              ],
            },
          ],
          user
        );

      const counters = { bar: 0, baz: 0 };
      for (let i = 0; i < 100000; i++) {
        let { foo: result } = createCraps({ userId: `${i}` }).getExperiments();
        counters[result]++;
      }

      expect(counters.bar).toBeGreaterThan((counters.baz / 2) * 0.95);
      expect(counters.bar).toBeLessThan((counters.baz / 2) * 1.05);
    });
  });

  describe('with random userIDs', () => {
    const getRandomID = () =>
      Math.random()
        .toString(36)
        .substring(2);

    it('should show less than 5% deviation in experiment assigments for a 5/10/20 ratio', () => {
      const createCraps = (user) =>
        new Craps(
          [
            {
              name: 'foo',
              hashId: '123abc',
              startDate: yesterday.toISOString(),
              endDate: tomorrow.toISOString(),
              variants: [
                {
                  variant: 'bar',
                  ratio: 5,
                },
                {
                  variant: 'baz',
                  ratio: 10,
                },
                {
                  variant: 'qux',
                  ratio: 20,
                },
              ],
            },
          ],
          user
        );

      const counters = { bar: 0, baz: 0, qux: 0 };
      for (let i = 0; i < 100000; i++) {
        const { foo: result } = createCraps({
          userId: getRandomID(),
        }).getExperiments();
        counters[result]++;
      }

      expect(counters.bar).toBeGreaterThan((counters.baz / 2) * 0.95);
      expect(counters.bar).toBeLessThan((counters.baz / 2) * 1.05);

      expect(counters.baz).toBeGreaterThan((counters.qux / 2) * 0.95);
      expect(counters.baz).toBeLessThan((counters.qux / 2) * 1.05);

      expect(counters.bar).toBeGreaterThan((counters.qux / 4) * 0.95);
      expect(counters.bar).toBeLessThan((counters.qux / 4) * 1.05);
    });
  });
});
