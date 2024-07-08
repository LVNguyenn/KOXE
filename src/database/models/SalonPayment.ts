import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from "typeorm"
import { Salon } from "./Salon";

@Entity()
export class SalonPayment {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    custormer_phone!: string;

    @Column({ nullable: true })
    custormer_fullname!: string;

    @Column()
    reason!: string;

    @Column()
    creator!: string;

    @Column()
    amount!: number;

    @Column({default: false})
    status!: boolean;

    @Column({nullable: true})
    invoice_id!: string;

    @Column({nullable: true})
    payment_method!: string;

    @Column({
        type: "timestamptz",
        default: () => "timezone('Asia/Saigon', now())",
    })
    create_date!: Date;

    @ManyToOne(() => Salon, (salon) => salon.pays, {
        onDelete: "CASCADE",
    })
    salon!: Salon;

    init(custormer_phone: string, custormer_fullname: string, reason: string, creator: string, 
         amount: number, create_date: Date, status: boolean, invoice_id: string) {
        this.custormer_phone = custormer_phone;
        this.custormer_fullname = custormer_fullname;
        this.reason = reason;
        this.creator = creator;
        this.amount = amount;
        this.create_date = create_date;
        this.status = status;
        this.invoice_id = invoice_id;
    }

    constructor() {
        this.create_date = new Date();
    }
}