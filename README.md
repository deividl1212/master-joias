# Master Joias — Sistema de Gestão

## 1. Instalar dependências
No VS Code, abra o terminal integrado dentro desta pasta e rode:

```bash
npm install
```

## 2. Criar o usuário de login (login compartilhado da loja)

O `.env.local` já está configurado com a URL e a chave do seu Supabase.
Falta criar o usuário/senha que as 3 pessoas da loja vão usar para entrar.

A tela de login pede só um **"Usuário"** (ex: `masterjoias`), mas por baixo
dos panos o Supabase Auth exige um formato de email — então ao criar o
usuário no painel, você precisa usar esse mesmo nome seguido de
`@masterjoias.local`.

1. No painel do Supabase, vá em **Authentication → Users**
2. Clique em **Add user** → **Create new user**
3. Em **Email**, digite: `masterjoias@masterjoias.local`
   (troque `masterjoias` pelo nome de usuário que quiser — só lembre de
   usar o mesmo nome na hora de logar no sistema)
4. Em **Password**, escolha a senha real que a loja vai usar
5. Marque a opção **Auto Confirm User** (assim não precisa confirmar por email)
6. Clique em **Create user**

Na tela de login do sistema, a loja vai digitar apenas `masterjoias` no
campo "Usuário" (sem o `@masterjoias.local`) e a senha escolhida.

## 3. Rodar o projeto

```bash
npm run dev
```

Abra **http://localhost:3000** — você deve cair na tela de login.
Entre com o email/senha criados no passo 2.

## 4. Estrutura do projeto

```
src/
  app/
    login/          -> tela de login
    dashboard/       -> área interna (protegida, exige login)
    layout.js         -> layout raiz
    page.js            -> redireciona para /dashboard
  middleware.js        -> protege as rotas (redireciona quem não está logado)
  utils/supabase/
    client.js          -> cliente Supabase para o navegador
    server.js           -> cliente Supabase para o servidor
```

## Próximos passos
Cada tela do protótipo (PDV, Estoque, Clientes, Fornecedores, Financeiro,
Contas a Pagar, Relatórios) será migrada para dentro de `src/app/`, uma de
cada vez, já lendo e gravando direto nas tabelas do Supabase (schema em
`schema-master-joias.sql`).
