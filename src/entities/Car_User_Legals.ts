import { Entity, Column, PrimaryColumn, OneToOne, JoinColumn, OneToMany } from "typeorm"
import { LegalDetails } from "./LegalDetails";
import { Car } from "./Car";

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

    @Column({default: false})
    done!: boolean;

    // @OneToOne(() => Car)
    // @JoinColumn({ name: "car_id" })
    // car!: Car;

    init(current_period: string, done: boolean) {
        this.current_period = current_period;
        this.done = done;
    }
}