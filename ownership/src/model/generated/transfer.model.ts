import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_} from "typeorm"
import {NFT} from "./nft.model"
import {Owner} from "./owner.model"

@Entity_()
export class Transfer {
    constructor(props?: Partial<Transfer>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @ManyToOne_(() => NFT, {nullable: true})
    nft!: NFT

    @Index_()
    @ManyToOne_(() => Owner, {nullable: true})
    from!: Owner | undefined | null

    @Index_()
    @ManyToOne_(() => Owner, {nullable: true})
    to!: Owner | undefined | null

    @Column_("int4", {nullable: false})
    timestamp!: number

    @Column_("int4", {nullable: false})
    block!: number
}
