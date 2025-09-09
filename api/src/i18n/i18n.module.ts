import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HeaderResolver, I18nModule, QueryResolver, AcceptLanguageResolver } from 'nestjs-i18n';
import * as path from 'path';

@Module({
  imports: [
    I18nModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        fallbackLanguage: 'en',
        loaderOptions: {
          path: path.join(__dirname),
          watch: configService.get('NODE_ENV') === 'development',
        },
        resolvers: [
          new QueryResolver(['lang', 'locale', 'l']),
          new HeaderResolver(['x-locale', 'x-lang']),
          new AcceptLanguageResolver(),
        ],
        typesOutputPath: path.join(__dirname, '../../src/generated/i18n.generated.ts'),
      }),
    }),
  ],
  exports: [I18nModule],
})
export class AppI18nModule {}