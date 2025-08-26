<sup>Esse é um feedback gerado por IA, ele pode conter erros.</sup>

Você tem 8 créditos restantes para usar o sistema de feedback AI.

# Feedback para PatrickStar-code:

Nota final: **47.0/100**

# Feedback para PatrickStar-code 🚀

Olá, Patrick! Primeiro, quero parabenizá-lo pelo esforço evidente em estruturar sua API com segurança, autenticação via JWT e proteção das rotas. Você conseguiu implementar várias funcionalidades essenciais e ainda avançou em alguns bônus, como o endpoint `/usuarios/me` para retornar os dados do usuário autenticado — isso é excelente! 🎉👏

---

## O que está muito bom e merece destaque 🎯

- **Organização do código:** Você estruturou bem seu projeto em controllers, repositories, middlewares e rotas, seguindo o padrão MVC, o que facilita a manutenção e escalabilidade.
- **Uso do Zod para validação:** O uso do Zod para validar os dados de entrada, tanto para agentes, casos quanto para usuários, é um ponto forte. Isso ajuda a garantir que os dados estejam no formato esperado.
- **Autenticação JWT:** Você implementou o fluxo de registro, login, logout e exclusão de usuários com JWT e bcrypt, o que é fundamental para segurança.
- **Proteção das rotas:** O middleware `authMiddleware` está corretamente aplicado nas rotas que precisam de autenticação.
- **Documentação no INSTRUCTIONS.md:** Está clara e completa, explicando bem o fluxo de autenticação e como usar o token JWT.

---

## Pontos de atenção e melhorias para destravar sua nota e funcionamento 💡

### 1. Nome da tabela de usuários inconsistente com a migration e os repositórios

No arquivo da migration que cria a tabela de usuários (`db/migrations/20250823153901_create_users_table.js`), você criou a tabela com o nome **"users"**:

```js
return knex.schema.createTable("users", (table) => {
  table.increments("id").primary();
  table.string("nome").notNullable();
  table.string("email").notNullable();
  table.string("senha").notNullable();
});
```

Porém, no enunciado e em todo o restante do projeto, a tabela esperada é **"usuarios"** (em português), conforme indicado no requisito da criação da tabela.

Além disso, no seu `usuariosRepository.js`, você está consultando a tabela `"users"`:

```js
const findIndex = await db("users").where({ email: email });
```

**Por que isso é um problema?**  
Os testes e a aplicação esperam que a tabela seja `usuarios`. Se sua migration cria `users` e seu repositório consulta `users`, mas o ambiente de testes e o restante do código esperam `usuarios`, haverá falha na persistência e consulta dos dados dos usuários.

**Como corrigir?**  
Altere sua migration para criar a tabela `usuarios` com os campos corretos, assim:

```js
exports.up = function (knex) {
  return knex.schema.createTable("usuarios", (table) => {
    table.increments("id").primary();
    table.string("nome").notNullable();
    table.string("email").notNullable().unique();
    table.string("senha").notNullable();
  });
};
```

E no seu `usuariosRepository.js`, ajuste para consultar a tabela `usuarios`:

```js
const findIndex = await db("usuarios").where({ email: email });
```

**Importante:** Além disso, adicione a restrição de **únicidade** para o campo `email` na migration, para garantir que não haja duplicidade.

---

### 2. Falta de restrição de unicidade para o campo `email` na tabela de usuários

No requisito, o campo `email` deve ser único para evitar cadastro duplicado. Na sua migration, o campo `email` está definido como:

```js
table.string("email").notNullable();
```

Sem a restrição `.unique()`, o banco permite emails duplicados, o que pode causar problemas de autenticação e falha em validações.

**Como corrigir?**

Adicione `.unique()` no campo `email`:

```js
table.string("email").notNullable().unique();
```

---

### 3. Migration `down` da tabela `usuarios` está vazia

No arquivo da migration de usuários, a função `down` está vazia:

```js
exports.down = function (knex) {};
```

Isso impede que você possa **reverter** essa migration, o que é uma prática essencial para controle de versões do banco.

**Como corrigir?**

Implemente o rollback para dropar a tabela `usuarios`:

```js
exports.down = function (knex) {
  return knex.schema.dropTableIfExists("usuarios");
};
```

---

### 4. Validação extra de campos extras no cadastro de usuário

Notei que o teste de erro 400 para cadastro com campo extra está falhando, provavelmente porque seu `UsuarioSchema` permite campos extras.

No `authController.js`, você usa o Zod para validar o usuário:

```js
const UsuarioSchema = z.object({
  nome: z.string().min(1, "O campo 'nome' é obrigatório."),
  email: z.email(),
  senha: z.string().min(8).regex(senhaRegex),
});
```

Por padrão, o Zod permite campos extras. Para evitar isso e garantir que o usuário só envie exatamente os campos esperados, você deve usar `.strict()` no schema:

```js
const UsuarioSchema = z.object({
  nome: z.string().min(1, "O campo 'nome' é obrigatório."),
  email: z.email(),
  senha: z.string().min(8).regex(senhaRegex),
}).strict();
```

Assim, se o cliente enviar um campo extra, o Zod já rejeita com erro 400.

---

### 5. Pequeno erro de digitação: `bcrypt` está escrito como `bycrypt`

No seu `authController.js`, você importa o bcrypt com o nome errado:

```js
const bycrypt = require("bcryptjs");
```

E depois usa `bycrypt.hash` e `bycrypt.compare`.

