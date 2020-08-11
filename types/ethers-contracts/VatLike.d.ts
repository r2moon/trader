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

interface VatLikeInterface extends ethers.utils.Interface {
  functions: {
    "can(address,address)": FunctionFragment;
    "ilks(bytes32)": FunctionFragment;
    "dai(address)": FunctionFragment;
    "urns(bytes32,address)": FunctionFragment;
    "frob(bytes32,address,address,address,int256,int256)": FunctionFragment;
    "hope(address)": FunctionFragment;
    "move(address,address,uint256)": FunctionFragment;
  };

  encodeFunctionData(functionFragment: "can", values: [string, string]): string;
  encodeFunctionData(functionFragment: "ilks", values: [BytesLike]): string;
  encodeFunctionData(functionFragment: "dai", values: [string]): string;
  encodeFunctionData(
    functionFragment: "urns",
    values: [BytesLike, string]
  ): string;
  encodeFunctionData(
    functionFragment: "frob",
    values: [BytesLike, string, string, string, BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(functionFragment: "hope", values: [string]): string;
  encodeFunctionData(
    functionFragment: "move",
    values: [string, string, BigNumberish]
  ): string;

  decodeFunctionResult(functionFragment: "can", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "ilks", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "dai", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "urns", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "frob", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "hope", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "move", data: BytesLike): Result;

  events: {};
}

export class VatLike extends Contract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  on(event: EventFilter | string, listener: Listener): this;
  once(event: EventFilter | string, listener: Listener): this;
  addListener(eventName: EventFilter | string, listener: Listener): this;
  removeAllListeners(eventName: EventFilter | string): this;
  removeListener(eventName: any, listener: Listener): this;

  interface: VatLikeInterface;

  functions: {
    can(
      arg0: string,
      arg1: string,
      overrides?: CallOverrides
    ): Promise<{
      0: BigNumber;
    }>;

    "can(address,address)"(
      arg0: string,
      arg1: string,
      overrides?: CallOverrides
    ): Promise<{
      0: BigNumber;
    }>;

    ilks(
      arg0: BytesLike,
      overrides?: CallOverrides
    ): Promise<{
      0: BigNumber;
      1: BigNumber;
      2: BigNumber;
      3: BigNumber;
      4: BigNumber;
    }>;

    "ilks(bytes32)"(
      arg0: BytesLike,
      overrides?: CallOverrides
    ): Promise<{
      0: BigNumber;
      1: BigNumber;
      2: BigNumber;
      3: BigNumber;
      4: BigNumber;
    }>;

    dai(
      arg0: string,
      overrides?: CallOverrides
    ): Promise<{
      0: BigNumber;
    }>;

    "dai(address)"(
      arg0: string,
      overrides?: CallOverrides
    ): Promise<{
      0: BigNumber;
    }>;

    urns(
      arg0: BytesLike,
      arg1: string,
      overrides?: CallOverrides
    ): Promise<{
      0: BigNumber;
      1: BigNumber;
    }>;

    "urns(bytes32,address)"(
      arg0: BytesLike,
      arg1: string,
      overrides?: CallOverrides
    ): Promise<{
      0: BigNumber;
      1: BigNumber;
    }>;

    frob(
      arg0: BytesLike,
      arg1: string,
      arg2: string,
      arg3: string,
      arg4: BigNumberish,
      arg5: BigNumberish,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "frob(bytes32,address,address,address,int256,int256)"(
      arg0: BytesLike,
      arg1: string,
      arg2: string,
      arg3: string,
      arg4: BigNumberish,
      arg5: BigNumberish,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    hope(arg0: string, overrides?: Overrides): Promise<ContractTransaction>;

    "hope(address)"(
      arg0: string,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    move(
      arg0: string,
      arg1: string,
      arg2: BigNumberish,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "move(address,address,uint256)"(
      arg0: string,
      arg1: string,
      arg2: BigNumberish,
      overrides?: Overrides
    ): Promise<ContractTransaction>;
  };

  can(
    arg0: string,
    arg1: string,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  "can(address,address)"(
    arg0: string,
    arg1: string,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  ilks(
    arg0: BytesLike,
    overrides?: CallOverrides
  ): Promise<{
    0: BigNumber;
    1: BigNumber;
    2: BigNumber;
    3: BigNumber;
    4: BigNumber;
  }>;

  "ilks(bytes32)"(
    arg0: BytesLike,
    overrides?: CallOverrides
  ): Promise<{
    0: BigNumber;
    1: BigNumber;
    2: BigNumber;
    3: BigNumber;
    4: BigNumber;
  }>;

  dai(arg0: string, overrides?: CallOverrides): Promise<BigNumber>;

  "dai(address)"(arg0: string, overrides?: CallOverrides): Promise<BigNumber>;

  urns(
    arg0: BytesLike,
    arg1: string,
    overrides?: CallOverrides
  ): Promise<{
    0: BigNumber;
    1: BigNumber;
  }>;

  "urns(bytes32,address)"(
    arg0: BytesLike,
    arg1: string,
    overrides?: CallOverrides
  ): Promise<{
    0: BigNumber;
    1: BigNumber;
  }>;

  frob(
    arg0: BytesLike,
    arg1: string,
    arg2: string,
    arg3: string,
    arg4: BigNumberish,
    arg5: BigNumberish,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "frob(bytes32,address,address,address,int256,int256)"(
    arg0: BytesLike,
    arg1: string,
    arg2: string,
    arg3: string,
    arg4: BigNumberish,
    arg5: BigNumberish,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  hope(arg0: string, overrides?: Overrides): Promise<ContractTransaction>;

  "hope(address)"(
    arg0: string,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  move(
    arg0: string,
    arg1: string,
    arg2: BigNumberish,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "move(address,address,uint256)"(
    arg0: string,
    arg1: string,
    arg2: BigNumberish,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  callStatic: {
    can(
      arg0: string,
      arg1: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "can(address,address)"(
      arg0: string,
      arg1: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    ilks(
      arg0: BytesLike,
      overrides?: CallOverrides
    ): Promise<{
      0: BigNumber;
      1: BigNumber;
      2: BigNumber;
      3: BigNumber;
      4: BigNumber;
    }>;

    "ilks(bytes32)"(
      arg0: BytesLike,
      overrides?: CallOverrides
    ): Promise<{
      0: BigNumber;
      1: BigNumber;
      2: BigNumber;
      3: BigNumber;
      4: BigNumber;
    }>;

    dai(arg0: string, overrides?: CallOverrides): Promise<BigNumber>;

    "dai(address)"(arg0: string, overrides?: CallOverrides): Promise<BigNumber>;

    urns(
      arg0: BytesLike,
      arg1: string,
      overrides?: CallOverrides
    ): Promise<{
      0: BigNumber;
      1: BigNumber;
    }>;

    "urns(bytes32,address)"(
      arg0: BytesLike,
      arg1: string,
      overrides?: CallOverrides
    ): Promise<{
      0: BigNumber;
      1: BigNumber;
    }>;

    frob(
      arg0: BytesLike,
      arg1: string,
      arg2: string,
      arg3: string,
      arg4: BigNumberish,
      arg5: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    "frob(bytes32,address,address,address,int256,int256)"(
      arg0: BytesLike,
      arg1: string,
      arg2: string,
      arg3: string,
      arg4: BigNumberish,
      arg5: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    hope(arg0: string, overrides?: CallOverrides): Promise<void>;

    "hope(address)"(arg0: string, overrides?: CallOverrides): Promise<void>;

    move(
      arg0: string,
      arg1: string,
      arg2: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    "move(address,address,uint256)"(
      arg0: string,
      arg1: string,
      arg2: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {};

  estimateGas: {
    can(
      arg0: string,
      arg1: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "can(address,address)"(
      arg0: string,
      arg1: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    ilks(arg0: BytesLike, overrides?: CallOverrides): Promise<BigNumber>;

    "ilks(bytes32)"(
      arg0: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    dai(arg0: string, overrides?: CallOverrides): Promise<BigNumber>;

    "dai(address)"(arg0: string, overrides?: CallOverrides): Promise<BigNumber>;

    urns(
      arg0: BytesLike,
      arg1: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "urns(bytes32,address)"(
      arg0: BytesLike,
      arg1: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    frob(
      arg0: BytesLike,
      arg1: string,
      arg2: string,
      arg3: string,
      arg4: BigNumberish,
      arg5: BigNumberish,
      overrides?: Overrides
    ): Promise<BigNumber>;

    "frob(bytes32,address,address,address,int256,int256)"(
      arg0: BytesLike,
      arg1: string,
      arg2: string,
      arg3: string,
      arg4: BigNumberish,
      arg5: BigNumberish,
      overrides?: Overrides
    ): Promise<BigNumber>;

    hope(arg0: string, overrides?: Overrides): Promise<BigNumber>;

    "hope(address)"(arg0: string, overrides?: Overrides): Promise<BigNumber>;

    move(
      arg0: string,
      arg1: string,
      arg2: BigNumberish,
      overrides?: Overrides
    ): Promise<BigNumber>;

    "move(address,address,uint256)"(
      arg0: string,
      arg1: string,
      arg2: BigNumberish,
      overrides?: Overrides
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    can(
      arg0: string,
      arg1: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "can(address,address)"(
      arg0: string,
      arg1: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    ilks(
      arg0: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "ilks(bytes32)"(
      arg0: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    dai(arg0: string, overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "dai(address)"(
      arg0: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    urns(
      arg0: BytesLike,
      arg1: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "urns(bytes32,address)"(
      arg0: BytesLike,
      arg1: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    frob(
      arg0: BytesLike,
      arg1: string,
      arg2: string,
      arg3: string,
      arg4: BigNumberish,
      arg5: BigNumberish,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "frob(bytes32,address,address,address,int256,int256)"(
      arg0: BytesLike,
      arg1: string,
      arg2: string,
      arg3: string,
      arg4: BigNumberish,
      arg5: BigNumberish,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    hope(arg0: string, overrides?: Overrides): Promise<PopulatedTransaction>;

    "hope(address)"(
      arg0: string,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    move(
      arg0: string,
      arg1: string,
      arg2: BigNumberish,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "move(address,address,uint256)"(
      arg0: string,
      arg1: string,
      arg2: BigNumberish,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;
  };
}