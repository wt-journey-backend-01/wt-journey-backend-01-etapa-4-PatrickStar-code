# 🛠️ Instruções para configuração do banco de dados

Este projeto utiliza **PostgreSQL** com **Docker** e gerencia o schema do banco via **Knex.js**.

---

## 🚀 1. Subir o banco de dados com Docker

Certifique-se de que o Docker esteja instalado e em execução.

No terminal, execute:

```bash
docker-compose up -d
```

Esse comando irá:

- Baixar a imagem do PostgreSQL (caso não tenha ainda)
- Subir um container com o banco de dados
- Criar os volumes e a rede necessários

---

## 🔧 2. Executar as migrations

Após o banco estar rodando, aplique as migrations para criar as tabelas necessárias:

```bash
npx knex migrate:latest
```

Se quiser desfazer a última migration:

```bash
npx knex migrate:rollback
```

---

## 🌱 3. Rodar os seeds

Com as tabelas criadas, você pode popular o banco com dados iniciais usando os seeds:

```bash
npx knex seed:run
```

Esse comando irá executar todos os arquivos de seed na pasta `db/seeds`.

---

## ✅ Verificação (opcional)

Para verificar se o banco foi corretamente populado, acesse o container:

```bash
docker exec -it postgres-database psql -U postgres -d policia_db
```

E dentro do psql, execute:

```sql
SELECT * FROM agentes;
SELECT * FROM casos;
```

---

## 🔐 4. Registro e Login de Usuários

### Registro (`/auth/register`)

Envie uma requisição **POST** com os dados do usuário:

```json
{
  "nome": "João Silva",
  "email": "joao@email.com",
  "senha": "123456"
}
```

Se os dados forem válidos, o usuário será criado no banco.

---

### Login (`/auth/login`)

Envie uma requisição **POST** com as credenciais:

```json
{
  "email": "joao@email.com",
  "senha": "123456"
}
```

Se as credenciais estiverem corretas, a API retornará um **JWT**:

```json
{
  "acess_token": "eyJhbGciOiJIUzI1NiIsInR..."
}
```

---

## 🪪 5. Uso do Token JWT

Após o login, o token deve ser enviado no **header** de cada requisição autenticada:

```
Authorization: Bearer <seu_token_aqui>
```

Exemplo usando **cURL**:

```bash
curl -H "Authorization: Bearer eyJhbGciOi..." http://localhost:3000/api/protegida
```

---

## 🔄 6. Fluxo de Autenticação Esperado

1. Usuário realiza **registro** com nome, e-mail e senha.
2. Usuário realiza **login** e recebe um **JWT** válido.
3. O token deve ser enviado no **header Authorization** em rotas protegidas.
4. O servidor valida o token:
   - Se válido → acesso concedido.
   - Se inválido ou expirado → acesso negado (401 Unauthorized).
