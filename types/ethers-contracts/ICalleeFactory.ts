/* Generated by ts-generator ver. 0.0.8 */
/* tslint:disable */

import { Contract, Signer } from "ethers";
import { Provider } from "@ethersproject/providers";

import { ICallee } from "./ICallee";

export class ICalleeFactory {
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): ICallee {
    return new Contract(address, _abi, signerOrProvider) as ICallee;
  }
}

const _abi = [
  {
    constant: false,
    inputs: [
      {
        internalType: "address",
        name: "sender",
        type: "address"
      },
      {
        components: [
          {
            internalType: "address",
            name: "owner",
            type: "address"
          },
          {
            internalType: "uint256",
            name: "number",
            type: "uint256"
          }
        ],
        internalType: "struct Account.Info",
        name: "accountInfo",
        type: "tuple"
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes"
      }
    ],
    name: "callFunction",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  }
];
