import { Injectable, Logger } from '@nestjs/common';
import * as ejs from 'ejs';
import * as path from 'path';
import * as fs from 'fs';
import { AppSpec } from '../llm/interfaces/app-spec.interface';

export interface GeneratedFile {
  path: string;
  content: string;
}

@Injectable()
export class CodegenService {
  private readonly logger = new Logger(CodegenService.name);
  private readonly templatesDir: string;

  constructor() {
    // Templates are copied to dist via nest-cli.json asset config
    this.templatesDir = path.join(__dirname, 'templates');
  }

  /**
   * Generate a complete file tree from an AppSpec.
   * Returns an array of { path, content } objects representing
   * every file in the generated project.
   */
  async generateProject(spec: AppSpec): Promise<GeneratedFile[]> {
    this.logger.log(`Generating project: ${spec.appName}`);
    const files: GeneratedFile[] = [];

    // .locusbuild
    files.push({
      path: '.locusbuild',
      content: JSON.stringify(this.buildLocusBuildConfig(spec), null, 2),
    });

    // Frontend files
    files.push(...this.generateFrontend(spec));

    // Backend files (if fullstack)
    if (spec.type === 'fullstack') {
      files.push(...this.generateBackend(spec));
    }

    this.logger.log(`Generated ${files.length} files for ${spec.appName}`);
    return files;
  }

  private buildLocusBuildConfig(spec: AppSpec) {
    const config: any = {
      services: {
        web: {
          path: spec.type === 'fullstack' ? 'frontend' : '.',
          port: 8080,
          healthCheck: '/',
        },
      },
    };

    if (spec.type === 'fullstack') {
      config.services.api = {
        path: 'backend',
        port: 8080,
        healthCheck: '/health',
        env: {},
      };

      config.services.web.env = {
        VITE_API_URL: '${{api.URL}}',
      };

      if (spec.needsDatabase) {
        config.addons = { db: { type: 'postgres' } };
        config.services.api.env.DATABASE_URL = '${{db.DATABASE_URL}}';
      }
    }

    return config;
  }

  // ─── FRONTEND GENERATION ────────────────────────────────────

