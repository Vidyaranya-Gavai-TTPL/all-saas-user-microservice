import {
  ApiTags,
  ApiBody,
  ApiForbiddenResponse,
  ApiHeader,
  ApiBasicAuth,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
} from "@nestjs/swagger";
import {
  Controller,
  Get,
  Post,
  Body,
  SerializeOptions,
  Req,
  Res,
  HttpStatus,
  HttpCode,
  UsePipes,
  ValidationPipe,
  UseGuards,
  UseFilters,
} from "@nestjs/common";
import {
  AuthDto,
  RefreshTokenRequestBody,
  LogoutRequestBody,
} from "./dto/auth-dto";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "src/common/guards/keycloak.guard";
import { APIID } from "src/common/utils/api-id.config";
import { AllExceptionsFilter } from "src/common/filters/exception.filter";
import { Request, Response } from "express";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseFilters(new AllExceptionsFilter(APIID.LOGIN))
  @Post("/login")
  @ApiBody({ type: AuthDto })
  @UsePipes(ValidationPipe)
  @HttpCode(HttpStatus.OK)
  @ApiForbiddenResponse({ description: "Forbidden" })
  public async login(@Body() authDto: AuthDto, @Res() response: Response) {
    return this.authService.login(authDto,response);
  }

  @Post('/validateAndRegister')
  @UseGuards(JwtAuthGuard)
  @ApiBasicAuth("access-token")
  @ApiOperation({ summary: 'validate And Register with Google' })
  @ApiResponse({ status: 200, description: 'User Validated successfully' })
  @ApiResponse({ status: 201, description: 'User Registered successfully' })
  async validateAndRegister(
    @Req() request: Request,
    @Res() response: Response
  ) {
    return this.authService.validateAndRegister(request, response);
  }
  
  @UseFilters(new AllExceptionsFilter(APIID.USER_AUTH))
  @Get("/")
  @UseGuards(JwtAuthGuard)
  @ApiBasicAuth("access-token")
  @ApiOkResponse({ description: "User detail." })
  @ApiForbiddenResponse({ description: "Forbidden" })
  @SerializeOptions({
    strategy: "excludeAll",
  })
  public async getUserByAuth(@Req() request, @Res() response: Response) {
    let tenantId = request?.headers["tenantid"];
    return this.authService.getUserByAuth(request, tenantId,response);
  }

  @UseFilters(new AllExceptionsFilter(APIID.REFRESH))
  @Post("/refresh")
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: RefreshTokenRequestBody })
  @UsePipes(ValidationPipe)
  refreshToken(@Body() body: RefreshTokenRequestBody, @Res() response: Response) {
    const { refresh_token: refreshToken } = body;

    return this.authService.refreshToken(refreshToken,response);
  }

  @UseFilters(new AllExceptionsFilter(APIID.LOGOUT))
  @Post("/logout")
  @UsePipes(ValidationPipe)
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: LogoutRequestBody })
  async logout(@Body() body: LogoutRequestBody, @Res() response: Response) {
    const { refresh_token: refreshToken } = body;

    await this.authService.logout(refreshToken,response);
  }
}
