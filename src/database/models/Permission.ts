import { Entity, Column, PrimaryColumn, OneToOne, JoinColumn, OneToMany } from "typeorm"
import { LegalDocuments } from "./LegalDocuments";

@Entity()
export class Permission {
    @PrimaryColumn()
    key!: string;

    @Column({nullable: true})
    name!: string;

    init(key: string, name: string) {
        this.key = key;
        this.name = name;
    }
}