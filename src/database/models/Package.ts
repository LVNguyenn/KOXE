import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, Check, OneToMany } from 'typeorm';
import { Feature } from './Feature';
import { Purchase } from "./Purchase";

@Entity()
export class Package {
    @PrimaryGeneratedColumn('uuid')
    package_id!: string;

    @Column({nullable: true})
    name!: string;

    @Column({nullable: true})
    description!: string;

    @Column({nullable: true, type: 'float'})
    @Check(`"price" >= 0`)
    price!: number;

    @Column({nullable: true})
    image!: string;

    @ManyToMany(() => Feature, { cascade: true })
    @JoinTable()
    features!: Feature[];

    @OneToMany(() => Purchase, purchase => purchase.package)
    users!: Purchase[];

    init(name: string, description: string, price: number, features: Feature[]) {
        this.name = name;
        this.description = description;
        this.price = price;
        this.features = features;
    }
}