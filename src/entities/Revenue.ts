import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Salon } from "./Salon";
import { User } from "./User";

@Entity()
export class Revenue {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Salon)
  salon!: Salon;

  @ManyToOne(() => User)
  user!: User;

  @Column("decimal")
  amount!: number;
}
