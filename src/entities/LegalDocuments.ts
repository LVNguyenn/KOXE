import { Entity, PrimaryGeneratedColumn, Column, PrimaryColumn, ManyToOne, ManyToMany, OneToMany, JoinTable } from "typeorm"
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

    @Column()
    order!: number;

    @JoinTable()
    @ManyToMany(() => Car, (car) => car.legals, { cascade: true })
    car!: Car[]

    @JoinTable()
    @ManyToMany(() => Car, (car) => car.legals_hoa_tieu, { cascade: true })
    car_hoa_tieu!: Car[]

    @ManyToMany(() => User, (user) => user.legals, { cascade: true })
    user!: User[]

    @OneToMany(() => LegalDetails, (legal) => legal.period, { cascade: ['remove'] })
    documents!: LegalDetails[];

    @ManyToOne(() => Salon, (salon) => salon.legals, { cascade: true })
    salon!: Salon;

    init (name: string, order: number) {
        this.name = name;
        this.order = order;
    }
}