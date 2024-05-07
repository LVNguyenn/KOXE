import { Entity, Column, PrimaryColumn, OneToOne, JoinColumn, OneToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm"
import { LegalDocuments } from "./LegalDocuments";
import { Car } from "./Car";
import { Salon } from "./Salon";

@Entity()
export class Process {
    @PrimaryGeneratedColumn()
    id!: string;

    @Column()
    name!: string;

    @ManyToOne(() => Salon, (salon) => salon.process, { cascade: true})
    salon!: Salon;

    @OneToMany(() => LegalDocuments, (document) => document.process, { cascade: ['remove'] })
    documents!: LegalDocuments[];

    @OneToMany(() => Car, (car) => car.process, { cascade: true })
    cars!: LegalDocuments[];

    init(id: string, name: string) {
        this.id = id;
        this.name = name;
    }
}