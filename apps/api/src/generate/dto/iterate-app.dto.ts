import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class IterateAppDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5, { message: 'Iteration prompt must be at least 5 characters' })
  prompt: string;
}
