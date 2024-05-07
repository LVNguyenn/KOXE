import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Check,
  ManyToOne,
  ManyToMany,
  JoinTable,
  JoinColumn,
  OneToOne,
  OneToMany,
} from "typeorm";
import { Salon } from "./Salon"; // Import entities Salon
import { Warranty } from "./Warranty";
import { LegalDocuments } from "./LegalDocuments";
import { Process } from "./Process";

@Entity()
export class Car {
  // Mã xe
  @PrimaryGeneratedColumn("uuid")
  car_id!: string;

  // Tên xe
  @Column({ nullable: true })
  name!: string;

  // Mô tả
  @Column({ nullable: true })
  description!: string;

  // Xuất xứ
  @Column({ nullable: true })
  origin!: string;

  // Giá
  @Column({ nullable: true, type: "float" })
  @Check(`"price" >= 0`)
  price!: number;

  // Hãng xe
  @Column({ nullable: true })
  brand!: string;

  // Mẫu mã xe
  @Column({ nullable: true })
  model!: string;

  // Dòng xe
  @Column({ nullable: true })
  type!: string;

  // Dung tích xe
  @Column({ nullable: true, type: "float" })
  capacity!: number;

  // Số cửa
  @Column({ nullable: true })
  door!: number;

  // Số ghế ngồi
  @Column({ nullable: true })
  seat!: number;

  // Số km đã đi
  @Column({ nullable: true, type: "float" })
  kilometer!: number;

  // Hộp số
  @Column({ nullable: true })
  gear!: string;

  // Năm sản xuất
  @Column({ type: "timestamptz", nullable: true })
  mfg!: Date;

  // Màu nội thất
  @Column({ nullable: true })
  inColor!: string;

  // Màu ngoại thất
  @Column({ nullable: true })
  outColor!: string;

  // Ảnh
  @Column({ type: "text", array: true, nullable: true })
  image!: string[];

  @Column({default: 1})
  available!: number;

  @ManyToOne(() => Salon, (salon) => salon.cars)
  salon!: Salon;

  @ManyToOne(() => Warranty, (warranty) => warranty.car, {
    onDelete: "SET NULL",
  })
  warranties!: Warranty;

  @ManyToOne(() => Process, (process) => process.cars, {
    onDelete: "SET NULL",
  })
  process!: Process;

  @Column({default: 0})
  number_of_period!: number;

  @Column({default: 0})
  user_legals_period!: number;

  init(
    name: string,
    description: string,
    origin: string,
    price: number,
    brand: string,
    model: string,
    type: string,
    capacity: number,
    door: number,
    seat: number,
    kilometer: number,
    gear: string,
    mfg: Date,
    inColor: string,
    outColor: string,
    image: string[],
    salon: Salon,
    available: number,
    number_of_period: number,
    user_legals_period: number
  ) {
    this.name = name;
    this.description = description;
    this.origin = origin;
    this.price = price;
    this.brand = brand;
    this.model = model;
    this.type = type;
    this.capacity = capacity;
    this.door = door;
    this.seat = seat;
    this.kilometer = kilometer;
    this.gear = gear;
    this.mfg = mfg;
    this.inColor = inColor;
    this.outColor = outColor;
    this.image = image;
    this.salon = salon;
    this.available = available;
    this.number_of_period = number_of_period;
    this.user_legals_period = user_legals_period;
  }
}
