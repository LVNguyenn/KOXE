import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Message {
  @PrimaryGeneratedColumn("uuid")
  message_id!: string;

  @Column()
  senderId!: string;

  @Column()
  receiverId!: string;

  @Column()
  message!: string;

  @Column({ type: "text", array: true, nullable: true })
  image!: string[];

  @Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;

  init(
    senderId: string,
    receiverId: string,
    message: string,
    createdAt: Date,
    updatedAt: Date
  ) {
    this.senderId = senderId;
    this.receiverId = receiverId;
    this.message = message;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
