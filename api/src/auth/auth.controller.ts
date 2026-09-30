// import { Controller, Post, Body, UnauthorizedException, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
// import { JwtService } from '@nestjs/jwt';
// import * as bcrypt from 'bcryptjs';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { User } from '../users/entities/user.entity';
// import { UserRole } from '../common/enums';

// @Controller('auth')
// export class AuthController {
//   constructor(
//     @InjectRepository(User) private usersRepository: Repository<User>,
//     private jwtService: JwtService,
//   ) {}

//   @Post('signup')
//   async signup(@Body() body: any) {
//     const existing = await this.usersRepository.findOne({ where: { email: body.email } });
//     if (existing) {
//       throw new BadRequestException('Email already in use');
//     }

//     const passwordHash = await bcrypt.hash(body.password, 10);
//     const user = this.usersRepository.create({
//       name: body.name,
//       email: body.email,
//       passwordHash,
//       role: body.role || UserRole.PASSENGER,
//     });

//     await this.usersRepository.save(user);

//     const payload = { sub: user.id, email: user.email, role: user.role };
//     return { access_token: this.jwtService.sign(payload) };
//   }

//   @Post('login')
//   @HttpCode(HttpStatus.OK)
//   async login(@Body() body: any) {
//     const user = await this.usersRepository.findOne({ where: { email: body.email } });
//     if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
//       throw new UnauthorizedException('Invalid credentials');
//     }
    
//     const payload = { sub: user.id, email: user.email, role: user.role };
//     return { access_token: this.jwtService.sign(payload) };
//   }
// }

import { Controller, Post, Body, UnauthorizedException, HttpCode, HttpStatus, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../common/enums';

@Controller('auth')
export class AuthController {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  @Post('signup')
  async signup(@Body() body: any) {
    try {
      if (!body.email || !body.password || !body.name) {
        throw new BadRequestException('Missing required fields: email, password, name');
      }
      const existing = await this.usersRepository.findOne({ where: { email: body.email } });
      if (existing) {
        throw new BadRequestException('Email already in use');
      }
      const passwordHash = await bcrypt.hash(body.password, 10);
      const user = this.usersRepository.create({
        name: body.name,
        email: body.email,
        passwordHash,
        role: body.role || UserRole.PASSENGER,
      });
      await this.usersRepository.save(user);
      const payload = { sub: user.id, email: user.email, role: user.role };
      return { access_token: this.jwtService.sign(payload) };
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException(err.message || 'Signup failed');
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: any) {
    try {
      if (!body.email || !body.password) {
        throw new BadRequestException('Email and password are required');
      }
      const user = await this.usersRepository.findOne({ where: { email: body.email } });
      if (!user || !user.passwordHash || !(await bcrypt.compare(body.password, user.passwordHash))) {
        throw new UnauthorizedException('Invalid credentials');
      }
          
      const payload = { sub: user.id, email: user.email, role: user.role };
      return { access_token: this.jwtService.sign(payload) };
    } catch (err: any) {
      if (err instanceof BadRequestException || err instanceof UnauthorizedException) throw err;
      throw new InternalServerErrorException(err.message || 'Login failed');
    }
  }
}