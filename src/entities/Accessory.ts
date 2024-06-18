import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Check,
  ManyToOne,
} from "typeorm";
import { Salon } from "./Salon";

@Entity()
export class Accessory {
  @PrimaryGeneratedColumn("uuid")
  accessory_id!: string;

  @Column({ nullable: true })
  name!: string;

  @Column({ nullable: true })
  // Nhà sản xuất
  manufacturer!: string;

  @Column({ nullable: true, type: "float" })
  @Check(`"price" >= 0`)
  price!: number;

  @ManyToOne(() => Salon, (salon) => salon.accessories)
  salon!: Salon;

  @Column({ nullable: true })
  icon!: string;

  init(name: string, manufacturer: string, price: number, salon: Salon) {
    this.name = name;
    this.manufacturer = manufacturer;
    this.price = price;
    this.salon = salon;
  }
}
