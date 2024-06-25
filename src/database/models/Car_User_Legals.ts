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

    @Column("simple-array", { nullable: true })
    details!: string[];

    @Column({nullable: true})
    current_period!: string;

    @Column({nullable: true})
    processId!: string;

    @OneToOne(() => Invoice, invoice => invoice.legals_user, {onDelete: 'CASCADE'})
    @JoinColumn()
    invoice!: Invoice;

    init(current_period: string, processId: string) {
        this.current_period = current_period;
        this.processId = processId;
    }
}