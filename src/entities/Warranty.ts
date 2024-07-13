import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
} from "typeorm";
import { Salon } from "./Salon";
import { Car } from "./Car";
import { Maintenance } from "./Maintenance";

@Entity()
export class Warranty {
  @PrimaryGeneratedColumn("uuid")
  warranty_id!: string;

  @Column({
    type: "timestamptz",
    default: () => "timezone('Asia/Saigon', now())",
  })
  create_at!: Date;

  @Column({})
  name!: string;

  @Column({ default: true })
  reuse!: boolean;

  @Column({})
  limit_kilometer!: number;

  @Column({})
  months!: number;

  @Column({})
  policy!: string;

  @Column({ nullable: true })
  note!: string;

  @ManyToOne(() => Salon, (salon) => salon.warranties, { cascade: true })
  salon!: Salon;

  @OneToMany(() => Car, (car) => car.warranties, { cascade: true })
  car!: Car[];

  @ManyToMany(() => Maintenance, { cascade: true, onDelete: 'CASCADE' })
  @JoinTable()
  maintenance!: Maintenance[];

  init(
    create_at: Date,
    name: string,
    reuse: boolean,
    limit_kilometer: number,
    months: number,
    policy: string,
    note: string
  ) {
    this.create_at = create_at;
    this.name = name;
    this.reuse = reuse;
    this.limit_kilometer = limit_kilometer;
    this.months = months;
    this.policy = policy;
    this.note = note;
  }
}
