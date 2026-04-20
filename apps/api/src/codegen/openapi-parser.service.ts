import { Injectable, Logger } from '@nestjs/common';
import * as yaml from 'js-yaml';
import { AppSpec, PageSpec, DataModelSpec, ApiEndpointSpec, FieldSpec } from '../llm/interfaces/app-spec.interface';

@Injectable()
export class OpenApiParserService {
  private readonly logger = new Logger(OpenApiParserService.name);

  /**
   * Parse an OpenAPI spec (YAML or JSON) into an AppSpec.
   */
  parse(content: string): AppSpec {
    try {
      const doc = yaml.load(content) as any;
      if (!doc || !doc.openapi && !doc.swagger) {
        throw new Error('Not a valid OpenAPI/Swagger document');
      }

      const appName = doc.info?.title || 'API Dashboard';
      const description = doc.info?.description || 'A lightweight dashboard generated from OpenAPI spec.';

      const apiEndpoints = this.extractEndpoints(doc);
      const dataModels = this.extractModels(doc);
      const pages = this.generatePages(doc, apiEndpoints);
      const baseUrl = this.extractBaseUrl(doc);

      return {
        appName,
        description,
        type: 'frontend-only',
        pages,
        dataModels,
        apiEndpoints,
        features: ['API Interaction', 'Live Console'],
        needsDatabase: false,
        baseUrl,
      };
    } catch (error) {
      this.logger.error(`Failed to parse OpenAPI: ${error.message}`);
      throw new Error(`Parse failed: ${error.message}`);
    }
  }

  private extractEndpoints(doc: any): ApiEndpointSpec[] {
    const endpoints: ApiEndpointSpec[] = [];
    const paths = doc.paths || {};

    for (const [path, methods] of Object.entries(paths)) {
      for (const [method, detail] of Object.entries(methods as any)) {
        const operation = detail as any;
        endpoints.push({
          method: method.toUpperCase() as any,
          path,
          description: operation.summary || operation.description || `${method.toUpperCase()} ${path}`,
          requestBody: this.extractRequestBodySchema(operation),
          responseType: 'JSON',
        });
      }
    }
    return endpoints;
  }

  private extractRequestBodySchema(detail: any): Record<string, string> | undefined {
    // Simplified: just get property names if it's an object
    const schema = detail.requestBody?.content?.['application/json']?.schema;
    if (schema && schema.properties) {
      const result: Record<string, string> = {};
      for (const [key, val] of Object.entries(schema.properties)) {
        result[key] = (val as any).type || 'string';
      }
      return result;
    }
    return undefined;
  }

  private extractModels(doc: any): DataModelSpec[] {
    const models: DataModelSpec[] = [];
    const components = doc.components?.schemas || doc.definitions || {};

    for (const [name, schema] of Object.entries(components)) {
      const fields: FieldSpec[] = [];
      const properties = (schema as any).properties || {};
      const required = (schema as any).required || [];

      for (const [propName, propDetail] of Object.entries(properties)) {
        fields.push({
          name: propName,
          type: this.mapType((propDetail as any).type),
          required: required.includes(propName),
          enumValues: (propDetail as any).enum,
        });
      }

      models.push({ name, fields });
    }
    return models;
  }

  private generatePages(doc: any, endpoints: ApiEndpointSpec[]): PageSpec[] {
    const tags = new Set<string>();
    endpoints.forEach(e => {
      const pathSegments = e.path.split('/').filter(Boolean);
      if (pathSegments.length > 0) {
        tags.add(pathSegments[0]);
      }
    });

    if (tags.size === 0) {
      return [{
        name: 'Dashboard',
        path: '/',
        description: 'Main interaction hub',
        components: ['EndpointList']
      }];
    }

    const pages: PageSpec[] = Array.from(tags).map(tag => ({
      name: tag.charAt(0).toUpperCase() + tag.slice(1),
      path: `/${tag}`,
      description: `Endpoints related to ${tag}`,
      components: [`${tag}List`]
    }));

    // Add a home page
    pages.unshift({
      name: 'Overview',
      path: '/',
      description: 'API Overview',
      components: ['Stats']
    });

    return pages;
  }

  private extractBaseUrl(doc: any): string | undefined {
    // OpenAPI 3.x
    if (doc.servers && doc.servers.length > 0) {
      return doc.servers[0].url;
    }
    // Swagger 2.0
    if (doc.host) {
      const scheme = doc.schemes?.[0] || 'https';
      const basePath = doc.basePath || '';
      return `${scheme}://${doc.host}${basePath}`;
    }
    return undefined;
  }

  private mapType(oaType: string): 'string' | 'number' | 'boolean' | 'date' | 'enum' {
    switch (oaType) {
      case 'integer':
      case 'number': return 'number';
      case 'boolean': return 'boolean';
      default: return 'string';
    }
  }
}
