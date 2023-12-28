import "dotenv/config";
import { TypeormDatabase } from "@subsquid/typeorm-store";
import { In } from "typeorm";
import * as erc721 from "./abi/erc721";
import { contractMapping, EVO_ADDRESS } from "./contracts";
import { Token, Wallet, Transfer } from "./model";
import { Block, Context, Log, processor } from "./processor";

var contractsSaved = false;

processor.run(new TypeormDatabase({ supportHotBlocks: true }), async (ctx) => {
  const transfersData: TransferData[] = [];

  for (const block of ctx.blocks) {
    for (const log of block.logs) {
      if (log.address === EVO_ADDRESS && log.topics[0] === erc721.events.Transfer.topic && log.transaction?.status === 1) {
        const transfer = handleTransfer(ctx, block.header, log);
        transfersData.push(transfer);
      }
    }
  }
  if (!contractsSaved) {
    await ctx.store.upsert([ ...contractMapping.values() ])
    contractsSaved = true
  }
  await saveTransfers(ctx, transfersData);
});

type TransferData = {
  id: string
  block: number
  timestamp: Date
  txHash: string
  from: string
  to: string
  tokenId: bigint
  contractAddress: string
}

function handleTransfer(ctx: Context, block: Block, log: Log): TransferData {
  const { from, to, tokenId } = erc721.events.Transfer.decode(log);
  ctx.log.info(`Parsed a Transfer of token ${tokenId} from ${from} to ${to}`);
  return {
    id: log.id,
    block: block.height,
    timestamp: new Date(block.timestamp),
    txHash: log.transaction?.hash ?? "",
    from,
    to,
    tokenId,
    contractAddress: log.address,
  };
}

async function saveTransfers(ctx: Context, transfersData: TransferData[]) {

  const getTokenId = (data: TransferData) => `${data.contractAddress}-${data.tokenId.toString()}`;

  const tokenIds: Set<string> = new Set();
  const walletIds: Set<string> = new Set();

  for (const transferData of transfersData) {
    tokenIds.add(getTokenId(transferData));
    walletIds.add(transferData.from);
    walletIds.add(transferData.to);
  }

  const tokens: Map<string, Token> = new Map(
    (
      await ctx.store.findBy(Token, { id: In([ ...tokenIds ]) })
    ).map(token => [ token.id, token ]),
  );

  const wallets: Map<string, Wallet> = new Map(
    (
      await ctx.store.findBy(Wallet, { id: In([ ...walletIds ]) })
    )
      .map(wallet => [ wallet.id, wallet ]),
  );

  const transfers: Set<Transfer> = new Set();

  for (const transferData of transfersData) {

    let from = wallets.get(transferData.from);
    if (from == null) {
      from = new Wallet({ id: transferData.from });
      wallets.set(from.id, from);
    }

    let to = wallets.get(transferData.to);
    if (to == null) {
      to = new Wallet({ id: transferData.to });
      wallets.set(to.id, to);
    }

    const tokenId = getTokenId(transferData);
    let token = tokens.get(tokenId);
    if (token == null) {
      token = new Token({
        id: tokenId,
        contract: contractMapping.get(transferData.contractAddress),
      });
      tokens.set(token.id, token);
    }

    token.owner = to;

    const { id, block, timestamp, txHash } = transferData;
    const transfer = new Transfer({ id, block, timestamp, txHash, from, to, token });

    transfers.add(transfer);
  }

  await ctx.store.upsert([ ...wallets.values() ]);
  await ctx.store.upsert([ ...tokens.values() ]);
  await ctx.store.insert([ ...transfers ]);
}
