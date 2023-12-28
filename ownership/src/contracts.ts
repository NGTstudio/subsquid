import { Contract } from './model'

// Evo NFTs
export const EVO_ADDRESS = '0x4151b8afa10653d304FdAc9a781AFccd45EC164c'.toLowerCase();


export const contractMapping: Map<string, Contract> = new Map()
contractMapping.set(EVO_ADDRESS, new Contract({
  id: EVO_ADDRESS,
  name: "Evos",
  symbol: "Evo",
  tokens: []
}))