Isso pode funcionar, mas é uma prática ruim e pode gerar confusão. O correto é:

```js
const bcrypt = require("bcryptjs");
```

E usar `bcrypt.hash` e `bcrypt.compare`.

---

### 6. Status code incorreto na resposta do login quando usuário não encontrado

No seu método `login` do `authController.js`, quando o usuário não é encontrado, você retorna status 404:

```js
if (!usuario) {
  return res.status(404).json({ message: "Usuario nao encontrado." });
}
```

Porém, o padrão de segurança e o esperado é que o login retorne **400 Bad Request** ou **401 Unauthorized** para credenciais inválidas, para evitar dar pistas sobre a existência do usuário.

Sugiro alterar para:

```js
if (!usuario) {
  return res.status(400).json({ message: "Credenciais inválidas." });
}
```

Ou, se preferir, 401:

```js
if (!usuario) {
  return res.status(401).json({ message: "Credenciais inválidas." });
}
```

Isso ajuda a evitar vazamento de informações.

---

### 7. Status code incorreto na resposta do middleware para token inválido

No seu `authMiddleware.js`, quando o token é inválido, você retorna status 400:

```js
if (err) {
  return res.status(400).json({ message: "Token de autenticação inválido." });
}
```

O mais correto é retornar **401 Unauthorized** para indicar que a autenticação falhou:

```js
if (err) {
  return res.status(401).json({ message: "Token de autenticação inválido." });
}
```

---

### 8. Validação de ids no controllers de agentes e casos

Alguns endpoints esperam que o id seja um número válido. No seu código, por exemplo no `agentesController.js`, no método `findById`, você não valida se o id é numérico antes de consultar o banco.

Isso pode causar erros ou comportamento inesperado.

Sugiro validar o id antes, por exemplo:

```js
const idNum = Number(req.params.id);
if (Number.isNaN(idNum)) {
  return res.status(400).json({ message: "ID inválido" });
}
```

E usar `idNum` para consultas.

---

### 9. Uso do método `Object.fromEntries(Object.entries(parsed.data))` desnecessário

Vi que você usa essa construção para limpar dados no `patch` de agentes e casos:

```js
Object.fromEntries(Object.entries(parsed.data))
```

Mas `parsed.data` já é um objeto limpo. Essa conversão é redundante e pode ser removida para simplificar o código.

---

### 10. Pequena inconsistência no nome do parâmetro em `getAgente` do `casosController.js`

No método `getAgente`, você usa `caso_id` no parâmetro, mas na rota está definido como `casos_id` (plural):

```js
const { caso_id } = req.params;
```

Mas na rota:

```js
router.get("/:casos_id/agente", authMiddleware, casosController.getAgente);
```

Isso pode fazer com que `caso_id` seja `undefined`, causando erro.

Corrija para:

```js
const { casos_id } = req.params;
const casosIdNum = Number(casos_id);
```

---

## Recomendações de aprendizado 📚

- Sobre o problema da tabela de usuários e migrations, recomendo fortemente este vídeo para entender como criar e versionar migrations com Knex.js:  
  https://www.youtube.com/watch?v=dXWy_aGCW1E

- Para entender melhor o uso correto do bcrypt e JWT, e evitar erros comuns, veja este vídeo feito pelos meus criadores, que explica bem os conceitos básicos de autenticação segura:  
  https://www.youtube.com/watch?v=Q4LQOfYwujk

- Para garantir que suas validações com Zod sejam estritas e rejeitem campos extras, este vídeo sobre boas práticas com validação de dados pode ajudar:  
  https://www.youtube.com/watch?v=bGN_xNc4A1k&t=3s

---

## Resumo rápido dos principais pontos para focar:

- 🔑 **Corrigir nome da tabela de usuários para `usuarios`** e garantir que a migration crie essa tabela com o campo `email` único.  
- 🔑 Implementar a função `down` da migration de usuários para permitir rollback.  
- 🔑 Usar `.strict()` no schema do Zod para rejeitar campos extras no cadastro.  
- 🔑 Corrigir o nome `bcrypt` na importação (está como `bycrypt`).  
- 🔑 Ajustar os status codes para erros de autenticação e token inválido (usar 400/401 corretamente).  
- 🔑 Validar os IDs recebidos nos parâmetros para garantir que sejam números válidos antes de consultar o banco.  
- 🔑 Corrigir inconsistência no nome do parâmetro `casos_id` vs `caso_id` no método `getAgente`.  

---

Patrick, você está no caminho certo! Com essas correções, sua API vai ficar muito mais robusta, confiável e alinhada com as boas práticas de segurança e desenvolvimento. Continue assim, aprendendo e aprimorando seu código, que o sucesso vem! 🚀✨

Se precisar de ajuda para entender algum ponto, estarei por aqui! 😉

Um abraço virtual,  
Seu Code Buddy 🤖💙

> Caso queira tirar uma dúvida específica, entre em contato com o Chapter no nosso [discord](https://discord.gg/DryuHVnz).



---
<sup>Made By the Autograder Team.</sup><br>&nbsp;&nbsp;&nbsp;&nbsp;<sup><sup>- [Arthur Carvalho](https://github.com/ArthurCRodrigues)</sup></sup><br>&nbsp;&nbsp;&nbsp;&nbsp;<sup><sup>- [Arthur Drumond](https://github.com/drumondpucminas)</sup></sup><br>&nbsp;&nbsp;&nbsp;&nbsp;<sup><sup>- [Gabriel Resende](https://github.com/gnvr29)</sup></sup>