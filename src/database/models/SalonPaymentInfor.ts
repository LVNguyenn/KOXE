import {
    Entity,
    Column,
    ManyToOne,
    PrimaryGeneratedColumn,
  } from "typeorm";
  import { Salon } from "./Salon";
  @Entity()
  export class SalonPaymentInfor {
    @PrimaryGeneratedColumn("uuid")
    id!: string;
  
    @Column()
    type!: string;
  
    @Column()
    content!: string;

    @Column()
    fullname!: string;

    @ManyToOne(() => Salon, (salon) => salon.method_payment, {
        onDelete: "CASCADE",
      })
    salon!: Salon;
  
    init(id: string, type: string, content: string, fullname: string) {
      this.id = id;
      this.type = type;
      this.content = content;
      this.fullname = fullname;
    }
  }
  