import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  PrimaryColumn,
  ManyToOne,
  ManyToMany,
  OneToMany,
  JoinTable,
} from "typeorm";
import { User } from "./User";
import { LegalDetails } from "./LegalDetails";
import { Process } from "./Process";
import { Car } from "./Car";

@Entity()
export class LegalDocuments {
  @PrimaryGeneratedColumn("uuid")
  period!: string;

  @Column()
  name!: string;

  @Column({ default: true })
  reuse!: boolean;

  @Column()
  order!: number;

  @OneToMany(() => LegalDetails, (legal) => legal.document, {
    cascade: ["remove"],
  })
  details!: LegalDetails[];

  @ManyToOne(() => Process, (process) => process.documents, {
    onDelete: "CASCADE",
  })
  process!: Process;

  init(name: string, order: number) {
    this.name = name;
    this.order = order;
  }
}
