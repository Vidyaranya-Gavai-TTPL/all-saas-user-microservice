import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import jwt_decode from "jwt-decode";
import APIResponse from "src/common/responses/response";
import { PostgresAssignPrivilegeService } from 'src/adapters/postgres/rbac/privilegerole.adapter';
import { PostgresRoleService } from 'src/adapters/postgres/rbac/role-adapter';
import { PostgresUserService } from 'src/adapters/postgres/user-adapter';
import { Cohort } from 'src/cohort/entities/cohort.entity';
import { UserRoleMapping } from 'src/rbac/assign-role/entities/assign-role.entity';
import { User } from 'src/user/entities/user-entity';
import { Tenants } from 'src/userTenantMapping/entities/tenant.entity';
import { UserTenantMapping } from 'src/userTenantMapping/entities/user-tenant-mapping.entity';
import { Repository } from 'typeorm';
import { API_RESPONSES } from '@utils/response.messages';
import { Invitations } from './entities/invitation.entity';
import { CohortMembers } from 'src/cohortMembers/entities/cohort-member.entity';
import { APIID } from '@utils/api-id.config';
@Injectable()
export class InvitationService {
  constructor(
    @InjectRepository(UserTenantMapping)
    private UserTenantMappingRepository: Repository<UserTenantMapping>,
    @InjectRepository(Invitations)
    public invitationsRepository: Repository<Invitations>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(CohortMembers)
    private cohortMembersRepository: Repository<CohortMembers>,
    @InjectRepository(Cohort)
    private cohortRepository: Repository<Cohort>,
    private readonly userService: PostgresUserService,
    private roleService: PostgresRoleService,
    private rolePrivilegeService: PostgresAssignPrivilegeService,
  ) {}
  public async sendInvite(request, createInvitationDto, response) {
    const apiId =APIID.SEND_INVITATION
    try {
      const decoded = jwt_decode(request.headers["authorization"]);
      createInvitationDto.invitedBy = decoded["email"];

      // Check if the tenant-cohort mapping exists
      const tenantCohortExist = await this.cohortRepository.findOne({
        where: {
          tenantId: createInvitationDto.tenantId,
          cohortId: createInvitationDto.cohortId,
        },
      });

      if (!tenantCohortExist) {
        return APIResponse.error(
          response,
          apiId,
          API_RESPONSES.CONFLICT,
          "Tenant and cohort mapping not found",
          HttpStatus.CONFLICT
        );
      }
      // check if duplicate request exist with status pending
      const checkInvitaionExist = await this.invitationsRepository.findOne({
        where: {
          tenantId: createInvitationDto.tenantId,
          cohortId: createInvitationDto.cohortId,
          invitedTo: createInvitationDto.invitedTo,
          invitationStatus: "Pending"
        },
      })
      if (checkInvitaionExist) {
        return APIResponse.error(
          response,
          apiId,
          API_RESPONSES.CONFLICT,
          "Invitation already sent",
          HttpStatus.CONFLICT
        );
      }

      // Check if the user exists
      const checkUser = await this.usersRepository.findOne({
        where: { email: createInvitationDto.invitedTo },
      });

      if (!checkUser) {
        const result = await this.invitationsRepository.save(
          createInvitationDto
        );
        return APIResponse.success(
          response,
          apiId,
          result,
          HttpStatus.OK,
          API_RESPONSES.INVITATION_SUCCESS
        );
      }

      // Fetch user roles
      const userRoles = await this.userService.getUserRoles(checkUser.userId,createInvitationDto.tenantId);

      if (!userRoles) {
        const result = await this.invitationsRepository.save(
          createInvitationDto
        );
        return APIResponse.success(
          response,
          apiId,
          result,
          HttpStatus.OK,
          API_RESPONSES.INVITATION_SUCCESS
        );
      }

      // Handle different user roles
      if (userRoles.code === "tenant_admin") {
        return APIResponse.error(
          response,
          apiId,
          API_RESPONSES.CONFLICT,
          API_RESPONSES.INVITEDUSER_CONFLICT('tenant admin'),
          HttpStatus.CONFLICT
        );
      }

      if (userRoles.code === "cohort_admin") {
        // Check if the user is already mapped to the cohort
        const cohortExists = await this.cohortMembersRepository.findOne({
          where: {
            userId: checkUser.userId,
            cohortId: createInvitationDto.cohortId,
          },
        });

        if (cohortExists) {
          return APIResponse.error(
            response,
            apiId,
            API_RESPONSES.CONFLICT,
            API_RESPONSES.INVITEDUSER_CONFLICT('cohort admin'),
            HttpStatus.CONFLICT
          );
        }
      }

      // Save invitation if no conflicts
      const result = await this.invitationsRepository.save(createInvitationDto);
      return APIResponse.success(
        response,
        apiId,
        result,
        HttpStatus.OK,
        API_RESPONSES.INVITATION_SUCCESS
      );
    } catch (error) {
      return APIResponse.error(
        response,
        apiId,
        API_RESPONSES.INTERNAL_SERVER_ERROR,
        error,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
