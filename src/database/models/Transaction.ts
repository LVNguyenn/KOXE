import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Connection } from "./Connection";
import { Stage } from "./Stage";
import { User } from "./User";
import { Salon } from "./Salon";
import { Process } from "./Process";

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn("uuid")
  transaction_id!: string;

  @ManyToOne(() => User, (user) => user.transactions)
  user!: User;

  @ManyToOne(() => Salon, (salon) => salon.transactions)
  salon!: Salon;

  @ManyToOne(() => Connection, (connection) => connection.transactions)
  connection!: Connection;

  @ManyToOne(() => Process, (process) => process.transactions)
  process!: Process;

  @ManyToOne(() => Stage, (stage) => stage.transactions)
  stage!: Stage;

  @Column("simple-array", { nullable: true })
  checked!: string[];

  @Column("simple-array", { nullable: true })
  commissionList!: number[];

  @Column("simple-array", { nullable: true })
  ratingList!: number[];

  @Column({ default: "pending" })
  status!: string; // ('pending', 'success', 'fail')

  @Column({ default: 1 })
  statusRating!: number;

  @Column({
    type: "timestamptz",
    default: () => "timezone('Asia/Saigon', now())",
  })
  createdAt!: Date;
}
