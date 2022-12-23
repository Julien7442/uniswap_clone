import { Goerli } from '@usedapp/core';

export const ROUTER_ADDRESS = '0xE6e429E750dC5240De6F4E4805e41745B9310F71';

export const DAPP_CONFIG = {
  readOnlyChainId: Goerli.chainId,
  readOnlyUrls: {
    [Goerli.chainId]: 'https://eth-goerli.g.alchemy.com/v2/R7E7GbhQFLT8McxG1IIc9gdMTs8MjBM2',
  },
};
