import { Module } from '@nestjs/common';
import { InvitationController } from './invitation.controller';
import { InvitationService } from './invitation.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostgresModule } from 'src/adapters/postgres/postgres-module';
import { RolePrivilegeMapping } from 'src/rbac/assign-privilege/entities/assign-privilege.entity';
import { UserRoleMapping } from 'src/rbac/assign-role/entities/assign-role.entity';
import { Role } from 'src/rbac/role/entities/role.entity';
import { UserTenantMapping } from 'src/userTenantMapping/entities/user-tenant-mapping.entity';
import { User } from 'src/user/entities/user-entity'
import { Cohort } from 'src/cohort/entities/cohort.entity';
import { Tenants } from 'src/userTenantMapping/entities/tenant.entity';
import { Invitations } from './entities/invitation.entity';
import { PostgresRoleService } from 'src/adapters/postgres/rbac/role-adapter';
import { PostgresAssignPrivilegeService } from 'src/adapters/postgres/rbac/privilegerole.adapter';
import { CohortMembers } from 'src/cohortMembers/entities/cohort-member.entity';
import { PostgresUserService } from 'src/adapters/postgres/user-adapter';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invitations,UserRoleMapping,UserTenantMapping,Role,RolePrivilegeMapping,User,Cohort,Tenants,CohortMembers]),
    PostgresModule
  ],
  controllers: [InvitationController],
  providers: [InvitationService,PostgresRoleService,PostgresAssignPrivilegeService]
})
export class InvitationModule {}
