import { Body, Controller, Post, Req, Res, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { InvitationService } from './invitation.service';
import { ApiBadRequestResponse, ApiBody, ApiCreatedResponse, ApiForbiddenResponse } from '@nestjs/swagger';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { Request, Response } from 'express';
import { JwtAuthGuard } from 'src/common/guards/keycloak.guard';

@Controller('invitation')
@UseGuards(JwtAuthGuard)
export class InvitationController {
    constructor (
        private invitationService: InvitationService,
    ) {}
    @Post("/sendinvite")
    @ApiBody({type :CreateInvitationDto})
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

}
