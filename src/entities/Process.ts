import { Entity, Column, PrimaryColumn, OneToOne, JoinColumn, OneToMany } from "typeorm"
import { Feature } from "./Feature";
import { LegalDocuments } from "./LegalDocuments";
import { Car } from "./Car";

@Entity()
export class Process {
    @PrimaryColumn()
    id!: string;

    @Column()
    name!: string;

    @OneToMany(() => LegalDocuments, (document) => document.process, { cascade: ['remove'] })
    documents!: LegalDocuments[];

    @OneToMany(() => Car, (car) => car.process, { cascade: true })
    cars!: LegalDocuments[];

    init(id: string, name: string) {
        this.id = id;
        this.name = name;
    }
}