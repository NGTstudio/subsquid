import { Store } from '@subsquid/typeorm-store'
import { Contract } from './model'

// Evo NFTs
export const evoAddress = '0x4151b8afa10653d304FdAc9a781AFccd45EC164c'.toLowerCase();


export const contractMapping: Map<string, Contract> = new Map()

contractMapping.set(evoAddress, new Contract({
  id: evoAddress,
  symbol: "Evo",
  totalSupply: 0n,
  nfts: []
}))
