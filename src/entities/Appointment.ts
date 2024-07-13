import {
  Entity,
  Column,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";
import { Salon } from "./Salon";

@Entity()
export class Appointment {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  salon_id!: string;

  @Column({ type: 'timestamp' })
  date!: Date;

  @Column({ nullable: true })
  notificationTime!: string;

  @Column({ default: false })
  notificationSent!: boolean;

  @Column()
  description!: string;

  @Column({ default: 0 })
  status!: number;

  @Column()
  user_id!: string;

  @Column({
    type: "timestamptz",
    default: () => "timezone('Asia/Saigon', now())",
  })
  create_at!: Date;

  @ManyToOne(() => User, (user) => user.user_id)
  @JoinColumn({ name: "user_id" })
  user!: User;

  @ManyToOne(() => Salon, (salon) => salon.salon_id)
  @JoinColumn({ name: "salon_id" })
  salon!: Salon;

  @Column({ default: "user" })
  from!: string;

  @Column()
  car_id!: string;

  @Column({default: false})
  read!: boolean;

  init(
    salon_id: string,
    user_id: string,
    date: Date,
    description: string,
    status: number,
    car_id: string,
    read: boolean
  ) {
    this.salon_id = salon_id;
    this.user_id = user_id;
    this.date = date;
    this.description = description;
    this.status = status;
    this.car_id = car_id;
    this.read = read;
  }
}
