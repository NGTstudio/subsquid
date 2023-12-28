import { lookupArchive } from "@subsquid/archive-registry";
import {
  BlockHeader,
  DataHandlerContext,
  EvmBatchProcessor,
  EvmBatchProcessorFields,
  Log as _Log,
  Transaction as _Transaction,
} from "@subsquid/evm-processor";
import { Store } from "@subsquid/typeorm-store";
import { assertNotNull } from "@subsquid/util-internal";
import { events } from "./abi/erc721";

import { EVO_ADDRESS } from "./contracts";


export const processor = new EvmBatchProcessor()
  .setBlockRange({ from: 36695600 })
  .setDataSource({
    archive: lookupArchive("avalanche"),
    chain: {
      url: "wss://ws-nd-878-841-440.p2pify.com/09c9f30d4ade5974b6b344c5115bf861/ext/bc/C/ws", // assertNotNull(process.env.RPC_ENDPOINT),
      rateLimit: 10,
    },
  })
  .setFinalityConfirmation(1)
  .addLog({
    address: [ EVO_ADDRESS ],
    range: { from: 36695600 },
    topic0: [ events.Transfer.topic ],
    transaction: true,
  })
  .setFields({
    transaction: {
      status: true,
    }
  });

export type Fields = EvmBatchProcessorFields<typeof processor>
export type Context = DataHandlerContext<Store, Fields>
export type Block = BlockHeader<Fields>
export type Log = _Log<Fields>
export type Transaction = _Transaction<Fields>
