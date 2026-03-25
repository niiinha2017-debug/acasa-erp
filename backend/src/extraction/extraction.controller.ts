import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ExtractionService } from './extraction.service';

const MIME_ACEITOS = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

@Controller('extraction')
export class ExtractionController {
  constructor(private readonly extractionService: ExtractionService) {}

  /**
   * POST /extraction/analisar
   * Recebe até 10 arquivos (PDF, DOCX, imagens) e extrai dados automaticamente.
   * Retorna os dados extraídos + divergências detectadas entre os documentos.
   */
  @Post('analisar')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: memoryStorage(),
      limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB por arquivo
      fileFilter: (_req, file, cb) => {
        const mime = file.mimetype.toLowerCase();
        const ext = file.originalname.toLowerCase();
        const ok =
          MIME_ACEITOS.includes(mime) ||
          ext.endsWith('.docx') ||
          ext.endsWith('.doc') ||
          ext.endsWith('.pdf');
        if (!ok) {
          return cb(
            new BadRequestException(
              `Arquivo "${file.originalname}" não é um tipo suportado (PDF, DOCX, JPG, PNG, WEBP).`,
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async analisar(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Nenhum arquivo enviado.');
    }
    return this.extractionService.extrairDosArquivos(files);
  }
}
