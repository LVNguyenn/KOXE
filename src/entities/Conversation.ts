import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Conversation {
  @PrimaryGeneratedColumn("uuid")
  conversation_id!: number;

  @Column("simple-array", { nullable: true })
  participants!: string[];

  @Column("simple-array", { nullable: true })
  messages!: string[];

  @Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;

  @Column({ nullable: true })
  status!: boolean;

  init(
    participants: string[],
    messages: string[],
    createdAt: Date,
    updatedAt: Date,
    status: boolean
  ) {
    this.participants = participants;
    this.messages = messages;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.status = status;
  }
}
