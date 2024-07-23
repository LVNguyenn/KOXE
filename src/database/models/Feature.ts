import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"
import { Warranty } from "./Warranty";

@Entity()
export class Feature {
    @PrimaryGeneratedColumn('uuid')
    feature_id!: string;

    @Column({ nullable: true })
    name!: string;

    @Column({ nullable: true })
    description!: string;

    @Column({ nullable: true })
    keyMap!: string;

    @Column({
        type: "timestamptz",
        default: () => "timezone('Asia/Saigon', now())",
    })
    createdAt!: Date;

    init(name: string, description: string, keyMap: string) {
        this.name = name;
        this.description = description;
        this.keyMap = keyMap
    }
}