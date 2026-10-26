import { Express, Router } from 'express';

export interface EndPointDoc {
  method: string;
  path: string;
  tag: string;
}

interface RegistryEntry {
  prefix: string;
  tag: string;
  router: Router;
}

// Buku catatan "router mana menempel di lantai mana"
const registry: RegistryEntry[] = [];

// Gabungkan prefix + path dengan rapi:
//   '/api/health' + '/'  →  '/api/health'   (tidak jadi '/api/health/')
//   '/'           + '/'  →  '/'             (tidak jado '//')
function joinPath(prefix: string, path: string): string {
  const base = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix;
  return base + path;
}

export function mountRouter(app: Express, prefix: string, tag: string, router: Router): void {
  app.use(prefix, router);                  // tugas asli: pasang router
  registry.push({ prefix, tag, router });   // tugas tambahan: catat ke buku induk
}

export function listAllEndpoints(): EndPointDoc[] {
  const docs: EndPointDoc[] = [];

  for (const { prefix, tag, router } of registry) {
    const stack: any[] = (router as any).stack ?? [];

    for (const layer of stack) {
      if (!layer.route) continue; // lewati middleware, ambil hanya route
      const methods: string[] = Object.keys(layer.route.methods ?? {})
        .filter((m) => m !== '_all')
        .map((m) => m.toUpperCase());

      for (const method of methods) {
        docs.push({ method, path: joinPath(prefix, layer.route.path), tag });
      }
    }
  }

  return docs;
}