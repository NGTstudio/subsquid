import { Store, TypeormDatabase } from '@subsquid/typeorm-store'
import { In } from 'typeorm'
import {
    evoAddress,
    contractMapping
} from './contracts'
import { Owner, NFT, Transfer } from './model'
import * as erc721 from './abi/erc721'
import {
    processor,
    ProcessorContext,
    Event,
    Block
} from './processor'

var contractsSaved = false

processor.run(new TypeormDatabase(), async (ctx) => {
    const transfersData: TransferData[] = [];

    for (const block of ctx.blocks) {
        for (const event of block.events) {
            if (event.name === 'EVM.Log') {
                const transfer = handleTransfer(block.header, event)
                transfersData.push(transfer)
            }
        }
    }

    if (!contractsSaved) {
        await ctx.store.upsert([...contractMapping.values()])
        contractsSaved = true
    }
    await saveTransfers(ctx, transfersData)
})

type TransferData = {
    id: string
    from: string
    to: string
    nft: bigint
    timestamp: number
    block: number
    contractAddress: string
}

function handleTransfer(block: Block, event: Event): TransferData {
    const { from, to, tokenId } = erc721.events.Transfer.decode(event)
    return {
        id: event.id,
        from,
        to,
        nft: tokenId,
        timestamp: block.timestamp,
        block: block.height,
        contractAddress: event.args.address
    }
}

async function saveTransfers(ctx: ProcessorContext<Store>, transfersData: TransferData[]) {
    const getTokenId = (transferData: TransferData) => `${contractMapping.get(transferData.contractAddress)?.symbol ?? ""}-${transferData.nft.toString()}`

    const nftsIds: Set<string> = new Set()
    const ownersIds: Set<string> = new Set()

    for (const transferData of transfersData) {
        nftsIds.add(getTokenId(transferData))
        ownersIds.add(transferData.from)
        ownersIds.add(transferData.to)
    }

    const nfts: Map<string, NFT> = new Map(
      (await ctx.store.findBy(NFT, { id: In([...nftsIds]) }))
        .map(nft => [nft.id, nft])
    )

    const owners: Map<string, Owner> = new Map(
      (await ctx.store.findBy(Owner, { id: In([...ownersIds]) }))
        .map(owner => [owner.id, owner])
    )

    const transfers: Set<Transfer> = new Set()

    for (const transferData of transfersData) {
        const contract = new erc721.Contract(
          // temporary workaround for SDK issue 212
          // passing just the ctx as first arg may already work
          {_chain: {client: ctx._chain.rpc}},
          { height: transferData.block },
          transferData.contractAddress
        )

        let from = owners.get(transferData.from)
        if (from == null) {
            from = new Owner({ id: transferData.from, balance: 0n })
            owners.set(from.id, from)
        }

        let to = owners.get(transferData.to)
        if (to == null) {
            to = new Owner({ id: transferData.to, balance: 0n })
            owners.set(to.id, to)
        }

        const nftId = getTokenId(transferData)
        let nft = nfts.get(nftId)
        if (nft == null) {
            nft = new NFT({
                id: nftId,
                contract: contractMapping.get(transferData.contractAddress)
            })
            nfts.set(nft.id, nft)
        }

        nft.owner = to

        const { id, block, timestamp } = transferData

        const transfer = new Transfer({
            id,
            block,
            timestamp,
            from,
            to,
            nft
        })

        transfers.add(transfer)
    }

    await ctx.store.upsert([...owners.values()])
    await ctx.store.upsert([...nfts.values()])
    await ctx.store.insert([...transfers])
}