import { Entity, Column, PrimaryColumn, OneToOne, JoinColumn, OneToMany } from "typeorm"
import { LegalDetails } from "./LegalDetails";

@Entity()
export class Car_User_Legals {
    @PrimaryColumn()
    car_id!: string;

    @Column()
    phone!: string;

    @Column("json", { nullable: true })
    details!: any[];

    @Column()
    current_period!: string;

    @Column({default: false})
    done!: boolean;

    init(current_period: string, done: boolean) {
        this.current_period = current_period;
        this.done = done;
    }
}