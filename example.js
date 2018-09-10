const Craps = require('./index.js');

const craps = new Craps(
  // experiment(s)
  [
    {
      name: 'startpage_new_story_feature',
      hashId: '5771d95357',
      startDate: '2018-08-15T08:41:25.528Z',
      endDate: '2018-08-22T08:41:25.528Z',
      conditions: [
        {
          key: 'language',
          operator: '=',
          value: 'de',
        },
      ],
      variants: [
        {
          ratio: 50,
          variant: 'test',
        },
        {
          ratio: 50,
          variant: 'control',
        },
      ],
    },
  ],
  {
    userId: '123',
    language: 'de',
  }
);

console.log(craps.getExperiments()); // eslint-disable-line no-console
