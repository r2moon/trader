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

interface ICurveFiCurveInterface extends ethers.utils.Interface {
  functions: {
    "get_virtual_price()": FunctionFragment;
    "add_liquidity(uint256[2],uint256)": FunctionFragment;
    "get_dy(int128,int128,uint256)": FunctionFragment;
    "get_dy_underlying(int128,int128,uint256)": FunctionFragment;
    "exchange(int128,int128,uint256,uint256,uint256)": FunctionFragment;
    "exchange_underlying(int128,int128,uint256,uint256,uint256)": FunctionFragment;
    "remove_liquidity(uint256,uint256,uint256[2])": FunctionFragment;
    "remove_liquidity_imbalance(uint256[2],uint256)": FunctionFragment;
    "commit_new_parameters(int128,int128,int128)": FunctionFragment;
    "apply_new_parameters()": FunctionFragment;
    "revert_new_parameters()": FunctionFragment;
    "commit_transfer_ownership(address)": FunctionFragment;
    "apply_transfer_ownership()": FunctionFragment;
    "revert_transfer_ownership()": FunctionFragment;
    "withdraw_admin_fees()": FunctionFragment;
    "coins(int128)": FunctionFragment;
    "underlying_coins(int128)": FunctionFragment;
    "balances(int128)": FunctionFragment;
    "A()": FunctionFragment;
    "fee()": FunctionFragment;
    "admin_fee()": FunctionFragment;
    "owner()": FunctionFragment;
    "admin_actions_deadline()": FunctionFragment;
    "transfer_ownership_deadline()": FunctionFragment;
    "future_A()": FunctionFragment;
    "future_fee()": FunctionFragment;
    "future_admin_fee()": FunctionFragment;
    "future_owner()": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "get_virtual_price",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "add_liquidity",
    values: [BigNumberish[], BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "get_dy",
    values: [BigNumberish, BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "get_dy_underlying",
    values: [BigNumberish, BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "exchange",
    values: [
      BigNumberish,
      BigNumberish,
      BigNumberish,
      BigNumberish,
      BigNumberish
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "exchange_underlying",
    values: [
      BigNumberish,
      BigNumberish,
      BigNumberish,
      BigNumberish,
      BigNumberish
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "remove_liquidity",
    values: [BigNumberish, BigNumberish, BigNumberish[]]
  ): string;
  encodeFunctionData(
    functionFragment: "remove_liquidity_imbalance",
    values: [BigNumberish[], BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "commit_new_parameters",
    values: [BigNumberish, BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "apply_new_parameters",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "revert_new_parameters",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "commit_transfer_ownership",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "apply_transfer_ownership",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "revert_transfer_ownership",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "withdraw_admin_fees",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "coins", values: [BigNumberish]): string;
  encodeFunctionData(
    functionFragment: "underlying_coins",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "balances",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(functionFragment: "A", values?: undefined): string;
  encodeFunctionData(functionFragment: "fee", values?: undefined): string;
  encodeFunctionData(functionFragment: "admin_fee", values?: undefined): string;
  encodeFunctionData(functionFragment: "owner", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "admin_actions_deadline",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "transfer_ownership_deadline",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "future_A", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "future_fee",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "future_admin_fee",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "future_owner",
    values?: undefined
  ): string;

  decodeFunctionResult(
    functionFragment: "get_virtual_price",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "add_liquidity",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "get_dy", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "get_dy_underlying",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "exchange", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "exchange_underlying",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "remove_liquidity",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "remove_liquidity_imbalance",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "commit_new_parameters",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "apply_new_parameters",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "revert_new_parameters",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "commit_transfer_ownership",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "apply_transfer_ownership",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "revert_transfer_ownership",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "withdraw_admin_fees",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "coins", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "underlying_coins",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "balances", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "A", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "fee", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "admin_fee", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "owner", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "admin_actions_deadline",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "transfer_ownership_deadline",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "future_A", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "future_fee", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "future_admin_fee",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "future_owner",
    data: BytesLike
  ): Result;

  events: {};
}

export class ICurveFiCurve extends Contract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  on(event: EventFilter | string, listener: Listener): this;
  once(event: EventFilter | string, listener: Listener): this;
  addListener(eventName: EventFilter | string, listener: Listener): this;
  removeAllListeners(eventName: EventFilter | string): this;
  removeListener(eventName: any, listener: Listener): this;

  interface: ICurveFiCurveInterface;

  functions: {
    get_virtual_price(
      overrides?: CallOverrides
    ): Promise<{
      out: BigNumber;
      0: BigNumber;
    }>;

    "get_virtual_price()"(
      overrides?: CallOverrides
    ): Promise<{
      out: BigNumber;
      0: BigNumber;
    }>;

    add_liquidity(
      amounts: BigNumberish[],
      deadline: BigNumberish,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "add_liquidity(uint256[2],uint256)"(
      amounts: BigNumberish[],
      deadline: BigNumberish,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    get_dy(
      i: BigNumberish,
      j: BigNumberish,
      dx: BigNumberish,
      overrides?: CallOverrides
    ): Promise<{
      out: BigNumber;
      0: BigNumber;
    }>;

    "get_dy(int128,int128,uint256)"(
      i: BigNumberish,
      j: BigNumberish,
      dx: BigNumberish,
      overrides?: CallOverrides
    ): Promise<{
      out: BigNumber;
      0: BigNumber;
    }>;

    get_dy_underlying(
      i: BigNumberish,
      j: BigNumberish,
      dx: BigNumberish,
      overrides?: CallOverrides
    ): Promise<{
      out: BigNumber;
      0: BigNumber;
    }>;

    "get_dy_underlying(int128,int128,uint256)"(
      i: BigNumberish,
      j: BigNumberish,
      dx: BigNumberish,
      overrides?: CallOverrides
    ): Promise<{
      out: BigNumber;
      0: BigNumber;
    }>;

    "exchange(int128,int128,uint256,uint256,uint256)"(
      i: BigNumberish,
      j: BigNumberish,
      dx: BigNumberish,
      min_dy: BigNumberish,
      deadline: BigNumberish,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "exchange(int128,int128,uint256,uint256)"(
      i: BigNumberish,
      j: BigNumberish,
      dx: BigNumberish,
      min_dy: BigNumberish,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "exchange_underlying(int128,int128,uint256,uint256,uint256)"(
      i: BigNumberish,
      j: BigNumberish,
      dx: BigNumberish,
      min_dy: BigNumberish,
      deadline: BigNumberish,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "exchange_underlying(int128,int128,uint256,uint256)"(
      i: BigNumberish,
      j: BigNumberish,
      dx: BigNumberish,
      min_dy: BigNumberish,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    remove_liquidity(
      _amount: BigNumberish,
      deadline: BigNumberish,
      min_amounts: BigNumberish[],
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "remove_liquidity(uint256,uint256,uint256[2])"(
      _amount: BigNumberish,
      deadline: BigNumberish,
      min_amounts: BigNumberish[],
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    remove_liquidity_imbalance(
      amounts: BigNumberish[],
      deadline: BigNumberish,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "remove_liquidity_imbalance(uint256[2],uint256)"(
      amounts: BigNumberish[],
      deadline: BigNumberish,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    commit_new_parameters(
      amplification: BigNumberish,
      new_fee: BigNumberish,
      new_admin_fee: BigNumberish,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "commit_new_parameters(int128,int128,int128)"(
      amplification: BigNumberish,
      new_fee: BigNumberish,
      new_admin_fee: BigNumberish,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    apply_new_parameters(overrides?: Overrides): Promise<ContractTransaction>;

    "apply_new_parameters()"(
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    revert_new_parameters(overrides?: Overrides): Promise<ContractTransaction>;

    "revert_new_parameters()"(
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    commit_transfer_ownership(
      _owner: string,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "commit_transfer_ownership(address)"(
      _owner: string,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    apply_transfer_ownership(
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "apply_transfer_ownership()"(
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    revert_transfer_ownership(
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "revert_transfer_ownership()"(
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    withdraw_admin_fees(overrides?: Overrides): Promise<ContractTransaction>;

    "withdraw_admin_fees()"(
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    coins(
      arg0: BigNumberish,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "coins(int128)"(
      arg0: BigNumberish,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    underlying_coins(
      arg0: BigNumberish,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "underlying_coins(int128)"(
      arg0: BigNumberish,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    balances(
      arg0: BigNumberish,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "balances(int128)"(
      arg0: BigNumberish,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    A(overrides?: Overrides): Promise<ContractTransaction>;

    "A()"(overrides?: Overrides): Promise<ContractTransaction>;

    fee(overrides?: Overrides): Promise<ContractTransaction>;

    "fee()"(overrides?: Overrides): Promise<ContractTransaction>;

    admin_fee(overrides?: Overrides): Promise<ContractTransaction>;

    "admin_fee()"(overrides?: Overrides): Promise<ContractTransaction>;

    owner(overrides?: Overrides): Promise<ContractTransaction>;

    "owner()"(overrides?: Overrides): Promise<ContractTransaction>;

    admin_actions_deadline(overrides?: Overrides): Promise<ContractTransaction>;

    "admin_actions_deadline()"(
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    transfer_ownership_deadline(
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "transfer_ownership_deadline()"(
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    future_A(overrides?: Overrides): Promise<ContractTransaction>;

    "future_A()"(overrides?: Overrides): Promise<ContractTransaction>;

    future_fee(overrides?: Overrides): Promise<ContractTransaction>;

    "future_fee()"(overrides?: Overrides): Promise<ContractTransaction>;

    future_admin_fee(overrides?: Overrides): Promise<ContractTransaction>;

    "future_admin_fee()"(overrides?: Overrides): Promise<ContractTransaction>;

    future_owner(overrides?: Overrides): Promise<ContractTransaction>;

    "future_owner()"(overrides?: Overrides): Promise<ContractTransaction>;
  };

  get_virtual_price(overrides?: CallOverrides): Promise<BigNumber>;

  "get_virtual_price()"(overrides?: CallOverrides): Promise<BigNumber>;

  add_liquidity(
    amounts: BigNumberish[],
    deadline: BigNumberish,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "add_liquidity(uint256[2],uint256)"(
    amounts: BigNumberish[],
    deadline: BigNumberish,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  get_dy(
    i: BigNumberish,
    j: BigNumberish,
    dx: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  "get_dy(int128,int128,uint256)"(
    i: BigNumberish,
    j: BigNumberish,
    dx: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  get_dy_underlying(
    i: BigNumberish,
    j: BigNumberish,
    dx: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  "get_dy_underlying(int128,int128,uint256)"(
    i: BigNumberish,
    j: BigNumberish,
    dx: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  "exchange(int128,int128,uint256,uint256,uint256)"(
    i: BigNumberish,
    j: BigNumberish,
    dx: BigNumberish,
    min_dy: BigNumberish,
    deadline: BigNumberish,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "exchange(int128,int128,uint256,uint256)"(
    i: BigNumberish,
    j: BigNumberish,
    dx: BigNumberish,
    min_dy: BigNumberish,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "exchange_underlying(int128,int128,uint256,uint256,uint256)"(
    i: BigNumberish,
    j: BigNumberish,
    dx: BigNumberish,
    min_dy: BigNumberish,
    deadline: BigNumberish,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "exchange_underlying(int128,int128,uint256,uint256)"(
    i: BigNumberish,
    j: BigNumberish,
    dx: BigNumberish,
    min_dy: BigNumberish,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  remove_liquidity(
    _amount: BigNumberish,
    deadline: BigNumberish,
    min_amounts: BigNumberish[],
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "remove_liquidity(uint256,uint256,uint256[2])"(
    _amount: BigNumberish,
    deadline: BigNumberish,
    min_amounts: BigNumberish[],
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  remove_liquidity_imbalance(
    amounts: BigNumberish[],
    deadline: BigNumberish,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "remove_liquidity_imbalance(uint256[2],uint256)"(
    amounts: BigNumberish[],
    deadline: BigNumberish,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  commit_new_parameters(
    amplification: BigNumberish,
    new_fee: BigNumberish,
    new_admin_fee: BigNumberish,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "commit_new_parameters(int128,int128,int128)"(
    amplification: BigNumberish,
    new_fee: BigNumberish,
    new_admin_fee: BigNumberish,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  apply_new_parameters(overrides?: Overrides): Promise<ContractTransaction>;

  "apply_new_parameters()"(overrides?: Overrides): Promise<ContractTransaction>;

  revert_new_parameters(overrides?: Overrides): Promise<ContractTransaction>;

  "revert_new_parameters()"(
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  commit_transfer_ownership(
    _owner: string,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "commit_transfer_ownership(address)"(
    _owner: string,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  apply_transfer_ownership(overrides?: Overrides): Promise<ContractTransaction>;

  "apply_transfer_ownership()"(
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  revert_transfer_ownership(
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "revert_transfer_ownership()"(
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  withdraw_admin_fees(overrides?: Overrides): Promise<ContractTransaction>;

  "withdraw_admin_fees()"(overrides?: Overrides): Promise<ContractTransaction>;

  coins(
    arg0: BigNumberish,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "coins(int128)"(
    arg0: BigNumberish,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  underlying_coins(
    arg0: BigNumberish,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "underlying_coins(int128)"(
    arg0: BigNumberish,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  balances(
    arg0: BigNumberish,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "balances(int128)"(
    arg0: BigNumberish,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  A(overrides?: Overrides): Promise<ContractTransaction>;

  "A()"(overrides?: Overrides): Promise<ContractTransaction>;

  fee(overrides?: Overrides): Promise<ContractTransaction>;

  "fee()"(overrides?: Overrides): Promise<ContractTransaction>;

  admin_fee(overrides?: Overrides): Promise<ContractTransaction>;

  "admin_fee()"(overrides?: Overrides): Promise<ContractTransaction>;

  owner(overrides?: Overrides): Promise<ContractTransaction>;

  "owner()"(overrides?: Overrides): Promise<ContractTransaction>;

  admin_actions_deadline(overrides?: Overrides): Promise<ContractTransaction>;

  "admin_actions_deadline()"(
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  transfer_ownership_deadline(
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "transfer_ownership_deadline()"(
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  future_A(overrides?: Overrides): Promise<ContractTransaction>;

  "future_A()"(overrides?: Overrides): Promise<ContractTransaction>;

  future_fee(overrides?: Overrides): Promise<ContractTransaction>;

  "future_fee()"(overrides?: Overrides): Promise<ContractTransaction>;

  future_admin_fee(overrides?: Overrides): Promise<ContractTransaction>;

  "future_admin_fee()"(overrides?: Overrides): Promise<ContractTransaction>;

  future_owner(overrides?: Overrides): Promise<ContractTransaction>;

  "future_owner()"(overrides?: Overrides): Promise<ContractTransaction>;

  callStatic: {
    get_virtual_price(overrides?: CallOverrides): Promise<BigNumber>;

    "get_virtual_price()"(overrides?: CallOverrides): Promise<BigNumber>;

    add_liquidity(
      amounts: BigNumberish[],
      deadline: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    "add_liquidity(uint256[2],uint256)"(
      amounts: BigNumberish[],
      deadline: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    get_dy(
      i: BigNumberish,
      j: BigNumberish,
      dx: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "get_dy(int128,int128,uint256)"(
      i: BigNumberish,
      j: BigNumberish,
      dx: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    get_dy_underlying(
      i: BigNumberish,
      j: BigNumberish,
      dx: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "get_dy_underlying(int128,int128,uint256)"(
      i: BigNumberish,
      j: BigNumberish,
      dx: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "exchange(int128,int128,uint256,uint256,uint256)"(
      i: BigNumberish,
      j: BigNumberish,
      dx: BigNumberish,
      min_dy: BigNumberish,
      deadline: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    "exchange(int128,int128,uint256,uint256)"(
      i: BigNumberish,
      j: BigNumberish,
      dx: BigNumberish,
      min_dy: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    "exchange_underlying(int128,int128,uint256,uint256,uint256)"(
      i: BigNumberish,
      j: BigNumberish,
      dx: BigNumberish,
      min_dy: BigNumberish,
      deadline: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    "exchange_underlying(int128,int128,uint256,uint256)"(
      i: BigNumberish,
      j: BigNumberish,
      dx: BigNumberish,
      min_dy: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    remove_liquidity(
      _amount: BigNumberish,
      deadline: BigNumberish,
      min_amounts: BigNumberish[],
      overrides?: CallOverrides
    ): Promise<void>;

    "remove_liquidity(uint256,uint256,uint256[2])"(
      _amount: BigNumberish,
      deadline: BigNumberish,
      min_amounts: BigNumberish[],
      overrides?: CallOverrides
    ): Promise<void>;

    remove_liquidity_imbalance(
      amounts: BigNumberish[],
      deadline: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    "remove_liquidity_imbalance(uint256[2],uint256)"(
      amounts: BigNumberish[],
      deadline: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    commit_new_parameters(
      amplification: BigNumberish,
      new_fee: BigNumberish,
      new_admin_fee: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    "commit_new_parameters(int128,int128,int128)"(
      amplification: BigNumberish,
      new_fee: BigNumberish,
      new_admin_fee: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    apply_new_parameters(overrides?: CallOverrides): Promise<void>;

    "apply_new_parameters()"(overrides?: CallOverrides): Promise<void>;

    revert_new_parameters(overrides?: CallOverrides): Promise<void>;

    "revert_new_parameters()"(overrides?: CallOverrides): Promise<void>;

    commit_transfer_ownership(
      _owner: string,
      overrides?: CallOverrides
    ): Promise<void>;

    "commit_transfer_ownership(address)"(
      _owner: string,
      overrides?: CallOverrides
    ): Promise<void>;

    apply_transfer_ownership(overrides?: CallOverrides): Promise<void>;

    "apply_transfer_ownership()"(overrides?: CallOverrides): Promise<void>;

    revert_transfer_ownership(overrides?: CallOverrides): Promise<void>;

    "revert_transfer_ownership()"(overrides?: CallOverrides): Promise<void>;

    withdraw_admin_fees(overrides?: CallOverrides): Promise<void>;

    "withdraw_admin_fees()"(overrides?: CallOverrides): Promise<void>;

    coins(arg0: BigNumberish, overrides?: CallOverrides): Promise<string>;

    "coins(int128)"(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<string>;

    underlying_coins(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<string>;

    "underlying_coins(int128)"(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<string>;

    balances(arg0: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;

    "balances(int128)"(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    A(overrides?: CallOverrides): Promise<BigNumber>;

    "A()"(overrides?: CallOverrides): Promise<BigNumber>;

    fee(overrides?: CallOverrides): Promise<BigNumber>;

    "fee()"(overrides?: CallOverrides): Promise<BigNumber>;

    admin_fee(overrides?: CallOverrides): Promise<BigNumber>;

    "admin_fee()"(overrides?: CallOverrides): Promise<BigNumber>;

    owner(overrides?: CallOverrides): Promise<string>;

    "owner()"(overrides?: CallOverrides): Promise<string>;

    admin_actions_deadline(overrides?: CallOverrides): Promise<BigNumber>;

    "admin_actions_deadline()"(overrides?: CallOverrides): Promise<BigNumber>;

    transfer_ownership_deadline(overrides?: CallOverrides): Promise<BigNumber>;

    "transfer_ownership_deadline()"(
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    future_A(overrides?: CallOverrides): Promise<BigNumber>;

    "future_A()"(overrides?: CallOverrides): Promise<BigNumber>;

    future_fee(overrides?: CallOverrides): Promise<BigNumber>;

    "future_fee()"(overrides?: CallOverrides): Promise<BigNumber>;

    future_admin_fee(overrides?: CallOverrides): Promise<BigNumber>;

    "future_admin_fee()"(overrides?: CallOverrides): Promise<BigNumber>;

    future_owner(overrides?: CallOverrides): Promise<string>;

    "future_owner()"(overrides?: CallOverrides): Promise<string>;
  };

  filters: {};

  estimateGas: {
    get_virtual_price(overrides?: CallOverrides): Promise<BigNumber>;

    "get_virtual_price()"(overrides?: CallOverrides): Promise<BigNumber>;

    add_liquidity(
      amounts: BigNumberish[],
      deadline: BigNumberish,
      overrides?: Overrides
    ): Promise<BigNumber>;

    "add_liquidity(uint256[2],uint256)"(
      amounts: BigNumberish[],
      deadline: BigNumberish,
      overrides?: Overrides
    ): Promise<BigNumber>;

    get_dy(
      i: BigNumberish,
      j: BigNumberish,
      dx: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "get_dy(int128,int128,uint256)"(
      i: BigNumberish,
      j: BigNumberish,
      dx: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    get_dy_underlying(
      i: BigNumberish,
      j: BigNumberish,
      dx: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "get_dy_underlying(int128,int128,uint256)"(
      i: BigNumberish,
      j: BigNumberish,
      dx: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "exchange(int128,int128,uint256,uint256,uint256)"(
      i: BigNumberish,
      j: BigNumberish,
      dx: BigNumberish,
      min_dy: BigNumberish,
      deadline: BigNumberish,
      overrides?: Overrides
    ): Promise<BigNumber>;

    "exchange(int128,int128,uint256,uint256)"(
      i: BigNumberish,
      j: BigNumberish,
      dx: BigNumberish,
      min_dy: BigNumberish,
      overrides?: Overrides
    ): Promise<BigNumber>;

    "exchange_underlying(int128,int128,uint256,uint256,uint256)"(
      i: BigNumberish,
      j: BigNumberish,
      dx: BigNumberish,
      min_dy: BigNumberish,
      deadline: BigNumberish,
      overrides?: Overrides
    ): Promise<BigNumber>;

    "exchange_underlying(int128,int128,uint256,uint256)"(
      i: BigNumberish,
      j: BigNumberish,
      dx: BigNumberish,
      min_dy: BigNumberish,
      overrides?: Overrides
    ): Promise<BigNumber>;

    remove_liquidity(
      _amount: BigNumberish,
      deadline: BigNumberish,
      min_amounts: BigNumberish[],
      overrides?: Overrides
    ): Promise<BigNumber>;

    "remove_liquidity(uint256,uint256,uint256[2])"(
      _amount: BigNumberish,
      deadline: BigNumberish,
      min_amounts: BigNumberish[],
      overrides?: Overrides
    ): Promise<BigNumber>;

    remove_liquidity_imbalance(
      amounts: BigNumberish[],
      deadline: BigNumberish,
      overrides?: Overrides
    ): Promise<BigNumber>;

    "remove_liquidity_imbalance(uint256[2],uint256)"(
      amounts: BigNumberish[],
      deadline: BigNumberish,
      overrides?: Overrides
    ): Promise<BigNumber>;

    commit_new_parameters(
      amplification: BigNumberish,
      new_fee: BigNumberish,
      new_admin_fee: BigNumberish,
      overrides?: Overrides
    ): Promise<BigNumber>;

    "commit_new_parameters(int128,int128,int128)"(
      amplification: BigNumberish,
      new_fee: BigNumberish,
      new_admin_fee: BigNumberish,
      overrides?: Overrides
    ): Promise<BigNumber>;

    apply_new_parameters(overrides?: Overrides): Promise<BigNumber>;

    "apply_new_parameters()"(overrides?: Overrides): Promise<BigNumber>;

    revert_new_parameters(overrides?: Overrides): Promise<BigNumber>;

    "revert_new_parameters()"(overrides?: Overrides): Promise<BigNumber>;

    commit_transfer_ownership(
      _owner: string,
      overrides?: Overrides
    ): Promise<BigNumber>;

    "commit_transfer_ownership(address)"(
      _owner: string,
      overrides?: Overrides
    ): Promise<BigNumber>;

    apply_transfer_ownership(overrides?: Overrides): Promise<BigNumber>;

    "apply_transfer_ownership()"(overrides?: Overrides): Promise<BigNumber>;

    revert_transfer_ownership(overrides?: Overrides): Promise<BigNumber>;

    "revert_transfer_ownership()"(overrides?: Overrides): Promise<BigNumber>;

    withdraw_admin_fees(overrides?: Overrides): Promise<BigNumber>;

    "withdraw_admin_fees()"(overrides?: Overrides): Promise<BigNumber>;

    coins(arg0: BigNumberish, overrides?: Overrides): Promise<BigNumber>;

    "coins(int128)"(
      arg0: BigNumberish,
      overrides?: Overrides
    ): Promise<BigNumber>;

    underlying_coins(
      arg0: BigNumberish,
      overrides?: Overrides
    ): Promise<BigNumber>;

    "underlying_coins(int128)"(
      arg0: BigNumberish,
      overrides?: Overrides
    ): Promise<BigNumber>;

    balances(arg0: BigNumberish, overrides?: Overrides): Promise<BigNumber>;

    "balances(int128)"(
      arg0: BigNumberish,
      overrides?: Overrides
    ): Promise<BigNumber>;

    A(overrides?: Overrides): Promise<BigNumber>;

    "A()"(overrides?: Overrides): Promise<BigNumber>;

    fee(overrides?: Overrides): Promise<BigNumber>;

    "fee()"(overrides?: Overrides): Promise<BigNumber>;

    admin_fee(overrides?: Overrides): Promise<BigNumber>;

    "admin_fee()"(overrides?: Overrides): Promise<BigNumber>;

    owner(overrides?: Overrides): Promise<BigNumber>;

    "owner()"(overrides?: Overrides): Promise<BigNumber>;

    admin_actions_deadline(overrides?: Overrides): Promise<BigNumber>;

    "admin_actions_deadline()"(overrides?: Overrides): Promise<BigNumber>;

    transfer_ownership_deadline(overrides?: Overrides): Promise<BigNumber>;

    "transfer_ownership_deadline()"(overrides?: Overrides): Promise<BigNumber>;

    future_A(overrides?: Overrides): Promise<BigNumber>;

    "future_A()"(overrides?: Overrides): Promise<BigNumber>;

    future_fee(overrides?: Overrides): Promise<BigNumber>;

    "future_fee()"(overrides?: Overrides): Promise<BigNumber>;

    future_admin_fee(overrides?: Overrides): Promise<BigNumber>;

    "future_admin_fee()"(overrides?: Overrides): Promise<BigNumber>;

    future_owner(overrides?: Overrides): Promise<BigNumber>;

    "future_owner()"(overrides?: Overrides): Promise<BigNumber>;
  };

  populateTransaction: {
    get_virtual_price(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "get_virtual_price()"(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    add_liquidity(
      amounts: BigNumberish[],
      deadline: BigNumberish,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "add_liquidity(uint256[2],uint256)"(
      amounts: BigNumberish[],
      deadline: BigNumberish,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    get_dy(
      i: BigNumberish,
      j: BigNumberish,
      dx: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "get_dy(int128,int128,uint256)"(
      i: BigNumberish,
      j: BigNumberish,
      dx: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    get_dy_underlying(
      i: BigNumberish,
      j: BigNumberish,
      dx: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "get_dy_underlying(int128,int128,uint256)"(
      i: BigNumberish,
      j: BigNumberish,
      dx: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "exchange(int128,int128,uint256,uint256,uint256)"(
      i: BigNumberish,
      j: BigNumberish,
      dx: BigNumberish,
      min_dy: BigNumberish,
      deadline: BigNumberish,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "exchange(int128,int128,uint256,uint256)"(
      i: BigNumberish,
      j: BigNumberish,
      dx: BigNumberish,
      min_dy: BigNumberish,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "exchange_underlying(int128,int128,uint256,uint256,uint256)"(
      i: BigNumberish,
      j: BigNumberish,
      dx: BigNumberish,
      min_dy: BigNumberish,
      deadline: BigNumberish,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "exchange_underlying(int128,int128,uint256,uint256)"(
      i: BigNumberish,
      j: BigNumberish,
      dx: BigNumberish,
      min_dy: BigNumberish,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    remove_liquidity(
      _amount: BigNumberish,
      deadline: BigNumberish,
      min_amounts: BigNumberish[],
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "remove_liquidity(uint256,uint256,uint256[2])"(
      _amount: BigNumberish,
      deadline: BigNumberish,
      min_amounts: BigNumberish[],
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    remove_liquidity_imbalance(
      amounts: BigNumberish[],
      deadline: BigNumberish,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "remove_liquidity_imbalance(uint256[2],uint256)"(
      amounts: BigNumberish[],
      deadline: BigNumberish,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    commit_new_parameters(
      amplification: BigNumberish,
      new_fee: BigNumberish,
      new_admin_fee: BigNumberish,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "commit_new_parameters(int128,int128,int128)"(
      amplification: BigNumberish,
      new_fee: BigNumberish,
      new_admin_fee: BigNumberish,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    apply_new_parameters(overrides?: Overrides): Promise<PopulatedTransaction>;

    "apply_new_parameters()"(
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    revert_new_parameters(overrides?: Overrides): Promise<PopulatedTransaction>;

    "revert_new_parameters()"(
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    commit_transfer_ownership(
      _owner: string,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "commit_transfer_ownership(address)"(
      _owner: string,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    apply_transfer_ownership(
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "apply_transfer_ownership()"(
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    revert_transfer_ownership(
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "revert_transfer_ownership()"(
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    withdraw_admin_fees(overrides?: Overrides): Promise<PopulatedTransaction>;

    "withdraw_admin_fees()"(
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    coins(
      arg0: BigNumberish,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "coins(int128)"(
      arg0: BigNumberish,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    underlying_coins(
      arg0: BigNumberish,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "underlying_coins(int128)"(
      arg0: BigNumberish,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    balances(
      arg0: BigNumberish,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "balances(int128)"(
      arg0: BigNumberish,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    A(overrides?: Overrides): Promise<PopulatedTransaction>;

    "A()"(overrides?: Overrides): Promise<PopulatedTransaction>;

    fee(overrides?: Overrides): Promise<PopulatedTransaction>;

    "fee()"(overrides?: Overrides): Promise<PopulatedTransaction>;

    admin_fee(overrides?: Overrides): Promise<PopulatedTransaction>;

    "admin_fee()"(overrides?: Overrides): Promise<PopulatedTransaction>;

    owner(overrides?: Overrides): Promise<PopulatedTransaction>;

    "owner()"(overrides?: Overrides): Promise<PopulatedTransaction>;

    admin_actions_deadline(
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "admin_actions_deadline()"(
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    transfer_ownership_deadline(
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "transfer_ownership_deadline()"(
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    future_A(overrides?: Overrides): Promise<PopulatedTransaction>;

    "future_A()"(overrides?: Overrides): Promise<PopulatedTransaction>;

    future_fee(overrides?: Overrides): Promise<PopulatedTransaction>;

    "future_fee()"(overrides?: Overrides): Promise<PopulatedTransaction>;

    future_admin_fee(overrides?: Overrides): Promise<PopulatedTransaction>;

    "future_admin_fee()"(overrides?: Overrides): Promise<PopulatedTransaction>;

    future_owner(overrides?: Overrides): Promise<PopulatedTransaction>;

    "future_owner()"(overrides?: Overrides): Promise<PopulatedTransaction>;
  };
}