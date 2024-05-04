import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
} from "typeorm";
import { User } from "./User";
import { Connection } from "./Connection";

@Entity()
export class Post {
  @PrimaryGeneratedColumn("uuid")
  post_id!: string;

  @Column({ nullable: true, length: 500 })
  text!: string;

  @ManyToOne(() => User, (user) => user.user_id)
  postedBy!: User;

  @Column("simple-array", { nullable: true, default: "All" })
  salons!: string[];

  @OneToMany(() => Connection, (connection) => connection.post)
  connections!: Connection[];

  @Column({ type: "timestamptz" })
  createdAt!: Date;

  init(text: string, postedBy: User, createdAt: Date) {
    this.text = text;
    this.postedBy = postedBy;
    this.createdAt = createdAt;
  }
}
