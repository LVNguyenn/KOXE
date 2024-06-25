import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { User } from "./User";

@Entity()
export class GroupSalon {
  @PrimaryGeneratedColumn("uuid")
  group_id!: string;

  @Column()
  name!: string;

  @ManyToOne(() => User, (user) => user.groupSalons)
  user!: User;

  @Column("simple-array", { nullable: true })
  salons!: string[];
}
