import {assertNotNull} from '@subsquid/util-internal'
import {lookupArchive} from '@subsquid/archive-registry'
import {
    BlockHeader,
    DataHandlerContext,
    SubstrateBatchProcessor,
    SubstrateBatchProcessorFields,
    Event as _Event,
    Call as _Call,
    Extrinsic as _Extrinsic
} from '@subsquid/substrate-processor'
import * as erc721 from './abi/erc721'

import { evoAddress } from "./contracts";

export const processor = new SubstrateBatchProcessor()
  .setBlockRange({ from: 36695600 })
    .setDataSource({
        archive: lookupArchive('avalanche', {type: 'Substrate', release: 'ArrowSquid'}),
        chain: {
            url: assertNotNull(process.env.RPC_ENDPOINT),
            rateLimit: 10
        }
    })
    .addEvmLog({
        address: [evoAddress],
        range: { from: 36695600 },
        topic0: [erc721.events.Transfer.topic]
    })

export type Fields = SubstrateBatchProcessorFields<typeof processor>
export type Block = BlockHeader<Fields>
export type Event = _Event<Fields>
export type Call = _Call<Fields>
export type Extrinsic = _Extrinsic<Fields>
export type ProcessorContext<Store> = DataHandlerContext<Store, Fields>
