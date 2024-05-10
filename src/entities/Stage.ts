import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from "typeorm";
import { Procedure } from "./Procedure";
import { Salon } from "./Salon";
import { CommissionDetails } from "./CommissionDetails";
import { Transaction } from "./Transaction";

@Entity()
export class Stage {
  @PrimaryGeneratedColumn("uuid")
  stage_id!: string;

  @Column()
  name!: string;

  @ManyToOne(() => Procedure, (procedure) => procedure.stages, {
    onDelete: "CASCADE",
  })
  procedure!: Procedure;

  @OneToMany(() => CommissionDetails, (com) => com.stage)
  commissionDetails!: CommissionDetails[];

  @ManyToOne(() => Salon, (salon) => salon.stages)
  salon!: Salon;

  @Column({ nullable: true, default: 0, type: "float" })
  commissionRate!: number;

  @Column({ nullable: true })
  order!: number;

  @OneToMany(() => Transaction, (transaction) => transaction.stage)
  transactions!: Transaction[];

  //@OneToMany(
  //  () => CommissionDetail,
  //  (commissionDetail) => commissionDetail.stage
  //)
  //commissionDetails: CommissionDetail[];
}
