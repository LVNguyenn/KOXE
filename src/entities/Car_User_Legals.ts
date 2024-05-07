import { Entity, Column, PrimaryColumn, OneToOne, JoinColumn, OneToMany } from "typeorm"
import { LegalDetails } from "./LegalDetails";

@Entity()
export class Car_User_Legals {
    @PrimaryColumn()
    car_id!: string;

    @Column()
    phone!: string;

    @Column("simple-array", { nullable: true })
    details!: LegalDetails[];

    @Column({default: 0})
    current_period!: number;

    init(current_period: number) {
        this.current_period = current_period;
    }
}