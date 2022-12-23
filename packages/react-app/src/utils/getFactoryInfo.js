import { abis } from '@my-app/contracts';
import { getPairsInfo } from './getPairsInfo';

export const getFactoryInfo = async (factoryAddress, web3) => {
  const factory = new web3.eth.Contract(abis.factory, factoryAddress);

  const factoryInfo = {
    fee: await factory.methods.fee().call(),
    feeToSetter: await factory.methods.fee().call(),
    allPairsLength: await factory.methods.fee().call(),
    allPairs: [],
  };
};
