import { Body, Controller, Get, Patch, Post, Query, Req, Res, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { InvitationService } from './invitation.service';
import { ApiBadRequestResponse, ApiBasicAuth, ApiBody, ApiCreatedResponse, ApiForbiddenResponse } from '@nestjs/swagger';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { Request, Response } from 'express';
import { JwtAuthGuard } from 'src/common/guards/keycloak.guard';
import { UpdateInvitationDto } from './dto/update-invitation.dto';

@Controller('invitation')
@UseGuards(JwtAuthGuard)
export class InvitationController {
  constructor(
    private invitationService: InvitationService,
  ) { }
  @Post("/sendinvite")
  @ApiBody({ type: CreateInvitationDto })
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiCreatedResponse({ description: "Invite Send Successfully" })
  @ApiForbiddenResponse({ description: "Forbidden" })
  @ApiBadRequestResponse({ description: "Bad request." })

  public async sendInvite(
    @Req() request: Request,
    @Res() response: Response,
    @Body() createInvitationDto: CreateInvitationDto,
  ) {
    return await this.invitationService.sendInvite(request, createInvitationDto, response);
  }

  @Get("/getall")
  @ApiBasicAuth("access-token")
  @UsePipes(new ValidationPipe())
  public async getInvitations(
    @Req() request: Request,
    @Res() response: Response
  ) {
    return await this.invitationService.getInvitations(request, response);
  }

  @Patch("/update")
  @ApiBasicAuth("access-token")
  @ApiBody({ type: UpdateInvitationDto })
  @ApiForbiddenResponse({ description: "Only invitees can update status" })
  @UsePipes(new ValidationPipe())
  public async updateInvitation(
    @Req() request: Request,
    @Res() response: Response,
    @Body() updateInvitationDto: UpdateInvitationDto,
    @Query("id") id: string
  ) {
    const invitationId = id;
    return await this.invitationService.updateInvitation(
      request,
      response,
      invitationId,
      updateInvitationDto
    );
  }

}