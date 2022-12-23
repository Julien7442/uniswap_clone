import React, { useEffect, useState } from 'react';
import { Contract } from '@ethersproject/contracts';
import { abis } from '@my-app/contracts';
import { ERC20, useContractFunction, useEthers, useTokenAllowance, useTokenBalance } from '@usedapp/core';
import { ethers } from 'ethers';
import { parseUnits } from 'ethers/lib/utils';

import {
  getAvailableTokens,
  getCounterpartTokens,
  findPoolByTokens,
  isOperationPending,
  getFailureMessage,
  getSuccessMessage,
} from '../utils';
import { ROUTER_ADDRESS } from '../config';
import AmountIn from './AmountIn';
import AmountOut from './AmountOut';
import Balance from './Balance';
import styles from '../styles';

const Exchange = ({ pools }) => {
  // Hook to get the current Ethereum account
  const { account } = useEthers();

  // State for the form values
  const [fromValue, setFromValue] = useState('0');
  // Initialize the fromToken to the first token in the first pool
  const [fromToken, setFromToken] = useState(pools[0].token0Address);
  const [toToken, setToToken] = useState('');
  const [resetState, setResetState] = useState(false);

  // Convert the form value string to a BigNumber
  const fromValueBigNumber = parseUnits(fromValue || '0');
  // Get the list of available tokens
  const availableTokens = getAvailableTokens(pools);
  // Get the list of counterpart tokens available for the selected fromToken
  const counterpartTokens = getCounterpartTokens(pools, fromToken);
  // Get the address of the pool that holds the selected fromToken and toToken
  const pairAddress = findPoolByTokens(pools, fromToken, toToken)?.address ?? '';

  // Create instances of the Router contract and the fromToken contract
  const routerContract = new Contract(ROUTER_ADDRESS, abis.router02);
  const fromTokenContract = new Contract(fromToken, ERC20.abi);

  // Hook to get the balance of the fromToken for the current Ethereum account
  const fromTokenBalance = useTokenBalance(fromToken, account);
  // Hook to get the balance of the toToken for the current Ethereum account
  const toTokenBalance = useTokenBalance(toToken, account);
  // Hook to get the allowance of the fromToken for the Router contract for the current Ethereum account
  const tokenAllowance = useTokenAllowance(fromToken, account, ROUTER_ADDRESS) || parseUnits('0');

  // Check if approval is needed for the swap
  const approvedNeeded = fromValueBigNumber.gt(tokenAllowance);
  // Check if the form value is greater than 0
  const formValueIsGreaterThan0 = fromValueBigNumber.gt(parseUnits('0'));
  // Check if the current Ethereum account has enough balance of the fromToken
  const hasEnoughBalance = fromValueBigNumber.lte(fromTokenBalance ?? parseUnits('0'));

  // Hook to call the `approve` function on the fromToken contract
  const { state: swapApproveState, send: swapApproveSend } = useContractFunction(fromTokenContract, 'approve', {
    transactionName: 'onApproveRequested',
    gasLimitBufferPercentage: 10,
  });

  // Hook to call the `swapExactTokensForTokens` function on the Router contract
  const { state: swapExecuteState, send: swapExecuteSend } = useContractFunction(routerContract, 'swapExactTokensForTokens', {
    transactionName: 'swapExactTokensForTokens',
    gasLimitBufferPercentage: 10,
  });

  // Check if the `approve` function is currently being called
  // - isApproving: whether the user is currently approving a token for transfer
  const isApproving = isOperationPending(swapApproveState);
  // - isSwapping: whether the user is currently executing a token swap
  const isSwapping = isOperationPending(swapExecuteState);

  const canApprove = !isApproving && approvedNeeded;
  const canSwap = !approvedNeeded && !isSwapping && formValueIsGreaterThan0 && hasEnoughBalance;

  const successMessage = getSuccessMessage(swapApproveState, swapExecuteState);
  const failureMessage = getFailureMessage(swapApproveState, swapExecuteState);

  // triggers the approval transaction for the token
  const onApproveRequested = () => {
    swapApproveSend(ROUTER_ADDRESS, ethers.constants.MaxUint256);
  };

  // triggers the execution of the token swap
  const onSwapRequested = () => {
    swapExecuteSend(fromValueBigNumber, 0, [fromToken, toToken], account, Math.floor(Date.now() / 1000) + 60 * 20).then((_) => {
      setFromValue('0');
    });
  };

  // updates the input value for the swap
  const onFromValueChange = (value) => {
    const trimmedValue = value.trim();

    try {
      trimmedValue && parseUnits(value);
      setFromValue(value);
    } catch (e) {}
  };

  // updates the token the user is swapping from
  const onFromTokenChange = (value) => {
    setFromToken(value);
  };

  // updates the token the user is swapping to
  const onToTokenChange = (value) => {
    setToToken(value);
  };

  useEffect(() => {
    // reset the form after a success/failure message has been displayed
    if (failureMessage || successMessage) {
      setTimeout(() => {
        // reset the form state
        setResetState(true);
        setFromValue('0');
        setToToken('');
      }, 5000);
    }
  }, [failureMessage, successMessage]);

  return (
    <div className="flex flex-col w-full items-center">
      <div className="mb-8">
        <AmountIn
          // display the value of the "from" currency
          value={fromValue}
          // update the value of the "from" currency when it changes
          onChange={onFromValueChange}
          // display the selected "from" currency
          currencyValue={fromToken}
          // update the selected "from" currency when it changes
          onSelect={onFromTokenChange}
          // list of available "from" currencies
          currencies={availableTokens}
          // enable the swap button if the user has enough balance
          isSwapping={isSwapping && hasEnoughBalance}
          // display the balance for the "from" currency
        />
        <Balance tokenBalance={fromTokenBalance} />
      </div>

      <div className="mb-8 w-[100%]">
        <AmountOut
          // the currently selected "from" currency
          fromToken={fromToken}
          // the currently selected "to" currency
          toToken={toToken}
          // the amount of the "from" currency
          amountIn={fromValueBigNumber}
          // the contract address for the currency pair
          pairContract={pairAddress}
          // display the selected "to" currency
          currencyValue={toToken}
          // update the selected "to" currency when it changes
          onSelect={onToTokenChange}
          // list of available "to" currencies
          currencies={counterpartTokens}
          // display the balance for the "to" currency
        />
        <Balance tokenBalance={toTokenBalance} />
      </div>
      {approvedNeeded && !isSwapping ? (
        <button
          disabled={!canApprove}
          onClick={onApproveRequested}
          className={`${canApprove ? 'bg-site-pink text-white' : 'bg-site-dim2 text-site-dim2'} ${styles.actionButton}`}>
          {isApproving ? 'Approving...' : 'Approve'}
        </button>
      ) : (
        <button
          disabled={!canSwap}
          onClick={onSwapRequested}
          className={`${canSwap ? 'bg-site-pink text-white' : 'bg-site-dim2 text-site-dim2'} ${styles.actionButton}`}>
          {isSwapping ? 'Swapping...' : hasEnoughBalance ? 'Swap' : 'Insufficient balance'}
        </button>
      )}

      {failureMessage && !resetState ? (
        <p className={styles.message}>{failureMessage}</p>
      ) : successMessage ? (
        <p className={styles.message}>{successMessage}</p>
      ) : (
        ''
      )}
    </div>
  );
};

export default Exchange;
