import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, OneToMany as OneToMany_} from "typeorm"
import {Token} from "./token.model"
import {Transfer} from "./transfer.model"

@Entity_()
export class Wallet {
    constructor(props?: Partial<Wallet>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @OneToMany_(() => Token, e => e.owner)
    tokens!: Token[]

    @OneToMany_(() => Transfer, e => e.from)
    transfersFrom!: Transfer[]

    @OneToMany_(() => Transfer, e => e.to)
    transfersTo!: Transfer[]
}
