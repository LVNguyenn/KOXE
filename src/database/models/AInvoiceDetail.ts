import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity()
export class AInvoiceDetail {
  @PrimaryColumn()
  invoice_id!: string;

  @PrimaryColumn()
  accessory_id!: string;

  @Column({ nullable: true })
  quantity!: number;

  @Column({ nullable: true, type: "float" })
  price!: number;

  init(accessory_id: string, quantity: number) {
    this.accessory_id = accessory_id;
    this.quantity = quantity;
  }
}
