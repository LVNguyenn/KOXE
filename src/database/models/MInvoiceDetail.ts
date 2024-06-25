import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity()
export class MInvoiceDetail {
  @PrimaryColumn()
  invoice_id!: string;

  @PrimaryColumn()
  maintenance_id!: string;

  @Column({ nullable: true })
  quantity!: number;

  @Column({ nullable: true, type: "float" })
  price!: number;

  init(maintenance_id: string, quantity: number) {
    this.maintenance_id = maintenance_id;
    this.quantity = quantity;
  }
}
