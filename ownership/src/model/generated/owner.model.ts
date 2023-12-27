import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, OneToMany as OneToMany_} from "typeorm"
import * as marshal from "./marshal"
import {NFT} from "./nft.model"

@Entity_()
export class Owner {
    constructor(props?: Partial<Owner>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @OneToMany_(() => NFT, e => e.owner)
    nfts!: NFT[]

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: true})
    balance!: bigint | undefined | null
}
