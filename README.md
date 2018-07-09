# `craps`

```javascript
const Craps = require('craps');

const craps = new Craps(
  // experiment(s)
  [
    {
      id: 'home/cta',
      condition: {
        operator: '|',
        conditions: [
          {
            operator: '=',
            key: 'locale',
            value: 'en/UK',
          },
          {
            operator: '=',
            key: 'locale',
            value: 'en/US',
          },
        ],
      },
      variants: [
        {
          ratio: 10,
          payload: 'foo',
        },
        {
          ratio: 10,
          payload: 'bar',
        },
      ],
    },
  ],
  // user data
  {
    id: '123',
    locale: 'en/UK',
  }
);

console.log(craps.roll());
```
