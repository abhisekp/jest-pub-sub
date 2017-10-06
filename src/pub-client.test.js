import _ from 'lodash/fp';
import debug from 'debug';
import redis from './redis';
import { PUB_CHANNEL } from './constants';

const d = debug('app:pub-client');

const pubClient = redis.createClient();

let subClientAll;

beforeAll(() => {
  /* subscribe the channel */
  subClientAll = redis.createClient();
  subClientAll.subscribe(PUB_CHANNEL);
});

afterAll(() => {
  /* unsubscribe the channel */
  if (_.isObject(subClientAll) && _.isFunction(subClientAll.unsubscribe)) {
    subClientAll.unsubscribe(PUB_CHANNEL);
  }
});

describe('Publish Redis Channel', () => {
  test('Publish OK with no subscribers', async () => {
    const reply = await pubClient.publishAsync(PUB_CHANNEL, 'OK');
    d('Reply: %o', reply);
    expect(reply).toBe(0);
  });

  test('Publish OK with one subscriber', (done) => {
    const subClient = redis.createClient();

    /* subscribe the channel */
    subClient.subscribe(PUB_CHANNEL);

    /* listen to the subscribe event and publish OK */
    subClient.on('subscribe', async (channel, count) => {
      d('Channel %o, Count %o', channel, count);

      const reply = await pubClient.publishAsync(PUB_CHANNEL, 'OK');
      d('Reply: %o', reply);
      expect(reply).toBe(1);
    });

    /* listen to the published message */
    subClient.on('message', (channel, message) => {
      if (channel !== PUB_CHANNEL) return;

      expect(message).toMatchSnapshot();
      subClient.unsubscribe(PUB_CHANNEL);
      done();
    });
  });
});
