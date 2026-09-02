import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'SOIS Backend — Skilling Outcomes Intelligence System (PS 26135)';
  }
}
