import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
} from "typeorm";
import { Salon } from "./Salon";
import { User } from "./User";
import { Post } from "./Post";
import { Procedure } from "./Procedure";
import { Transaction } from "./Transaction";

@Entity()
export class Connection {
  @PrimaryGeneratedColumn("uuid")
  connection_id!: string;

  @ManyToOne(() => Salon, (salon) => salon.connections)
  salon!: Salon;

  @ManyToOne(() => User, (user) => user.connections)
  user!: User;

  @ManyToOne(() => Post, (post) => post.connections)
  post!: Post;

  @ManyToOne(() => Procedure, (procedure) => procedure.connections)
  procedure!: Procedure;

  @Column({ type: "timestamptz" })
  createdAt!: Date;

  @OneToMany(() => Transaction, (transaction) => transaction.connection)
  transactions!: Transaction[];

  @Column({ default: "pending" })
  status!: string; // ('pending', 'accepted', 'rejected')
}
