import {
  Entity,
  Column,
  Unique,
  PrimaryColumn,
  OneToMany,
  ManyToOne,
  Check,
} from "typeorm";
import { Length } from "class-validator";
import { Purchase } from "./Purchase";
import { Salon } from "./Salon";
import { Connection } from "./Connection";
import { Transaction } from "./Transaction";
import { Post } from "./Post";
import { GroupSalon } from "./GroupSalon";

@Entity()
@Unique(["username", "email", "phone"])
export class User {
  @PrimaryColumn()
  @Length(1, 20)
  user_id!: string;

  @Column({ nullable: true })
  @Length(1, 20)
  username!: string;

  @Column({ nullable: true })
  @Length(1, 100)
  password!: string;

  @Column({ nullable: true })
  @Length(0, 50)
  fullname!: string;

  @Column({ nullable: true })
  @Length(0, 10)
  gender!: string;

  @Column({ nullable: true })
  @Length(0, 10)
  phone!: string;

  @Column({ nullable: true })
  @Length(6, 50)
  email!: string;

  @Column({ nullable: true })
  @Length(0, 200)
  address!: string;

  @Column({ type: "timestamptz", nullable: true })
  date_of_birth!: Date;

  @Column({ nullable: true })
  @Length(0, 200)
  avatar!: string;

  @Column({ default: "user", nullable: true })
  @Length(0, 10)
  role!: string;

  @Column({ nullable: true })
  @Length(0, 200)
  facebook!: string;

  @Column({ nullable: true })
  @Length(0, 200)
  google!: string;

  @Column({ nullable: true, default: 0 })
  aso!: number;

  @Column({ nullable: true })
  androidFcmToken!: string;

  @Column("simple-array", { nullable: true })
  permissions!: string[];

  @ManyToOne(() => Salon, (salon) => salon.employees)
  salonId!: Salon;

  @OneToMany(() => Purchase, (purchase) => purchase.user)
  packages!: Purchase[];

  @OneToMany(() => Post, (post) => post.postedBy)
  posts!: Post[];

  @OneToMany(() => Connection, (connection) => connection.user)
  connections!: Connection[];

  @OneToMany(() => Transaction, (transaction) => transaction.user)
  transactions!: Transaction[];

  @Column({ nullable: true, type: "float", default: 0.0 })
  @Check(`"avgRating" >= 0`)
  avgRating!: number;

  @Column({ nullable: true, default: 0 })
  completedTransactions!: number;

  @Column({ default: false })
  blocked!: boolean;

  @OneToMany(() => GroupSalon, (groupSalon) => groupSalon.user)
  groupSalons!: GroupSalon[];

  init(
    user_id: string,
    username: string,
    password: string,
    fullname: string,
    gender: string,
    phone: string,
    email: string,
    address: string,
    date_of_birth: Date,
    avatar: string,
    role: string,
    facebook: string,
    google: string,
    aso: number,
    permissions: string[]
  ) {
    this.user_id = user_id;
    this.username = username;
    this.password = password;
    this.fullname = fullname;
    this.gender = gender;
    this.phone = phone;
    this.email = email;
    this.address = address;
    this.date_of_birth = date_of_birth;
    this.avatar = avatar;
    this.role = role;
    this.facebook = facebook;
    this.google = google;
    this.aso = aso;
    this.permissions = permissions;
  }
}
