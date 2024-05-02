import { Entity, PrimaryGeneratedColumn, Column, PrimaryColumn, ManyToOne, ManyToMany, OneToMany } from "typeorm"
import { Car } from "./Car";
import { User } from "./User";
import { LegalDetails } from "./LegalDetails";
import { Salon } from "./Salon";

@Entity()
export class LegalDocuments {
    @PrimaryGeneratedColumn('uuid')
    period!: string;

    @Column()
    name!: string;

    @Column({default: true})
    reuse!: boolean;

    @ManyToMany(() => Car, (car) => car.legals, { cascade: true })
    car!: Car[]

    @ManyToMany(() => User, (user) => user.legals, { cascade: true })
    user!: User[]

    @OneToMany(() => LegalDetails, (legal) => legal.period)
    documents!: LegalDetails[];

    @ManyToOne(() => Salon, (salon) => salon.legals, { cascade: true })
    salon!: Salon;

    init (name: string) {
        this.name = name;
    }
}