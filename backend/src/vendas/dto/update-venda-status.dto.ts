import { IsNotEmpty, IsString } from 'class-validator'

export class UpdateVendaStatusDto {
  @IsNotEmpty()
  @IsString()
  status: string
}
