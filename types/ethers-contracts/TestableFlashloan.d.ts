/* Generated by ts-generator ver. 0.0.8 */
/* tslint:disable */

import {
  ethers,
  EventFilter,
  Signer,
  BigNumber,
  BigNumberish,
  PopulatedTransaction
} from "ethers";
import {
  Contract,
  ContractTransaction,
  Overrides,
  CallOverrides
} from "@ethersproject/contracts";
import { BytesLike } from "@ethersproject/bytes";
import { Listener, Provider } from "@ethersproject/providers";
import { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";

interface TestableFlashloanInterface extends ethers.utils.Interface {
  functions: {
    "callFunction(address,tuple,bytes)": FunctionFragment;
    "initateFlashLoan(address,address,uint256,uint8)": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "callFunction",
    values: [string, { owner: string; number: BigNumberish }, BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "initateFlashLoan",
    values: [string, string, BigNumberish, BigNumberish]
  ): string;

  decodeFunctionResult(
    functionFragment: "callFunction",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "initateFlashLoan",
    data: BytesLike
  ): Result;

  events: {
    "GetBalanceDAI(uint256)": EventFragment;
    "GetKyberExpectedRate(uint256)": EventFragment;
    "GetMinOuts(uint256[])": EventFragment;
    "GetProfit(int256)": EventFragment;
    "NewArbitrage(uint8,uint256,uint256)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "GetBalanceDAI"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "GetKyberExpectedRate"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "GetMinOuts"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "GetProfit"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "NewArbitrage"): EventFragment;
}

export class TestableFlashloan extends Contract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  on(event: EventFilter | string, listener: Listener): this;
  once(event: EventFilter | string, listener: Listener): this;
  addListener(eventName: EventFilter | string, listener: Listener): this;
  removeAllListeners(eventName: EventFilter | string): this;
  removeListener(eventName: any, listener: Listener): this;

  interface: TestableFlashloanInterface;

  functions: {
    callFunction(
      sender: string,
      account: { owner: string; number: BigNumberish },
      data: BytesLike,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "callFunction(address,tuple,bytes)"(
      sender: string,
      account: { owner: string; number: BigNumberish },
      data: BytesLike,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    initateFlashLoan(
      _solo: string,
      _token: string,
      _amount: BigNumberish,
      _direction: BigNumberish,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "initateFlashLoan(address,address,uint256,uint8)"(
      _solo: string,
      _token: string,
      _amount: BigNumberish,
      _direction: BigNumberish,
      overrides?: Overrides
    ): Promise<ContractTransaction>;
  };

  callFunction(
    sender: string,
    account: { owner: string; number: BigNumberish },
    data: BytesLike,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "callFunction(address,tuple,bytes)"(
    sender: string,
    account: { owner: string; number: BigNumberish },
    data: BytesLike,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  initateFlashLoan(
    _solo: string,
    _token: string,
    _amount: BigNumberish,
    _direction: BigNumberish,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "initateFlashLoan(address,address,uint256,uint8)"(
    _solo: string,
    _token: string,
    _amount: BigNumberish,
    _direction: BigNumberish,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  callStatic: {
    callFunction(
      sender: string,
      account: { owner: string; number: BigNumberish },
      data: BytesLike,
      overrides?: CallOverrides
    ): Promise<void>;

    "callFunction(address,tuple,bytes)"(
      sender: string,
      account: { owner: string; number: BigNumberish },
      data: BytesLike,
      overrides?: CallOverrides
    ): Promise<void>;

    initateFlashLoan(
      _solo: string,
      _token: string,
      _amount: BigNumberish,
      _direction: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    "initateFlashLoan(address,address,uint256,uint8)"(
      _solo: string,
      _token: string,
      _amount: BigNumberish,
      _direction: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {
    GetBalanceDAI(balance: BigNumberish | null): EventFilter;

    GetKyberExpectedRate(expectedRate: BigNumberish | null): EventFilter;

    GetMinOuts(minOuts: null): EventFilter;

    GetProfit(profit: BigNumberish | null): EventFilter;

    NewArbitrage(
      direction: BigNumberish | null,
      profit: BigNumberish | null,
      date: BigNumberish | null
    ): EventFilter;
  };

  estimateGas: {
    callFunction(
      sender: string,
      account: { owner: string; number: BigNumberish },
      data: BytesLike,
      overrides?: Overrides
    ): Promise<BigNumber>;

    "callFunction(address,tuple,bytes)"(
      sender: string,
      account: { owner: string; number: BigNumberish },
      data: BytesLike,
      overrides?: Overrides
    ): Promise<BigNumber>;

    initateFlashLoan(
      _solo: string,
      _token: string,
      _amount: BigNumberish,
      _direction: BigNumberish,
      overrides?: Overrides
    ): Promise<BigNumber>;

    "initateFlashLoan(address,address,uint256,uint8)"(
      _solo: string,
      _token: string,
      _amount: BigNumberish,
      _direction: BigNumberish,
      overrides?: Overrides
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    callFunction(
      sender: string,
      account: { owner: string; number: BigNumberish },
      data: BytesLike,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "callFunction(address,tuple,bytes)"(
      sender: string,
      account: { owner: string; number: BigNumberish },
      data: BytesLike,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    initateFlashLoan(
      _solo: string,
      _token: string,
      _amount: BigNumberish,
      _direction: BigNumberish,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "initateFlashLoan(address,address,uint256,uint8)"(
      _solo: string,
      _token: string,
      _amount: BigNumberish,
      _direction: BigNumberish,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;
  };
}
