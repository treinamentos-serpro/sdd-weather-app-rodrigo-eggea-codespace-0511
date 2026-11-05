# Solução de referência — (Delivery)

A automação de deploy já está pronta no repositório.

## Como funciona

O workflow [`.github/workflows/pages.yml`](../../.github/workflows/pages.yml)
dispara após a validação do SDD ou manualmente:

1. **Build do app** com `VITE_BASE=/${{ github.event.repository.name }}/` —
   garante que os assets apontem para o subcaminho do repositório no Pages.
2. **Publicação** do diretório `dist` via `actions/upload-pages-artifact` +
   `actions/deploy-pages`.

## O `base` configurável

Em [`vite.config.ts`](../../vite.config.ts):

```ts
base: process.env.VITE_BASE ?? '/',
```

- **Local/dev:** `base = '/'`.
- **Pages:** `base = '/<repo>/'` (injetado pelo workflow).

Sem isso, os assets seriam buscados na raiz do domínio em vez do subcaminho do
repositório e dariam 404, deixando o app em branco.

## Validação local

```bash
VITE_BASE=/sdd-weather-app/ pnpm build
pnpm preview
```

## Configuração do repositório (uma vez)

- **Settings → Pages → Source: GitHub Actions.**
- Permissões já declaradas no workflow (`pages: write`, `id-token: write`).

## URLs finais

- App: `https://<user>.github.io/<repo>/`

Ciclo SDD completo: **Brief → Spec → Plan → Tasks → Code → Test → Review →
Ship**. O Weather App está no ar.
