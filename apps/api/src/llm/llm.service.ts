import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { AppSpec } from './interfaces/app-spec.interface';
import {
  SPEC_GENERATOR_SYSTEM_PROMPT,
  SPEC_GENERATOR_USER_PROMPT,
} from './prompts/spec-generator';
import {
  ITERATION_SYSTEM_PROMPT,
  ITERATION_USER_PROMPT,
} from './prompts/iteration';

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly client: Anthropic;

  constructor(private readonly configService: ConfigService) {
    this.client = new Anthropic({
      apiKey: this.configService.get<string>('anthropicApiKey'),
    });
  }

  /**
   * Convert a user prompt into a structured AppSpec using Claude.
   */
  async generateSpec(userPrompt: string): Promise<AppSpec> {
    this.logger.log(`Generating spec for prompt: "${userPrompt.substring(0, 80)}..."`);

    const message = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: SPEC_GENERATOR_USER_PROMPT(userPrompt),
        },
      ],
      system: SPEC_GENERATOR_SYSTEM_PROMPT,
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected Claude response type');
    }

    const spec = this.parseSpecResponse(content.text);
    this.logger.log(`Generated spec: ${spec.appName} (${spec.pages.length} pages, ${spec.dataModels.length} models)`);
    return spec;
  }

  /**
   * Generate an updated spec based on an iteration request.
   */
  async iterateSpec(existingSpec: AppSpec, changeRequest: string): Promise<AppSpec> {
    this.logger.log(`Iterating spec "${existingSpec.appName}" with: "${changeRequest.substring(0, 80)}..."`);

    const message = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: ITERATION_USER_PROMPT(existingSpec, changeRequest),
        },
      ],
      system: ITERATION_SYSTEM_PROMPT,
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected Claude response type');
    }

    const updatedSpec = this.parseSpecResponse(content.text);
    this.logger.log(`Updated spec: ${updatedSpec.appName} (${updatedSpec.pages.length} pages, ${updatedSpec.dataModels.length} models)`);
    return updatedSpec;
  }

  /**
   * Parse Claude's JSON response, handling potential markdown code fences.
   */
  private parseSpecResponse(text: string): AppSpec {
    let cleaned = text.trim();

    // Strip markdown code fences if present
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    try {
      const parsed = JSON.parse(cleaned);
      return this.validateSpec(parsed);
    } catch (error) {
      this.logger.error(`Failed to parse spec JSON: ${error.message}`);
      this.logger.debug(`Raw response: ${text.substring(0, 500)}`);
      throw new Error(`Failed to parse AI response as valid JSON: ${error.message}`);
    }
  }

  /**
   * Validate the parsed spec has required fields.
   */
  private validateSpec(raw: any): AppSpec {
    if (!raw.appName || !raw.pages || !Array.isArray(raw.pages)) {
      throw new Error('Invalid spec: missing appName or pages');
    }

    return {
      appName: raw.appName,
      description: raw.description || '',
      type: raw.type || 'fullstack',
      pages: raw.pages || [],
      dataModels: raw.dataModels || [],
      apiEndpoints: raw.apiEndpoints || [],
      features: raw.features || [],
      needsDatabase: raw.needsDatabase ?? false,
    };
  }
}
