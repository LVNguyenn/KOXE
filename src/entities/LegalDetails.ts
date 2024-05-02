import { Entity, PrimaryGeneratedColumn, Column, PrimaryColumn, ManyToOne, OneToMany, JoinColumn } from "typeorm"
import { LegalDocuments } from "./LegalDocuments";

@Entity()
export class LegalDetails {
    @PrimaryGeneratedColumn('uuid')
    id!: string

    @JoinColumn()
    @ManyToOne(() => LegalDocuments, (legal) => legal.documents, { cascade: true })
    period!: LegalDocuments

    @Column()
    name!: string;

    @Column()
    update_date!: Date

    init (name: string, update_date: Date) {
        this.name = name;
        this.update_date = update_date;
    }

}