import { Goerli } from '@usedapp/core';

export const ROUTER_ADDRESS = '0x8eCee5a143dD93fEe9FfAfc68DD8525344A199Ca';

export const DAPP_CONFIG = {
  readOnlyChainId: Goerli.chainId,
  readOnlyUrls: {
    [Goerli.chainId]: 'https://eth-goerli.g.alchemy.com/v2/R7E7GbhQFLT8McxG1IIc9gdMTs8MjBM2',
  },
};
