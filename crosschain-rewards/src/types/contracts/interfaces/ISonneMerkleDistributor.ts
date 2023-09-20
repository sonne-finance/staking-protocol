/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumberish,
  BytesLike,
  FunctionFragment,
  Result,
  Interface,
  EventFragment,
  AddressLike,
  ContractRunner,
  ContractMethod,
  Listener,
} from "ethers";
import type {
  TypedContractEvent,
  TypedDeferredTopicFilter,
  TypedEventLog,
  TypedLogDescription,
  TypedListener,
  TypedContractMethod,
} from "../../common";

export interface ISonneMerkleDistributorInterface extends Interface {
  getFunction(
    nameOrSignature:
      | "Rewards"
      | "addReward"
      | "claim"
      | "delegatorAddresses"
      | "isClaimable"
      | "rewardToken"
      | "setDelegator"
      | "withdrawFunds"
  ): FunctionFragment;

  getEvent(
    nameOrSignatureOrTopic: "MerkleClaim" | "MerkleFundUpdate" | "NewMerkle"
  ): EventFragment;

  encodeFunctionData(
    functionFragment: "Rewards",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "addReward",
    values: [BigNumberish, BytesLike, BigNumberish, BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "claim",
    values: [BigNumberish, BytesLike[]]
  ): string;
  encodeFunctionData(
    functionFragment: "delegatorAddresses",
    values: [AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "isClaimable",
    values: [BigNumberish, AddressLike, BytesLike[]]
  ): string;
  encodeFunctionData(
    functionFragment: "rewardToken",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "setDelegator",
    values: [AddressLike, AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "withdrawFunds",
    values: [BigNumberish, BigNumberish]
  ): string;

  decodeFunctionResult(functionFragment: "Rewards", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "addReward", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "claim", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "delegatorAddresses",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "isClaimable",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "rewardToken",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setDelegator",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "withdrawFunds",
    data: BytesLike
  ): Result;
}

export namespace MerkleClaimEvent {
  export type InputTuple = [
    claimer: AddressLike,
    rewardToken: AddressLike,
    blockNr: BigNumberish,
    amount: BigNumberish
  ];
  export type OutputTuple = [
    claimer: string,
    rewardToken: string,
    blockNr: bigint,
    amount: bigint
  ];
  export interface OutputObject {
    claimer: string;
    rewardToken: string;
    blockNr: bigint;
    amount: bigint;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace MerkleFundUpdateEvent {
  export type InputTuple = [
    funder: AddressLike,
    merkleRoot: BytesLike,
    blockNr: BigNumberish,
    amount: BigNumberish,
    withdrawal: boolean
  ];
  export type OutputTuple = [
    funder: string,
    merkleRoot: string,
    blockNr: bigint,
    amount: bigint,
    withdrawal: boolean
  ];
  export interface OutputObject {
    funder: string;
    merkleRoot: string;
    blockNr: bigint;
    amount: bigint;
    withdrawal: boolean;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace NewMerkleEvent {
  export type InputTuple = [
    creator: AddressLike,
    rewardToken: AddressLike,
    amount: BigNumberish,
    merkleRoot: BytesLike,
    blockNr: BigNumberish,
    withdrawUnlockTime: BigNumberish
  ];
  export type OutputTuple = [
    creator: string,
    rewardToken: string,
    amount: bigint,
    merkleRoot: string,
    blockNr: bigint,
    withdrawUnlockTime: bigint
  ];
  export interface OutputObject {
    creator: string;
    rewardToken: string;
    amount: bigint;
    merkleRoot: string;
    blockNr: bigint;
    withdrawUnlockTime: bigint;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export interface ISonneMerkleDistributor extends BaseContract {
  connect(runner?: ContractRunner | null): ISonneMerkleDistributor;
  waitForDeployment(): Promise<this>;

  interface: ISonneMerkleDistributorInterface;

  queryFilter<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;
  queryFilter<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;

  on<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  on<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  once<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  once<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  listeners<TCEvent extends TypedContractEvent>(
    event: TCEvent
  ): Promise<Array<TypedListener<TCEvent>>>;
  listeners(eventName?: string): Promise<Array<Listener>>;
  removeAllListeners<TCEvent extends TypedContractEvent>(
    event?: TCEvent
  ): Promise<this>;

  Rewards: TypedContractMethod<
    [blockNumber: BigNumberish],
    [
      [bigint, string, bigint, bigint] & {
        balance: bigint;
        merkleRoot: string;
        withdrawUnlockTime: bigint;
        ratio: bigint;
      }
    ],
    "view"
  >;

  addReward: TypedContractMethod<
    [
      amount: BigNumberish,
      merkleRoot: BytesLike,
      blockNumber: BigNumberish,
      withdrawUnlockTime: BigNumberish,
      totalStakedBalance: BigNumberish
    ],
    [void],
    "nonpayable"
  >;

  claim: TypedContractMethod<
    [blockNumber: BigNumberish, proof: BytesLike[]],
    [void],
    "nonpayable"
  >;

  delegatorAddresses: TypedContractMethod<
    [_delegator: AddressLike],
    [string],
    "view"
  >;

  isClaimable: TypedContractMethod<
    [blockNumber: BigNumberish, account: AddressLike, proof: BytesLike[]],
    [boolean],
    "view"
  >;

  rewardToken: TypedContractMethod<[], [string], "view">;

  setDelegator: TypedContractMethod<
    [_recipient: AddressLike, _delegator: AddressLike],
    [void],
    "nonpayable"
  >;

  withdrawFunds: TypedContractMethod<
    [blockNumber: BigNumberish, amount: BigNumberish],
    [void],
    "nonpayable"
  >;

  getFunction<T extends ContractMethod = ContractMethod>(
    key: string | FunctionFragment
  ): T;

  getFunction(
    nameOrSignature: "Rewards"
  ): TypedContractMethod<
    [blockNumber: BigNumberish],
    [
      [bigint, string, bigint, bigint] & {
        balance: bigint;
        merkleRoot: string;
        withdrawUnlockTime: bigint;
        ratio: bigint;
      }
    ],
    "view"
  >;
  getFunction(
    nameOrSignature: "addReward"
  ): TypedContractMethod<
    [
      amount: BigNumberish,
      merkleRoot: BytesLike,
      blockNumber: BigNumberish,
      withdrawUnlockTime: BigNumberish,
      totalStakedBalance: BigNumberish
    ],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "claim"
  ): TypedContractMethod<
    [blockNumber: BigNumberish, proof: BytesLike[]],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "delegatorAddresses"
  ): TypedContractMethod<[_delegator: AddressLike], [string], "view">;
  getFunction(
    nameOrSignature: "isClaimable"
  ): TypedContractMethod<
    [blockNumber: BigNumberish, account: AddressLike, proof: BytesLike[]],
    [boolean],
    "view"
  >;
  getFunction(
    nameOrSignature: "rewardToken"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "setDelegator"
  ): TypedContractMethod<
    [_recipient: AddressLike, _delegator: AddressLike],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "withdrawFunds"
  ): TypedContractMethod<
    [blockNumber: BigNumberish, amount: BigNumberish],
    [void],
    "nonpayable"
  >;

  getEvent(
    key: "MerkleClaim"
  ): TypedContractEvent<
    MerkleClaimEvent.InputTuple,
    MerkleClaimEvent.OutputTuple,
    MerkleClaimEvent.OutputObject
  >;
  getEvent(
    key: "MerkleFundUpdate"
  ): TypedContractEvent<
    MerkleFundUpdateEvent.InputTuple,
    MerkleFundUpdateEvent.OutputTuple,
    MerkleFundUpdateEvent.OutputObject
  >;
  getEvent(
    key: "NewMerkle"
  ): TypedContractEvent<
    NewMerkleEvent.InputTuple,
    NewMerkleEvent.OutputTuple,
    NewMerkleEvent.OutputObject
  >;

  filters: {
    "MerkleClaim(address,address,uint256,uint256)": TypedContractEvent<
      MerkleClaimEvent.InputTuple,
      MerkleClaimEvent.OutputTuple,
      MerkleClaimEvent.OutputObject
    >;
    MerkleClaim: TypedContractEvent<
      MerkleClaimEvent.InputTuple,
      MerkleClaimEvent.OutputTuple,
      MerkleClaimEvent.OutputObject
    >;

    "MerkleFundUpdate(address,bytes32,uint256,uint256,bool)": TypedContractEvent<
      MerkleFundUpdateEvent.InputTuple,
      MerkleFundUpdateEvent.OutputTuple,
      MerkleFundUpdateEvent.OutputObject
    >;
    MerkleFundUpdate: TypedContractEvent<
      MerkleFundUpdateEvent.InputTuple,
      MerkleFundUpdateEvent.OutputTuple,
      MerkleFundUpdateEvent.OutputObject
    >;

    "NewMerkle(address,address,uint256,bytes32,uint256,uint256)": TypedContractEvent<
      NewMerkleEvent.InputTuple,
      NewMerkleEvent.OutputTuple,
      NewMerkleEvent.OutputObject
    >;
    NewMerkle: TypedContractEvent<
      NewMerkleEvent.InputTuple,
      NewMerkleEvent.OutputTuple,
      NewMerkleEvent.OutputObject
    >;
  };
}
