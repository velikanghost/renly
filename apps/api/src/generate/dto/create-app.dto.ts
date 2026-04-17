import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class CreateAppDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5, { message: 'Prompt must be at least 5 characters' })
  prompt: string;
}
