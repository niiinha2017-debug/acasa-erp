import { Injectable, BadRequestException } from '@nestjs/common'
import axios from 'axios'

@Injectable()
export class CnpjService {

  async buscarCnpj(cnpj: string) {
    if (!cnpj) {
      throw new BadRequestException('CNPJ é obrigatório')
    }

    try {
      const url = `https://www.receitaws.com.br/v1/cnpj/${cnpj}`

      const { data } = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
        timeout: 10000,
      })

      return data

    } catch (error) {
      throw new BadRequestException(
        'Erro ao consultar CNPJ na ReceitaWS',
      )
    }
  }
}
