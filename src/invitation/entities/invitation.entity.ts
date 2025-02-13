import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Timestamp,
  UpdateDateColumn,
} from "typeorm";

@Entity("Invitations")
export class Invitations {
  @PrimaryGeneratedColumn("uuid")
  invitationId: string;

  @Column()
  tenantId: string;

  @Column()
  cohortId: string;

  @Column()
  invitedTo: string;

  @Column()
  invitedBy: string;

  @Column({
    type: "enum",
    enum: ["Pending", "Accepted", "Rejected", "Revoked"],
    default: "Pending",
  })
  invitationStatus: "Pending" | "Accepted" | "Rejected" | "Revoked";

  @CreateDateColumn({
    type: "timestamp with time zone",
    default: () => "CURRENT_TIMESTAMP",
  })
  sentAt: Date;

  @UpdateDateColumn({
    type: "timestamp with time zone",
    default: () => "CURRENT_TIMESTAMP",
  })
  updatedAt: Date;
}
