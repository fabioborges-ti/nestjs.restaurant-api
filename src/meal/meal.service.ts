import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { User } from '../auth/schemas/user.schema';
import { Restaurant } from '../restaurants/schemas/restaurant.schema';
import { Meal } from './schemas/meal.schema';

@Injectable()
export class MealService {
  constructor(
    @InjectModel(Meal.name)
    private mealModel: mongoose.Model<Meal>,
    @InjectModel(Restaurant.name)
    private restaurantModel: mongoose.Model<Restaurant>,
  ) {}

  async list(): Promise<Meal[]> {
    return await this.mealModel.find();
  }

  async listByRestaurant(id: string): Promise<Meal[]> {
    const isValidId = mongoose.isValidObjectId(id);
    if (!isValidId) {
      throw new BadRequestException('Wrong mongoose ID error');
    }

    return await this.mealModel.find({ restaurant: id });
  }

  async show(id: string): Promise<Meal> {
    const isValidId = mongoose.isValidObjectId(id);
    if (!isValidId) {
      throw new BadRequestException('Wrong mongoose ID error');
    }

    const meal = await this.mealModel.findById(id);
    if (!meal) {
      throw new NotFoundException('Meal not found');
    }

    return meal;
  }

  async create(data: Meal, user: User): Promise<Meal> {
    const meal = Object.assign(data, { user: user._id });

    const restaurant = await this.restaurantModel.findById(meal.restaurant);
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found with this ID');
    }

    if (user._id.toString() !== restaurant.user.toString()) {
      throw new ForbiddenException('You cannot add meal to this restaurant ');
    }

    const res = await this.mealModel.create(meal);
    restaurant.menu.push(res);

    await restaurant.save();
    return res;
  }

  async update(id: string, data: Meal, user: User): Promise<Meal> {
    const meal = await this.mealModel.findById(id);
    if (!meal) {
      throw new NotFoundException('Meal not found');
    }

    if (user._id.toString() !== meal.user._id.toString()) {
      throw new ForbiddenException('You cannot update this meal');
    }

    return await this.mealModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  }

  async delete(id: string, user: User): Promise<boolean> {
    const meal = await this.mealModel.findById(id);
    if (!meal) {
      throw new NotFoundException('Meal not found');
    }

    if (user._id.toString() !== meal.user._id.toString()) {
      throw new ForbiddenException('You cannot update this meal');
    }

    const res = await this.mealModel.findByIdAndDelete(id);
    return res ? true : false;
  }
}
