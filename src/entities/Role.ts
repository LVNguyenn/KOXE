import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from "typeorm"
import { Salon } from "./Salon";

@Entity()
export class Role {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    name!: string;

    @Column("simple-array", { nullable: true })
    permissions!: string[];

    @ManyToOne(() => Salon, (salon) => salon.roles, {
        onDelete: "CASCADE",
      })
    salon!: Salon;

    init( name: string, permissions: string[]) {
        this.name = name;
        this.permissions = permissions;
    }
}