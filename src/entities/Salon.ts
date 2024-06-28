import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";
import { Car } from "./Car"; // Import entities Car
import { Maintenance } from "./Maintenance";
import { Invoice } from "./Invoice";
import { Warranty } from "./Warranty";
import { Accessory } from "./Accessory";
import { LegalDocuments } from "./LegalDocuments";
import { Connection } from "./Connection";
import { Transaction } from "./Transaction";
import { Process } from "./Process";
import { Stage } from "./Stage";
import { Promotion } from "./Promotion";
import { Role } from "./Role";
import { SalonPayment } from "./SalonPayment";

@Entity()
export class Salon {
  @PrimaryGeneratedColumn("uuid")
  salon_id!: string;

  @Column({ nullable: true })
  name!: string;

  @Column({ nullable: true })
  address!: string;

  @Column({ nullable: true })
  image!: string;

  @Column({ nullable: true })
  email!: string;

  @Column({ nullable: true })
  phoneNumber!: string;

  @Column({ type: "text", array: true, nullable: true })
  banner!: string[];

  @Column({ nullable: true })
  introductionHtml!: string;

  @Column({ nullable: true })
  introductionMarkdown!: string;

  @Column({ nullable: true })
  user_id!: string;

  @OneToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user!: User;

  @OneToMany(() => User, (users) => users.salonId)
  employees!: User[];

  @OneToMany(() => Car, (car) => car.salon)
  cars!: Car[];

  @OneToMany(() => Invoice, (invoice) => invoice.seller)
  invoices!: Invoice[];

  @OneToMany(() => Warranty, (warranty) => warranty.warranty_id)
  warranties!: Warranty[];

  //
  @OneToMany(() => Maintenance, (service) => service.salon)
  services!: Maintenance[];

  @OneToMany(() => Accessory, (accessory) => accessory.salon)
  accessories!: Accessory[];

  @OneToMany(() => Connection, (connection) => connection.user)
  connections!: Connection[];

  @OneToMany(() => Process, (process) => process.salon)
  process!: Process[];

  @OneToMany(() => Transaction, (transaction) => transaction.user)
  transactions!: Transaction[];

  @OneToMany(() => Stage, (stage) => stage.salon)
  stages!: Stage[];

  @Column("simple-array", { nullable: true })
  blockUsers!: string[];

  @OneToMany(() => Promotion, (promotion) => promotion.salon)
  promotions!: Promotion[];

  @OneToMany(() => Role, (role) => role.salon)
  roles!: Role[];

  @OneToMany(() => SalonPayment, (pay) => pay.salon)
  pays!: SalonPayment[];

  init(
    name: string,
    address: string,
    image: string,
    email: string,
    phoneNumber: string,
    banner: string[],
    introductionHtml: string,
    introductionMarkdown: string,
    user_id: string,
    cars: Car[],
    services: Maintenance[]
  ) {
    this.name = name;
    this.address = address;
    this.image = image;
    this.email = email;
    this.phoneNumber = phoneNumber;
    this.banner = banner;
    this.introductionHtml = introductionHtml;
    this.introductionMarkdown = introductionMarkdown;
    this.user_id = user_id;
    this.cars = cars;
    this.services = services;
  }
}
