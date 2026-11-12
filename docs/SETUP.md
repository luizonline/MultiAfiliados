# Configuração

## Executar localmente
1. Clone ou baixe o repositório.
2. Abra `index.html` em um navegador atualizado.
3. Cadastre produtos e teste o compartilhamento.

A versão inicial usa `localStorage`; os dados ficam apenas no navegador e não sincronizam entre dispositivos.

## Próxima etapa: Supabase
1. Criar um projeto Supabase.
2. Executar/revisar `database/schema.sql`.
3. Configurar URL e chave pública no cliente.
4. Manter `service_role`, tokens e segredos somente no backend/Secrets.
5. Implementar autenticação e isolamento por usuário.

## Integrações
Mercado Livre, Shopee e WhatsApp devem ser conectados por serviços de backend. Antes de habilitar automações, validar permissões, escopos, limites e termos atuais. Não presumir que APIs oficiais permitem publicar diretamente em grupos comuns do WhatsApp.
