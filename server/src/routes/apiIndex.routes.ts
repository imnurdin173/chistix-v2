import { Router, Request, Response } from 'express';
import { listAllEndpoints, EndPointDoc } from '../utils/routeRegistry';
import { successResponse } from '../utils/response';

const router = Router();

function renderCatalogHtml(data: { total: number; endpoints: EndPointDoc[] }): string {
  const rows = data.endpoints
    .map(
      (e) => `<tr>
        <td><span class="badge ${e.method.toLowerCase()}">${e.method}</span></td>
        <td><code>${e.path}</code></td>
        <td>${e.tag}</td>
      </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Chistix API — Katalog Endpoint</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0f172a; color: #e2e8f0; margin: 40px auto; max-width: 960px; }
    h1 { font-size: 24px; font-weight: 700; }
    h1 small { color: #64748b; font-weight: 400; }
    code { color: #7dd3fc; font-size: 14px; }
    table { border-collapse: collapse; width: 100%; margin-top: 20px; }
    th, td { text-align: left; padding: 10px 14px; border-bottom: 1px solid #1e293b; }
    th { color: #94a3b8; text-transform: uppercase; font-size: 12px; letter-spacing: .05em; }
    tr:hover { background: #1e293b; }
    .badge { display: inline-block; padding: 2px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; }
    .get { background: #14532d; color: #86efac; }
    .post { background: #1e3a8a; color: #93c5fd; }
    .put { background: #713f12; color: #fde047; }
    .patch { background: #3b0764; color: #d8b4fe; }
    .delete { background: #7f1d1d; color: #fca5a5; }
  </style>
</head>
<body>
  <h1>Chistix API <small>— ${data.total} endpoint terdaftar</small></h1>
  <p style="color:#64748b">Katalog ini dibaca otomatis dari router Express — endpoint baru muncul sendiri.</p>
  <table>
    <thead><tr><th>Method</th><th>Path</th><th>Modul</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;
}

router.get('/', (req: Request, res: Response) => {
  const endpoints = listAllEndpoints();
  const data = { total: endpoints.length, endpoints };

  if (req.accepts(['json', 'html']) === 'html') {
    res.send(renderCatalogHtml(data));
    return;
  }
  successResponse(res, 200, 'Katalog endpoint Chistix', data);
});

export default router;