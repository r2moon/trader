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

interface DaiFaucetInterface extends ethers.utils.Interface {
  functions: {
    "sendDai(uint256)": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "sendDai",
    values: [BigNumberish]
  ): string;

  decodeFunctionResult(functionFragment: "sendDai", data: BytesLike): Result;

  events: {};
}

export class DaiFaucet extends Contract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  on(event: EventFilter | string, listener: Listener): this;
  once(event: EventFilter | string, listener: Listener): this;
  addListener(eventName: EventFilter | string, listener: Listener): this;
  removeAllListeners(eventName: EventFilter | string): this;
  removeListener(eventName: any, listener: Listener): this;

  interface: DaiFaucetInterface;

  functions: {
    sendDai(
      amount: BigNumberish,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "sendDai(uint256)"(
      amount: BigNumberish,
      overrides?: Overrides
    ): Promise<ContractTransaction>;
  };

  sendDai(
    amount: BigNumberish,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "sendDai(uint256)"(
    amount: BigNumberish,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  callStatic: {
    sendDai(amount: BigNumberish, overrides?: CallOverrides): Promise<void>;

    "sendDai(uint256)"(
      amount: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {};

  estimateGas: {
    sendDai(amount: BigNumberish, overrides?: Overrides): Promise<BigNumber>;

    "sendDai(uint256)"(
      amount: BigNumberish,
      overrides?: Overrides
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    sendDai(
      amount: BigNumberish,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "sendDai(uint256)"(
      amount: BigNumberish,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;
  };
}