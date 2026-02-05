import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateAgendaStatusDto {
  @IsString()
  @IsNotEmpty({ message: 'O novo status deve ser informado' })
  status: string;
}