  private generateFrontend(spec: AppSpec): GeneratedFile[] {
    const prefix = spec.type === 'fullstack' ? 'frontend/' : '';
    const files: GeneratedFile[] = [];

    // package.json
    files.push({
      path: `${prefix}package.json`,
      content: JSON.stringify({
        name: spec.appName,
        private: true,
        version: '0.1.0',
        type: 'module',
        scripts: {
          dev: 'vite',
          build: 'vite build',
          preview: 'vite preview',
          start: 'vite preview --port 8080 --host',
        },
        dependencies: {
          react: '^19.0.0',
          'react-dom': '^19.0.0',
          'react-router-dom': '^7.0.0',
        },
        devDependencies: {
          '@vitejs/plugin-react': '^4.3.0',
          vite: '^6.0.0',
          tailwindcss: '^4.0.0',
          '@tailwindcss/vite': '^4.0.0',
          '@types/react': '^19.0.0',
          '@types/react-dom': '^19.0.0',
          typescript: '^5.7.0',
        },
      }, null, 2),
    });

    // vite.config.ts
    files.push({
      path: `${prefix}vite.config.ts`,
      content: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 8080, host: true },
  preview: { port: 8080, host: true },
});
`,
    });

    // tsconfig.json
    files.push({
      path: `${prefix}tsconfig.json`,
      content: JSON.stringify({
        compilerOptions: {
          target: 'ES2020',
          useDefineForClassFields: true,
          lib: ['ES2020', 'DOM', 'DOM.Iterable'],
          module: 'ESNext',
          skipLibCheck: true,
          moduleResolution: 'bundler',
          allowImportingTsExtensions: true,
          isolatedModules: true,
          moduleDetection: 'force',
          noEmit: true,
          jsx: 'react-jsx',
          strict: true,
        },
        include: ['src'],
      }, null, 2),
    });

    // index.html
    files.push({
      path: `${prefix}index.html`,
      content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${this.toTitleCase(spec.appName)}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
    });

    // src/main.tsx
    files.push({
      path: `${prefix}src/main.tsx`,
      content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`,
    });

    // src/globals.css
    files.push({
      path: `${prefix}src/globals.css`,
      content: `@import "tailwindcss";

:root {
  --color-bg: #ffffff;
  --color-surface: #f9fafb;
  --color-border: #e5e7eb;
  --color-text: #111827;
  --color-text-muted: #6b7280;
  --color-accent: #2563eb;
  --color-accent-hover: #1d4ed8;
  --color-success: #059669;
  --color-error: #dc2626;
}

body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background-color: var(--color-bg);
  color: var(--color-text);
  margin: 0;
  -webkit-font-smoothing: antialiased;
}
`,
    });

    // src/App.tsx — main app with routing
    files.push({
      path: `${prefix}src/App.tsx`,
      content: this.generateAppComponent(spec),
    });

    // Generate page components
    for (const page of spec.pages) {
      files.push({
        path: `${prefix}src/pages/${this.toFileName(page.name)}.tsx`,
        content: this.generatePageComponent(page, spec),
      });
    }

    // Nav component
    files.push({
      path: `${prefix}src/components/Nav.tsx`,
      content: this.generateNavComponent(spec),
    });

    // Dockerfile
    files.push({
      path: `${prefix}Dockerfile`,
      content: `FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/dist ./dist
EXPOSE 8080
CMD ["serve", "-s", "dist", "-l", "8080"]
`,
    });

    return files;
  }

  // ─── BACKEND GENERATION ─────────────────────────────────────

  private generateBackend(spec: AppSpec): GeneratedFile[] {
    const files: GeneratedFile[] = [];

    // package.json
    files.push({
      path: 'backend/package.json',
      content: JSON.stringify({
        name: `${spec.appName}-api`,
        private: true,
        version: '0.1.0',
        type: 'module',
        scripts: {
          dev: 'node --watch src/server.js',
          start: 'node src/server.js',
        },
        dependencies: {
          express: '^4.21.0',
          cors: '^2.8.5',
        },
      }, null, 2),
    });

    // server.js
    files.push({
      path: 'backend/src/server.js',
      content: this.generateServerFile(spec),
    });

    // Dockerfile
    files.push({
      path: 'backend/Dockerfile',
      content: `FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 8080
CMD ["node", "src/server.js"]
`,
    });

    return files;
  }

  // ─── COMPONENT GENERATORS ──────────────────────────────────

  private generateAppComponent(spec: AppSpec): string {
    const imports = spec.pages
      .map(
        (p) => `import ${this.toPascalCase(p.name)} from './pages/${this.toFileName(p.name)}';`,
      )
      .join('\n');

    const routes = spec.pages
      .map(
        (p) =>
          `        <Route path="${p.path}" element={<${this.toPascalCase(p.name)} />} />`,
      )
      .join('\n');

    return `import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Nav from './components/Nav';
${imports}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[var(--color-bg)]">
        <Nav />
        <main className="max-w-6xl mx-auto px-4 py-8">
          <Routes>
${routes}
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
`;
  }

  private generateNavComponent(spec: AppSpec): string {
    const links = spec.pages
      .map(
        (p) =>
          `        <a href="${p.path}" className="text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">${p.name}</a>`,
      )
      .join('\n');

    return `export default function Nav() {
  return (
    <nav className="border-b border-[var(--color-border)] bg-white">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <span className="text-lg font-semibold text-[var(--color-text)]">${this.toTitleCase(spec.appName)}</span>
        <div className="flex items-center gap-6">
${links}
        </div>
      </div>
    </nav>
  );
}
`;
  }

  private generatePageComponent(page: any, spec: AppSpec): string {
    // Find related data model for this page
    const relatedModel = spec.dataModels.find(
      (m) =>
        page.name.toLowerCase().includes(m.name.toLowerCase()) ||
        page.components.some((c: string) =>
          c.toLowerCase().includes(m.name.toLowerCase()),
        ),
    );

    if (relatedModel) {
      return this.generateCrudPage(page, relatedModel, spec);
    }

    return this.generateStaticPage(page, spec);
  }

  private generateCrudPage(page: any, model: any, spec: AppSpec): string {
    const modelName = model.name;
    const fields = model.fields || [];
    const apiBase = spec.type === 'fullstack' ? "import.meta.env.VITE_API_URL || 'http://localhost:8080'" : "''";

    const fieldHeaders = fields
      .map((f: any) => `          <th className="text-left py-3 px-4 text-xs font-medium uppercase text-[var(--color-text-muted)]">${f.name}</th>`)
      .join('\n');

    const fieldCells = fields
      .map((f: any) => {
        if (f.type === 'boolean') {
          return `          <td className="py-3 px-4"><span className={\`inline-block w-2 h-2 rounded-full \${item.${f.name} ? 'bg-[var(--color-success)]' : 'bg-[var(--color-border)]'}\`} /></td>`;
        }
        if (f.type === 'date') {
          return `          <td className="py-3 px-4 text-sm text-[var(--color-text-muted)]">{item.${f.name} ? new Date(item.${f.name}).toLocaleDateString() : '-'}</td>`;
        }
        return `          <td className="py-3 px-4 text-sm">{item.${f.name}}</td>`;
      })
      .join('\n');

    const formFields = fields
      .filter((f: any) => f.name !== 'id' && f.name !== 'createdAt' && f.name !== 'updatedAt')
      .map((f: any) => {
        if (f.type === 'boolean') {
          return `        <label className="flex items-center gap-2">
          <input type="checkbox" name="${f.name}" className="rounded border-[var(--color-border)]" />
          <span className="text-sm">${f.name}</span>
        </label>`;
        }
        if (f.type === 'enum' && f.enumValues) {
          const options = f.enumValues.map((v: string) => `            <option value="${v}">${v}</option>`).join('\n');
          return `        <select name="${f.name}" className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]">
          <option value="">${f.name}</option>
${options}
        </select>`;
        }
        const inputType = f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text';
        return `        <input type="${inputType}" name="${f.name}" placeholder="${f.name}" className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]" ${f.required ? 'required' : ''} />`;
      })
      .join('\n');

    return `import { useState, useEffect } from 'react';

const API_URL = ${apiBase};

interface ${modelName} {
${fields.map((f: any) => `  ${f.name}: ${this.tsType(f.type)};`).join('\n')}
}

export default function ${this.toPascalCase(page.name)}() {
  const [items, setItems] = useState<${modelName}[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch(\`\${API_URL}/api/${modelName.toLowerCase()}s\`);
      const data = await res.json();
      setItems(data);
    } catch (err) {
      console.error('Failed to fetch:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const body: any = {};
    formData.forEach((val, key) => { body[key] = val; });

    try {
      await fetch(\`\${API_URL}/api/${modelName.toLowerCase()}s\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      setShowForm(false);
      fetchItems();
    } catch (err) {
      console.error('Failed to create:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(\`\${API_URL}/api/${modelName.toLowerCase()}s/\${id}\`, { method: 'DELETE' });
      fetchItems();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">${page.name}</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">${page.description}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-[var(--color-accent)] text-white text-sm font-medium rounded-lg hover:bg-[var(--color-accent-hover)] transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add ${modelName}'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4 mb-6 flex flex-col gap-3">
${formFields}
          <button type="submit" className="self-end px-4 py-2 bg-[var(--color-accent)] text-white text-sm font-medium rounded-lg hover:bg-[var(--color-accent-hover)] transition-colors">
            Save
          </button>
        </form>
      )}

      {loading ? (
        <div className="text-center py-12 text-[var(--color-text-muted)]">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-[var(--color-text-muted)] border border-dashed border-[var(--color-border)] rounded-lg">
          No ${modelName.toLowerCase()}s yet. Create your first one!
        </div>
      ) : (
        <div className="border border-[var(--color-border)] rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-[var(--color-surface)]">
              <tr>
${fieldHeaders}
                <th className="text-right py-3 px-4 text-xs font-medium uppercase text-[var(--color-text-muted)]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {items.map((item, i) => (
                <tr key={i} className="hover:bg-[var(--color-surface)] transition-colors">
${fieldCells}
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => handleDelete((item as any).id || String(i))} className="text-xs text-[var(--color-error)] hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
`;
  }

  private generateStaticPage(page: any, spec: AppSpec): string {
    return `export default function ${this.toPascalCase(page.name)}() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">${page.name}</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">${page.description}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
${page.components
  .map(
    (c: string) => `        <div className="border border-[var(--color-border)] rounded-lg p-4">
          <h3 className="text-sm font-medium mb-2">${this.toTitleCase(c)}</h3>
          <p className="text-xs text-[var(--color-text-muted)]">Component placeholder</p>
        </div>`,
  )
  .join('\n')}
      </div>
    </div>
  );
}
`;
  }

  private generateServerFile(spec: AppSpec): string {
    const modelRoutes = spec.dataModels
      .map((model) => {
        const name = model.name.toLowerCase();
        const plural = `${name}s`;
        return `
// ─── ${model.name} routes ───
let ${plural} = [];
let ${name}NextId = 1;

app.get('/api/${plural}', (req, res) => {
  res.json(${plural});
});

app.get('/api/${plural}/:id', (req, res) => {
  const item = ${plural}.find(i => i.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

app.post('/api/${plural}', (req, res) => {
  const item = { id: String(${name}NextId++), ...req.body, createdAt: new Date().toISOString() };
  ${plural}.push(item);
  res.status(201).json(item);
});

app.put('/api/${plural}/:id', (req, res) => {
  const idx = ${plural}.findIndex(i => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  ${plural}[idx] = { ...${plural}[idx], ...req.body };
  res.json(${plural}[idx]);
});

app.delete('/api/${plural}/:id', (req, res) => {
  ${plural} = ${plural}.filter(i => i.id !== req.params.id);
  res.status(204).end();
});`;
      })
      .join('\n');

    return `import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Health check (required by Locus)
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});
${modelRoutes}

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(\`API running on port \${PORT}\`);
});
`;
  }

  // ─── HELPERS ────────────────────────────────────────────────

  private toPascalCase(str: string): string {
    return str
      .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
      .replace(/^(.)/, (_, c) => c.toUpperCase());
  }

  private toFileName(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  }

  private toTitleCase(str: string): string {
    return str
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  private tsType(type: string): string {
    switch (type) {
      case 'number': return 'number';
      case 'boolean': return 'boolean';
      case 'date': return 'string';
      case 'enum': return 'string';
      default: return 'string';
    }
  }
}
