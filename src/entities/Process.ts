import { Entity, Column, PrimaryColumn, OneToOne, JoinColumn, OneToMany } from "typeorm"
import { Feature } from "./Feature";
import { LegalDocuments } from "./LegalDocuments";

@Entity()
export class Process {
    @PrimaryColumn()
    id!: string;

    @Column()
    name!: string;

    @OneToMany(() => LegalDocuments, (document) => document.process, { cascade: ['remove'] })
    documents!: LegalDocuments[];

    init(id: string, name: string) {
        this.id = id;
        this.name = name;
    }
}