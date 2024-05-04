import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Connection } from "./Connection";

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn("uuid")
  transaction_id!: string;

  // @ManyToOne(() => User, (user) => user.transactions)
  // user!: User;

  // @ManyToOne(() => Salon, (salon) => salon.transactions)
  // salon!: Salon;

  @ManyToOne(() => Connection, (connection) => connection.transactions)
  connection!: Connection;

  @Column()
  stage!: number;

  @Column({ default: false })
  status!: boolean;

  @Column({ nullable: true, default: 0, type: "float" })
  commissionAmount!: number;
}
