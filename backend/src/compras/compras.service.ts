import { Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { Compra } from './compra.entity'
import { ItemCompra } from './item-compra.entity'
import { ItemCompraRateio } from './item-compra-rateio.entity'

@Injectable()
export class ComprasService {
  constructor(private dataSource: DataSource) {}

  async criarCompraCompleta(payload: any) {
    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      const { itens, ...dadosCompra } = payload

      // 1️⃣ Compra
      const compra = queryRunner.manager.create(Compra, dadosCompra)
      const compraSalva = await queryRunner.manager.save(compra)

      let totalProdutos = 0

      // 2️⃣ Itens
      for (const item of itens) {
        const valorTotalItem = item.quantidade * item.valor_unitario
        totalProdutos += valorTotalItem

        const itemCompra = queryRunner.manager.create(ItemCompra, {
          compra_id: compraSalva.id,
          produto_id: item.produto_id,
          quantidade: item.quantidade,
          valor_unitario: item.valor_unitario,
          valor_total: valorTotalItem,
          unidade_compra: item.unidade_compra
        })

        const itemSalvo = await queryRunner.manager.save(itemCompra)

        // 3️⃣ Rateio por ambiente da VENDA
        for (const rateio of item.rateio) {
          const valorAlocado =
            rateio.percentual
              ? (valorTotalItem * rateio.percentual) / 100
              : rateio.valor_alocado

          const rateioEntity = queryRunner.manager.create(ItemCompraRateio, {
            item_compra_id: itemSalvo.id,
            ambiente_id: rateio.ambiente_id,
            percentual: rateio.percentual,
            valor_alocado: valorAlocado
          })

          await queryRunner.manager.save(rateioEntity)
        }
      }

      // 4️⃣ Totais finais
      compraSalva.valor_total_produtos = totalProdutos
      compraSalva.valor_final =
        totalProdutos +
        compraSalva.valor_frete +
        compraSalva.valor_outros

      await queryRunner.manager.save(compraSalva)

      await queryRunner.commitTransaction()
      return compraSalva

    } catch (err) {
      await queryRunner.rollbackTransaction()
      throw err
    } finally {
      await queryRunner.release()
    }
  }
}

