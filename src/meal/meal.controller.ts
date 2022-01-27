import {
  Body,
  Controller,
  Post,
  UseGuards,
  Get,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../auth/schemas/user.schema';
import { CreateMealDto } from './dtos/create-meal.dto';
import { UpdateMealDto } from './dtos/update-meal.dto';
import { MealService } from './meal.service';
import { Meal } from './schemas/meal.schema';

@Controller('meals')
export class MealController {
  constructor(private mealService: MealService) {}

  @Get()
  async list(): Promise<Meal[]> {
    return await this.mealService.list();
  }

  @Get('restaurant/:id')
  async listByRestaurant(@Param('id') id: string): Promise<Meal[]> {
    return await this.mealService.listByRestaurant(id);
  }

  @Get(':id')
  async show(@Param('id') id: string): Promise<Meal> {
    return await this.mealService.show(id);
  }

  @Post()
  @UseGuards(AuthGuard())
  async create(
    @Body() createMealDto: CreateMealDto,
    @CurrentUser() user: User,
  ): Promise<Meal> {
    return this.mealService.create(createMealDto, user);
  }

  @Put(':id')
  @UseGuards(AuthGuard())
  async update(
    @Body() updateMealDto: UpdateMealDto,
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<Meal> {
    return this.mealService.update(id, updateMealDto, user);
  }

  @Delete(':id')
  @UseGuards(AuthGuard())
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<boolean> {
    return this.mealService.delete(id, user);
  }
}
