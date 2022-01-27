import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Query } from 'express-serve-static-core';
import * as mongoose from 'mongoose';
import { User } from '../auth/schemas/user.schema';
import { Restaurant } from './schemas/restaurant.schema';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class RestaurantsService {
  constructor(
    @InjectModel(Restaurant.name)
    private restaurantModel: mongoose.Model<Restaurant>,
  ) {}

  async findAll(query: Query): Promise<Restaurant[]> {
    const pagesize = Number(process.env.DB_PAGESIZE);
    const current_page = Number(query.page) || 1;
    const skip = pagesize * (current_page - 1);

    const keyword = query.keyword
      ? {
          name: {
            $regex: query.keyword,
            $options: 'i',
          },
        }
      : {};
    const res = await this.restaurantModel
      .find({ ...keyword })
      .limit(pagesize)
      .skip(skip);
    return res;
  }

  async findById(id: string): Promise<Restaurant> {
    const isValidId = mongoose.isValidObjectId(id);
    if (!isValidId) throw new BadRequestException('Please enter correct ID');
    const res = await this.restaurantModel.findById(id);
    if (!res) throw new NotFoundException('Restaurant not found');
    return res;
  }

  async create(restaurant: Restaurant, user: User): Promise<Restaurant> {
    const data = Object.assign(restaurant, { user: user._id });
    const res = await this.restaurantModel.create(data);
    return res;
  }

  async update(
    id: string,
    restaurant: Restaurant,
    user: User,
  ): Promise<Restaurant> {
    const isValidId = mongoose.isValidObjectId(id);
    if (!isValidId) throw new BadRequestException('Please enter correct ID ');

    const res = await this.restaurantModel.findById(id);
    if (!res) {
      throw new NotFoundException('Restaurant not found');
    }

    if (user._id.toString() !== res.user._id.toString()) {
      throw new ForbiddenException('You cannot update this restaurant');
    }

    const data = Object.assign(restaurant, { user: user._id });
    return await this.restaurantModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  }

  async delete(id: string, user: User): Promise<Restaurant> {
    const isValidId = mongoose.isValidObjectId(id);
    if (!isValidId) throw new BadRequestException('Please enter correct ID ');

    const res = await this.restaurantModel.findById(id);
    if (!res) {
      throw new NotFoundException('Restaurant not found');
    }

    if (user._id.toString() !== res.user._id.toString()) {
      throw new ForbiddenException('You cannot update this restaurant');
    }

    return await this.restaurantModel.findByIdAndDelete(id);
  }

  async uploadImages(
    id: string,
    files: Express.Multer.File[],
    user: User,
  ): Promise<string[]> {
    try {
      const isValidId = mongoose.isValidObjectId(id);
      if (!isValidId) {
        throw new BadRequestException('Please enter correct ID ');
      }

      const restaurant = await this.restaurantModel.findById(id);
      if (!restaurant) {
        throw new NotFoundException('Restaurant not found');
      }

      if (user._id.toString() !== restaurant.user._id.toString()) {
        throw new ForbiddenException('You cannot update this restaurant');
      }

      const images = [];
      files.forEach((file) => {
        images.push(file.filename);
      });

      restaurant.images = images;
      await restaurant.save();

      return images;
    } catch (error) {
      files.forEach((file) => {
        fs.unlinkSync(path.resolve('upload', file.filename));
      });
      return error.response;
    }
  }

  async deleteImages(
    id: string,
    files: string[],
    user: User,
  ): Promise<{ message: string }> {
    try {
      const isValidId = mongoose.isValidObjectId(id);
      if (!isValidId) {
        throw new BadRequestException('Please enter correct ID ');
      }

      const restaurant = await this.restaurantModel.findById(id);
      if (!restaurant) {
        throw new NotFoundException('Restaurant not found');
      }

      if (user._id.toString() !== restaurant.user._id.toString()) {
        throw new ForbiddenException('You cannot update this restaurant');
      }

      files.forEach((file) => {
        const index = restaurant.images.findIndex((i) => i === file);
        if (index > -1) {
          restaurant.images.splice(index, 1); // 2nd parameter means remove one item only
        }
      });

      files.forEach((file) => {
        const filename = path.join('upload', file);
        if (fs.existsSync(filename)) {
          fs.unlinkSync(path.join('upload', file));
        }
      });

      await restaurant.save();
      return { message: 'file(s) removed successfully' };
    } catch (error) {
      return error.response;
    }
  }
}
