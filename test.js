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
          name: 'new_shiny_feature',
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
    expect(result).toEqual({ new_shiny_feature: 'test' });
  });

  it('should assign the user to an experiment with matching conditions', () => {
    const craps = new Craps(
      [
        {
          name: 'new_shiny_feature',
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
    expect(result).toEqual({ new_shiny_feature: 'test' });
  });

  it('should not assign the user to an experiment with not matching conditions', () => {
    const craps = new Craps(
      [
        {
          name: 'new_shiny_feature',
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
    it('should show less than 1% deviation in experiment assigments for a 50/50 ratio', () => {
      const createCraps = (user) =>
        new Craps(
          [
            {
              name: 'new_shiny_feature',
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
        let { new_shiny_feature: result } = createCraps({
          userId: `${i}`,
        }).getExperiments();
        counters[result]++;
      }

      expect(counters.bar / counters.baz).toBeGreaterThan(0.99);
      expect(counters.bar / counters.baz).toBeLessThan(1.01);
    });

    it('should show less than 1% deviation in experiment assigments for a 5/10 ratio', () => {
      const createCraps = (user) =>
        new Craps(
          [
            {
              name: 'new_shiny_feature',
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
        let { new_shiny_feature: result } = createCraps({
          userId: `${i}`,
        }).getExperiments();
        counters[result]++;
      }

      expect(counters.bar / (counters.baz / 2)).toBeGreaterThan(0.99);
      expect(counters.bar / (counters.baz / 2)).toBeLessThan(1.01);
    });
  });

  describe('with random userIDs', () => {
    const getRandomID = () =>
      Math.floor(
        Math.random() * Math.pow(10, 7 + Math.round(Math.random()))
      ).toString();

    it('should show less than 1.4% deviation in experiment assigments for a 20/30/50 ratio', () => {
      const deviation_lower_boundary = 0.986;
      const deviation_upper_boundary = 1.014;

      const createCraps = (user) =>
        new Craps(
          [
            {
              name: 'new_shiny_feature',
              hashId: '123abc',
              startDate: yesterday.toISOString(),
              endDate: tomorrow.toISOString(),
              variants: [
                {
                  variant: 'bar',
                  ratio: 20,
                },
                {
                  variant: 'baz',
                  ratio: 30,
                },
                {
                  variant: 'qux',
                  ratio: 50,
                },
              ],
            },
          ],
          user
        );

      const counters = { bar: 0, baz: 0, qux: 0 };
      for (let i = 0; i < 100000; i++) {
        const { new_shiny_feature: result } = createCraps({
          userId: getRandomID(),
        }).getExperiments();
        counters[result]++;
      }

      expect(counters.bar).toBeGreaterThan(
        (counters.baz / 30) * 20 * deviation_lower_boundary
      );
      expect(counters.bar).toBeLessThan(
        (counters.baz / 30) * 20 * deviation_upper_boundary
      );

      expect(counters.baz).toBeGreaterThan(
        (counters.qux / 50) * 30 * deviation_lower_boundary
      );
      expect(counters.baz).toBeLessThan(
        (counters.qux / 50) * 30 * deviation_upper_boundary
      );

      expect(counters.bar).toBeGreaterThan(
        (counters.qux / 50) * 20 * deviation_lower_boundary
      );
      expect(counters.bar).toBeLessThan(
        (counters.qux / 50) * 20 * deviation_upper_boundary
      );
    });
  });
});
