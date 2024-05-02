import { Entity, PrimaryGeneratedColumn, Column, PrimaryColumn, ManyToOne, ManyToMany, OneToMany } from "typeorm"
import { Car } from "./Car";
import { User } from "./User";
import { LegalDetails } from "./LegalDetails";

@Entity()
export class LegalDocuments {
    @PrimaryGeneratedColumn('uuid')
    period!: string;

    @Column()
    name!: string;

    @ManyToMany(() => Car, (car) => car.legals, { cascade: true })
    car!: Car[]

    @ManyToMany(() => User, (user) => user.legals, { cascade: true })
    user!: User[]

    @OneToMany(() => LegalDetails, (legal) => legal.period)
    documents!: LegalDetails[];

    init (name: string) {
        this.name = name;
    }
}