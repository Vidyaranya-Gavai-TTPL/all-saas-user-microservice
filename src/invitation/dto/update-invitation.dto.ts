import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { IsEnum, IsOptional } from "class-validator";

export class UpdateInvitationDto {
  @ApiProperty({ type: String, description: "Status of invitation" })
  @IsOptional()
  @IsEnum(["Pending", "Accepted", "Rejected", "Revoked"])
  @Expose()
  invitationStatus: "Pending" | "Accepted" | "Rejected" | "Revoked";
}
