import { Entity, Column, PrimaryColumn, OneToOne, JoinColumn, OneToMany } from "typeorm"
import { LegalDetails } from "./LegalDetails";
import { Car } from "./Car";
import { Invoice } from "./Invoice";

@Entity()
export class Car_User_Legals {
    @PrimaryColumn('uuid')
    car_id!: string;

    @Column()
    phone!: string;

    @Column("json", { nullable: true })
    details!: any[];

    @Column()
    current_period!: string;

    @OneToOne(() => Invoice, invoice => invoice.legals_user)
    @JoinColumn()
    invoice!: Invoice;

    init(current_period: string, done: boolean) {
        this.current_period = current_period;
    }
}