import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { Query as ExpressQuery } from 'express-serve-static-core';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RolesGuard } from '../guards/roles.guards';
import { User } from '../auth/schemas/user.schema';
import { CreateRestaurantDto } from './dtos/create-restaurant.dto';
import { UpdateRestaurantDto } from './dtos/update-restaurant.dto';
import { RestaurantsService } from './restaurants.service';
import { Restaurant } from './schemas/restaurant.schema';
import { Roles } from '../auth/decorators/roles.decorator';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { editFileName, imageFileFilter } from '../utils/api.utils';

@Controller('restaurants')
export class RestaurantsController {
  constructor(private restaurantsService: RestaurantsService) {}

  @Get()
  @UseGuards(AuthGuard())
  async findAll(@Query() query: ExpressQuery): Promise<Restaurant[]> {
    const res = await this.restaurantsService.findAll(query);
    return res;
  }

  @Get(':id')
  async show(@Param('id') id: string): Promise<Restaurant> {
    const res = await this.restaurantsService.findById(id);
    return res;
  }

  @Post()
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles('admin', 'user')
  async create(
    @Body() restaurant: CreateRestaurantDto,
    @CurrentUser() user: User,
  ): Promise<Restaurant> {
    const res = await this.restaurantsService.create(restaurant, user);
    return res;
  }

  @Put(':id')
  @UseGuards(AuthGuard())
  async update(
    @Param('id') id: string,
    @Body() restaurant: UpdateRestaurantDto,
    @CurrentUser() user: User,
  ): Promise<Restaurant> {
    const res = await this.restaurantsService.update(id, restaurant, user);
    return res;
  }

  @Delete(':id')
  @UseGuards(AuthGuard())
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<boolean> {
    const res = await this.restaurantsService.delete(id, user);
    return res ? true : false;
  }

  @Put('upload/:id')
  @UseGuards(AuthGuard())
  @UseInterceptors(
    FilesInterceptor('image', 5, {
      storage: diskStorage({
        destination: './upload',
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    }),
  )
  async uploadMultipleFiles(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: User,
  ): Promise<string[]> {
    const res = await this.restaurantsService.uploadImages(id, files, user);
    return res;
  }

  @Delete(':id/remove/images')
  @UseGuards(AuthGuard())
  async deleteMultipleFiles(
    @Param('id') id: string,
    @Body() files: string[],
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    return await this.restaurantsService.deleteImages(id, files, user);
  }
}
