import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Stage } from "./Stage";

@Entity()
export class CommissionDetails {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  name!: string;

  @ManyToOne(() => Stage, (stage) => stage.commissionDetails, {
    onDelete: "CASCADE",
  })
  stage!: Stage;
}
