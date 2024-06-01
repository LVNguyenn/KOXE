import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Salon } from "./Salon";

@Entity()
export class Promotion {
  @PrimaryGeneratedColumn("uuid")
  promotion_id!: string;

  @Column()
  title!: string;

  @Column("text")
  description!: string;

  @Column("text")
  content!: string;

  @ManyToOne(() => Salon, (salon) => salon.promotions)
  salon!: Salon;

  @Column({ type: "timestamptz" })
  startDate!: Date;

  @Column({ type: "timestamptz" })
  endDate!: Date;

  @Column({ type: "text", array: true, nullable: true })
  banner!: string[];

  @Column({ type: "timestamptz" })
  createdAt!: Date;

  @Column({ type: "timestamptz" })
  updatedAt!: Date;
}
