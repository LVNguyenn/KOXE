import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"

@Entity()
export class Feature {
    @PrimaryGeneratedColumn('uuid')
    feature_id!: string;

    @Column({nullable: true})
    name!: string;

    @Column({nullable: true})
    description!: string;

    @Column({nullable: true})
    keyMap!: string;

    init(name: string, description: string, keyMap: string) {
        this.name = name;
        this.description = description;
        this.keyMap = keyMap
    }
}