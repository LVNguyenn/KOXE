import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  Check,
} from "typeorm";
import { User } from "./User";
import { Connection } from "./Connection";

@Entity()
export class Post {
  @PrimaryGeneratedColumn("uuid")
  post_id!: string;

  @Column({ nullable: true })
  title!: string;

  @Column({ nullable: true, length: 500 })
  text!: string;

  @ManyToOne(() => User, (user) => user.user_id)
  postedBy!: User;

  @Column("simple-array", { nullable: true, default: "All" })
  salons!: string[];

  @Column({ type: "text", array: true, nullable: true })
  image!: string[];

  @OneToMany(() => Connection, (connection) => connection.post)
  connections!: Connection[];

  @Column({
    type: "timestamptz",
    default: () => "timezone('Asia/Saigon', now())",
  })
  createdAt!: Date;

  // Hãng xe
  @Column({ nullable: true })
  brand!: string;

  // Dòng xe
  @Column({ nullable: true })
  type!: string;

  // Năm sản xuất
  @Column({ nullable: true })
  mfg!: string;

  // Phiên bản
  @Column({ nullable: true })
  version!: string;

  // Hộp số
  @Column({ nullable: true })
  gear!: string;

  // Nhiên liệu
  @Column({ nullable: true })
  fuel!: string;

  // Xuất xứ
  @Column({ nullable: true })
  origin!: string;

  // Kiểu dáng
  @Column({ nullable: true })
  design!: string;

  // Số ghế ngồi
  @Column({ nullable: true })
  seat!: number;

  // Màu sắc
  @Column({ nullable: true })
  color!: string;

  // Biển số xe
  @Column({ nullable: true })
  licensePlate!: string;

  // Số đời chủ
  @Column({ nullable: true })
  ownerNumber!: number;

  // Phụ kiện đi kèm
  @Column({ nullable: true })
  accessory!: boolean;

  // Hạn đăng kiểm
  @Column({ nullable: true })
  registrationDeadline!: boolean;

  // Số km đã đi
  @Column({ nullable: true, type: "float" })
  kilometer!: number;

  // Giá
  @Column({ nullable: true, type: "float" })
  @Check(`"price" >= 0`)
  price!: number;

  // Địa chỉ hoa tiêu
  @Column({ nullable: true })
  address!: string;

  init(text: string, postedBy: User, createdAt: Date) {
    this.text = text;
    this.postedBy = postedBy;
    this.createdAt = createdAt;
  }
}
