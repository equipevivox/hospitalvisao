# Hospital Visão Cuiabá

Site institucional estático, desenvolvido em HTML, CSS e JavaScript.

## Executar localmente

Com Python 3 instalado, execute na raiz do projeto:

```sh
python -m http.server 4173 --bind 127.0.0.1
```

Acesse http://127.0.0.1:4173/.

## Estrutura

- `index.html`: página principal.
- `css/`: estilos.
- `js/`: interações.
- `assets/`: imagens, identidade visual e arquivos de referência.

## Publicação

Destino previsto: Coolify na VPS, com domínio
`hospitalvisao.vivoxmarketing.com.br` gerenciado na Cloudflare.

O site não exige compilação. Publique `index.html`, `css/`, `js/` e `assets/`
com um servidor HTTP de arquivos estáticos.

Backups, logs e arquivos locais de trabalho não são versionados.
