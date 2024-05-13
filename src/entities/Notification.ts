import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Notification {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  to!: string;

  @Column()
  description!: string;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  create_at!: Date;

  @Column({ nullable: true })
  data!: string;

  @Column()
  types!: string;

  @Column({ default: false })
  read!: boolean;

  @Column({ nullable: true })
  avatar!: string;

  init(
    id: string,
    to: string,
    description: string,
    create_at: Date,
    data: string,
    types: string,
    read: boolean,
    avatar: string
  ) {
    this.id = id;
    this.to = to;
    this.description = description;
    this.create_at = create_at;
    this.data = data;
    this.types = types;
    this.read = read;
    this.avatar = avatar;
  }
}
