import { Expose } from 'class-transformer';
import { IsUUID, IsEmail, IsNotEmpty, isNotEmpty, IsDefined, IsOptional } from 'class-validator';

export class CreateInvitationDto {
  @IsUUID()
  @IsNotEmpty({message : "tenantId is required"})
  @Expose()
  tenantId: string;

  @IsUUID()
  @IsNotEmpty({message : "cohortId is required"})
  @Expose()
  cohortId: string;

  @IsEmail()
  @IsNotEmpty()
  invitedTo: string;

  @IsEmail()
  @IsOptional()
  invitedBy: string;

}
