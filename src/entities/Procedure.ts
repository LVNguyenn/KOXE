import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
} from "typeorm";
import { Stage } from "./Stage";
import { Salon } from "./Salon";
import { Connection } from "./Connection";
import { Transaction } from "./Transaction";

@Entity()
export class Procedure {
  @PrimaryGeneratedColumn("uuid")
  procedure_id!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  type!: string;

  @OneToMany(() => Stage, (stage) => stage.procedure)
  stages!: Stage[];

  @ManyToOne(() => Salon, (salon) => salon.stages)
  salon!: Salon;

  @OneToMany(() => Connection, (connection) => connection.procedure)
  connections!: Connection[];

  @OneToMany(() => Transaction, (transaction) => transaction.procedure)
  transactions!: Transaction[];
}
