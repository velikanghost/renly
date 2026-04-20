import { IsString, IsOptional, IsNotEmpty, MinLength } from 'class-validator';

export class CreateAppDto {
  @IsString()
  @IsOptional()
  @MinLength(5, { message: 'Prompt must be at least 5 characters' })
  prompt?: string;

  @IsString()
  @IsOptional()
  openApiContent?: string;
}
