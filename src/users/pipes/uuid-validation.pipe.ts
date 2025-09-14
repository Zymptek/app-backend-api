import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class UuidValidationPipe implements PipeTransform {
  transform(value: string): string {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      throw new BadRequestException('Invalid user ID format');
    }
    return value;
  }
}
