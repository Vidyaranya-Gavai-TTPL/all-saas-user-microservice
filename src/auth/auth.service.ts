import { HttpStatus, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { UserAdapter } from "src/user/useradapter";
import axios from "axios";
import jwt_decode from "jwt-decode";
import APIResponse from "src/common/responses/response";
import { KeycloakService } from "src/common/utils/keycloak.service";
import { APIID } from "src/common/utils/api-id.config";
import { User } from "src/user/entities/user-entity";
import { Request, Response } from "express";
import { UserCreateDto } from "src/user/dto/user-create.dto";
import { PostgresUserService } from "src/adapters/postgres/user-adapter";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";


type LoginResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
};
@Injectable()
export class AuthService {

  constructor(
    private readonly useradapter: UserAdapter,
    private readonly keycloakService: KeycloakService,
    private userService : PostgresUserService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) { }

  async validateAndRegister(request :Request,response: Response) {
    const decoded :any = jwt_decode(request.headers.authorization);
    const userCreateDto = new UserCreateDto({
      userId: decoded.sub,
      username: decoded.email,
      email: decoded.email,
      name: decoded.name,
      tenantCohortRoleMapping: [],
      customFields: [],
      createdBy: decoded.sub,
      updatedBy: decoded.sub,
    });
    try {
      const checkUserinDb = await this.userRepository.find({
        where: [
          { username: decoded.email,userId: decoded.sub  },
        ],
      })
      if(checkUserinDb.length>0) {
        return APIResponse.success(
          response,
          APIID.GOOGLE_SIGNIN,
          'User validated successfully',
          HttpStatus.OK,
          'User validated successfully'
        );
      }
      else {
        const createUserDB = await this.userService.createUserInDatabase(request, userCreateDto, response);
        return APIResponse.success(
          response,
          APIID.GOOGLE_SIGNUP,
          createUserDB,
          HttpStatus.CREATED,
          'User Registered successfully'
        );
      }
      
    } catch (error) {
      return APIResponse.error(
        response,
        APIID.GOOGLE_SIGNIN,
        'INTERNAL_SERVER_ERROR',
        error.message || 'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async login(authDto,response: Response) {
    const apiId = APIID.LOGIN;
    const { username, password } = authDto;
    try {
      const {
        access_token,
        expires_in,
        refresh_token,
        refresh_expires_in,
        token_type
      } = await this.keycloakService.login(username, password);
      
      const res = {
        access_token,
        refresh_token,
        expires_in,
        refresh_expires_in,
        token_type
      };

      return APIResponse.success(response, apiId, res,
        HttpStatus.OK, "Auth Token fetched Successfully.")
    } catch (error) {
      if (error.response && error.response.status === 401) {
        throw new NotFoundException("Invalid username or password");
      } else {
        const errorMessage = error?.message || 'Something went wrong';
        return APIResponse.error(response, apiId, "Internal Server Error", `Error : ${errorMessage}`, HttpStatus.INTERNAL_SERVER_ERROR)
      }
    }
  }
  


  public async getUserByAuth(request: any, tenantId,response:Response) {
    let apiId = APIID.USER_AUTH;
    try {
      const decoded: any = jwt_decode(request.headers.authorization);
      const username = decoded.preferred_username;
      const data = await this.useradapter.buildUserAdapter().findUserDetails(null, username,tenantId); 

      return APIResponse.success(response, apiId, data,
        HttpStatus.OK, "User fetched by auth token Successfully.")
    } catch (e) {
        const errorMessage = e?.message || 'Something went wrong';
        return APIResponse.error(response, apiId, "Internal Server Error", `Error : ${errorMessage}`, HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  async refreshToken(refreshToken: string, response: Response): Promise<LoginResponse> {
    const apiId = APIID.REFRESH;
    const { access_token, expires_in, refresh_token, refresh_expires_in } =
      await this.keycloakService.refreshToken(refreshToken).catch(() => {
        throw new UnauthorizedException();
      });

    const res = {
      access_token,
      refresh_token,
      expires_in,
      refresh_expires_in,
    };
    return APIResponse.success(response, apiId, res,
      HttpStatus.OK, "Refresh Token fetched Successfully.")
  }

  async logout(refreshToken: string, response: Response) {
    const apiId = APIID.LOGOUT;
    try {
      const logout = await this.keycloakService.logout(refreshToken);
      return APIResponse.success(response, apiId, logout,
        HttpStatus.OK, "Logged Out Successfully.")
    } catch (error) {
      if (error.response && error.response.status === 400) {
        throw new UnauthorizedException();
      } else {
        const errorMessage = error?.message || 'Something went wrong';
        return APIResponse.error(response, apiId, "Internal Server Error", `Error : ${errorMessage}`, HttpStatus.INTERNAL_SERVER_ERROR)
      }
    }
  }
}
