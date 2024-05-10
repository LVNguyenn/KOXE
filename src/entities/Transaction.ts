import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Connection } from "./Connection";
import { Stage } from "./Stage";
import { User } from "./User";
import { Salon } from "./Salon";
import { Procedure } from "./Procedure";

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

  @ManyToOne(() => Procedure, (procedure) => procedure.transactions)
  procedure!: Procedure;

  @ManyToOne(() => Stage, (stage) => stage.transactions)
  stage!: Stage;

  @Column("simple-array", { nullable: true })
  checked!: string[];

  @Column("simple-array", { nullable: true })
  commissionAmount!: number[];

  @Column({ default: "pending" })
  status!: string; // ('pending', 'success', 'fail')
}
