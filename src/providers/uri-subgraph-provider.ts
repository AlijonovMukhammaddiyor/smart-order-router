import { ChainIdWithChiliz } from '../util';
import { log } from '../util/log';
import { getPools_ } from '../util/pools';

import { V2SubgraphPool } from './v2/subgraph-provider';
import { V3SubgraphPool } from './v3/subgraph-provider';

/**
 * Gets subgraph pools from a URI. The URI shoudl contain a JSON
 * stringified array of V2SubgraphPool objects or V3SubgraphPool
 * objects.
 *
 * @export
 * @class URISubgraphProvider
 * @template TSubgraphPool
 */
export class URISubgraphProvider<
  TSubgraphPool extends V2SubgraphPool | V3SubgraphPool
> {
  constructor(
    private chainId: ChainIdWithChiliz,
    private uri: string,
    private timeout = 6000,
    private retries = 2
  ) {}

  public async getPools(): Promise<TSubgraphPool[]> {
    log.info(`About to get subgraph pools from URI`, this.uri);
    return (await getPools_(
      this.timeout,
      this.chainId,
      this.retries
    )) as TSubgraphPool[];
  }
}
