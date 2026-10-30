# Hub de integrações Multipedidos

Passo a passo e perguntas frequentes das integrações da Multipedidos, publicados pelo GitHub Pages.
O site é feito só de HTML, CSS e JS. Não há framework nem etapa de build: o que está no repositório é o que vai para o ar.

## Estrutura

```
index.html                  página inicial: cards das integrações e busca geral
assets/
  hub.css                   visual de todas as páginas (cores da MP no topo do arquivo)
  hub.js                    acordeões, busca, links diretos e imagens ampliadas
  logo-multipedidos.svg
  favicon.svg, favicon-32.png, apple-touch-icon.png
  fonts/                    fonte Lato (licença livre OFL, arquivo incluso)
_modelo/
  index.html                página-base para criar uma integração nova (não é publicada)
99food/
  index.html                só o conteúdo da 99Food
  img/                      imagens da 99Food em WebP
api-oficial-whatsapp/
  index.html                FAQ da API Oficial do WhatsApp
_config.yml                 configuração do GitHub Pages (esconde este README do site)
```

## Criar uma integração nova

1. Copie a pasta `_modelo` e renomeie com um nome curto, em minúsculas e sem acento (ex.: `ifood`).
2. Abra o `index.html` da pasta nova e troque o título, o texto e os passos. Os comentários no arquivo explicam cada bloco.
3. Coloque as imagens na pasta `img/` da integração, em WebP (veja abaixo).
4. Na página inicial (`index.html` da raiz), copie um card dentro de `<ul class="cards">` e ajuste o link, o nome e o texto.
5. Salve (commit). O site se atualiza sozinho em um ou dois minutos.

A busca geral da página inicial lê as páginas que estão nos cards. Não existe índice para manter.

## Editar uma integração

Abra o `index.html` da pasta da integração e altere o texto. Para mudar algo no visual de todas as páginas (cores, espaçamentos, fonte), altere só o `assets/hub.css`.

## Imagens

- Formato WebP, com no máximo 1400 px de largura. Para converter, dá para usar o site squoosh.app.
- Nome em minúsculas, sem espaço e sem acento. Use o id do passo: `loja-2-1.webp`.
- No Windows `Passo.webp` e `passo.webp` são o mesmo arquivo; no GitHub Pages não são, e a imagem some.
- Mantenha `loading="lazy"` e informe `width` e `height` com o tamanho real da imagem.

## Links diretos para o suporte

Cada passo e cada pergunta tem um `id`. Para mandar ao cliente um link que já abre no ponto certo, junte o endereço da página com `#` e o id:

- `.../api-oficial-whatsapp/#q7-6` abre a pergunta 7.6
- `.../99food/#pdv-3-3` abre o subpasso 3.3 da integração PDV

Por isso, não mude os ids de itens que já foram publicados.

## Regras que evitam problemas

- Use caminhos relativos (`../assets/hub.css`). Caminhos com barra no início (`/assets/hub.css`) quebram no GitHub Pages.
- Todo `id` precisa ser único na página.
- Pastas e arquivos que começam com `_` não são publicados (por isso o `_modelo` fica fora do site).

## Publicar no GitHub Pages

1. Crie o repositório `hub-integracoes`, de preferência numa organização da empresa.
2. Envie todos os arquivos desta pasta para a raiz do repositório.
3. Em **Settings > Pages**, escolha **Deploy from a branch**, branch `main`, pasta `/ (root)`.
4. O endereço aparece na mesma tela, no formato `https://<organizacao>.github.io/hub-integracoes/`.

## Testar no computador antes de publicar

As páginas abrem com dois cliques, mas a busca geral da página inicial só funciona num servidor. Com Python instalado, rode dentro desta pasta:

```
python -m http.server 8000
```

e acesse `http://localhost:8000`.
