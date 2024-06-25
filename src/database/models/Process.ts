import {
  Entity,
  Column,
  PrimaryColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { LegalDocuments } from "./LegalDocuments";
import { Car } from "./Car";
import { Salon } from "./Salon";
import { Stage } from "./Stage";
import { Connection } from "./Connection";
import { Transaction } from "./Transaction";

@Entity()
export class Process {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  description!: string;

  @Column({ default: 0 })
  type!: number;

  @ManyToOne(() => Salon, (salon) => salon.process, { cascade: true })
  salon!: Salon;

  @OneToMany(() => LegalDocuments, (document) => document.process, {
    cascade: ["remove"],
  })
  documents!: LegalDocuments[];

  // @OneToMany(() => Car, (car) => car.process, { cascade: true })
  // cars!: LegalDocuments[];

  @OneToMany(() => Stage, (stage) => stage.process)
  stages!: Stage[];

  @OneToMany(() => Connection, (connection) => connection.process)
  connections!: Connection[];

  @OneToMany(() => Transaction, (transaction) => transaction.process)
  transactions!: Transaction[];

  init(id: string, name: string, description: string, type: number) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.type = type;
  }
}
