import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Message {
    @PrimaryGeneratedColumn('uuid')
    message_id!: string;

    @Column()
    senderId!: string;

    @Column()
    receiverId!: string;

    @Column()
    message!: string;

    @Column({ type: "timestamptz" })
    createdAt!: Date;

    @Column({ type: "timestamptz" })
    updatedAt!: Date;

    init(senderId: string, receiverId: string, message: string, createdAt: Date, updatedAt: Date) {
        this.senderId = senderId;
        this.receiverId = receiverId;
        this.message = message;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}