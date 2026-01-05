import { IsNotEmpty, IsString } from 'class-validator';

export class AtualizarStatusDto {
  @IsString()
  @IsNotEmpty()
  status: string;
}
