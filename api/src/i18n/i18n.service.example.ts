import { Injectable } from '@nestjs/common';
import { I18nService, I18nContext } from 'nestjs-i18n';

@Injectable()
export class ExampleI18nService {
  constructor(private readonly i18n: I18nService) {}

  // Basic translation
  getWelcomeMessage(lang?: string): string {
    return this.i18n.translate('common.welcome', { lang });
  }

  // Translation with interpolation
  getContainerStartedMessage(containerName: string, lang?: string): string {
    return this.i18n.translate('common.docker.containerStarted', {
      args: { name: containerName },
      lang,
    });
  }

  // Using context from request
  async getErrorMessage(errorKey: string): Promise<string> {
    const context = I18nContext.current();
    return this.i18n.translate(`errors.${errorKey}`, {
      lang: context?.lang,
    });
  }

  // Validation message with parameters
  getValidationMessage(field: string, min: number, max: number, lang?: string): string {
    return this.i18n.translate('errors.validation.range', {
      args: { field, min, max },
      lang,
    });
  }
}