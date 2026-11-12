# Publicação do MultiAfiliados no Cloudflare Pages

O aplicativo atual é estático (HTML, CSS e JavaScript) e pode ser publicado diretamente da raiz do repositório.

## Criar a publicação

1. Acesse https://dash.cloudflare.com/ e crie/acesse sua conta.
2. Abra **Workers & Pages**.
3. Clique em **Create application** e escolha **Pages**.
4. Selecione **Connect to Git** e conecte o GitHub.
5. Autorize o aplicativo Cloudflare Workers & Pages somente para o repositório `luizonline/MultiAfiliados`.
6. Selecione o repositório e a branch `main`.
7. Configure:
   - Project name: `multi-afiliados` (ou outro nome disponível)
   - Production branch: `main`
   - Framework preset: `None`
   - Build command: deixe em branco
   - Build output directory: `/` ou `.` conforme o formulário aceitar; a saída é a raiz do repositório.
8. Clique em **Save and Deploy**.

Após a publicação, o Cloudflare fornecerá um endereço `https://....pages.dev`. Teste a tela de login antes de cadastrar dados reais.

## Configurar autenticação no Supabase

Depois de obter o endereço público:

1. No Supabase, abra **Authentication → URL Configuration**.
2. Em **Site URL**, informe o endereço principal do Pages, por exemplo `https://multi-afiliados.pages.dev`.
3. Em **Redirect URLs**, adicione também o mesmo endereço com `/**` no final.
4. Salve.

A URL exata deverá ser usada; não adivinhe o subdomínio antes do primeiro deploy.

## Atualizações

Com Git integration ativa, novos commits enviados à branch `main` geram uma nova publicação automaticamente.

## Observações

- O site publicado é acessível pela internet; o login do Supabase protege o acesso aos dados.
- A chave `sb_publishable_` é própria para o cliente web. Nunca coloque uma Secret key ou `service_role` no repositório.
- O envio automático para grupos do WhatsApp ainda não está implementado; o botão atual abre o WhatsApp com a mensagem pronta.
