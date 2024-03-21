import retry from 'async-retry';
import Timeout from 'await-timeout';
import axios from 'axios';

import { V2SubgraphPool } from '../providers';

import { ChainIdWithChiliz } from './addresses';
import { log } from './log';

export async function getPools_(
  timeout: number,
  chainId: ChainIdWithChiliz,
  retriesCount: number
): Promise<V2SubgraphPool[]> {
  let allPools: V2SubgraphPool[] = [];

  const graphqlQuery = {
    query: `
    {
      pairs{
        id,
        token0{
          id,
          symbol,
          name,
          decimals,
          txCount,
          totalSupply,
        },
        token1{
          id,
          symbol,
          name,
          decimals,
          txCount,
          totalSupply,
        },
        reserve,
        totalSupply,
        reserve0,
        reserve1,
      }
    }
    `,
  };
  const graphqlEndpoint =
    'http://52.62.9.95:8000/subgraphs/name/chiliz-subgraph';

  await retry(
    async () => {
      const timeout_ = new Timeout();
      const timerPromise = timeout_.set(timeout).then(() => {
        throw new Error(`Timed out getting pools from subgraph: ${timeout}`);
      });

      let response;

      /* eslint-disable no-useless-catch */
      try {
        response = await Promise.race([
          axios.post(graphqlEndpoint, graphqlQuery),
          timerPromise,
        ]);
      } catch (err) {
        throw err;
      } finally {
        timeout_.clear();
      }
      /* eslint-enable no-useless-catch */

      const { data: poolsBuffer, status } = response;
      // log.info('Starting to write pools to v2pools.json');
      // await writeFile(
      //   'v2pools.json',
      //   JSON.stringify(poolsBuffer.data.pairs, null, 2)
      // );
      // log.info('Wrote pools to v2pools.json');

      if (status != 200) {
        log.error(`Unabled to get pools:`, { response });

        throw new Error(`Unable to get pools`);
      }

      log.debug(
        `Got pools from http://52.62.9.95:8000/subgraphs/name/chiliz-subgraph for ${chainId}`
      );

      const pools = poolsBuffer.data.pairs as V2SubgraphPool[];
      allPools = pools;
    },
    {
      retries: retriesCount,
      onRetry: (err, retry) => {
        log.info(`Failed to get pools from uri. Retry attempt: ${retry}`, {
          err,
        });
      },
    }
  );

  return allPools;
}
