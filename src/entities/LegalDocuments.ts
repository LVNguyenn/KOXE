import { Entity, PrimaryGeneratedColumn, Column, PrimaryColumn, ManyToOne, ManyToMany, OneToMany, JoinTable } from "typeorm"
import { Car } from "./Car";
import { User } from "./User";
import { LegalDetails } from "./LegalDetails";
import { Salon } from "./Salon";
import { Process } from "./Process";

@Entity()
export class LegalDocuments {
    @PrimaryGeneratedColumn('uuid')
    period!: string;

    @Column()
    name!: string;

    @Column({default: true})
    reuse!: boolean;

    @Column()
    order!: number;

    @JoinTable()
    @ManyToMany(() => Car, (car) => car.legals, { cascade: true })
    car!: Car[]

    @JoinTable()
    @ManyToMany(() => User, (user) => user.legals, { cascade: true })
    user!: User[]

    @OneToMany(() => LegalDetails, (legal) => legal.period, { cascade: ['remove'] })
    documents!: LegalDetails[];

    @ManyToOne(() => Salon, (salon) => salon.legals, { cascade: true })
    salon!: Salon;

    @ManyToOne(() => Process, (process) => process.documents, { cascade: true })
    process!: Process;

    init (name: string, order: number) {
        this.name = name;
        this.order = order;
    }
}