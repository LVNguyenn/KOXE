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
  contentHtml!: string;

  @Column("text")
  contentMarkdown!: string;

  @ManyToOne(() => Salon, (salon) => salon.promotions)
  salon!: Salon;

  @Column({ type: "timestamptz" })
  startDate!: Date;

  @Column({ type: "timestamptz" })
  endDate!: Date;

  @Column({ type: "text", array: true, nullable: true })
  banner!: string[];

  @Column({
    type: "timestamptz",
    default: () => "timezone('Asia/Bangkok', now())",
  })
  createdAt!: Date;

  @Column({
    type: "timestamptz",
    default: () => "timezone('Asia/Bangkok', now())",
  })
  updatedAt!: Date;
}
