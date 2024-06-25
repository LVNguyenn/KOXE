import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Check,
  ManyToOne,
} from "typeorm";
import { Salon } from "./Salon";

@Entity()
export class Maintenance {
  @PrimaryGeneratedColumn("uuid")
  maintenance_id!: string;

  @Column({ nullable: true })
  name!: string;

  @Column({ nullable: true })
  description!: string;

  @Column({ nullable: true, type: "float" })
  @Check(`"cost" >= 0`)
  cost!: number;

  @ManyToOne(() => Salon, (salon) => salon.services)
  salon!: Salon;

  init(name: string, description: string, cost: number, salon: Salon) {
    this.name = name;
    this.description = description;
    this.cost = cost;
    this.salon = salon;
  }
}
