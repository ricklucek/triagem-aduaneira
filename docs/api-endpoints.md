# Contrato de rotas da API (frontend Next.js)

## Autenticação

### `POST /auth/login`

- **Request body**

```json
{ "email": "usuario@empresa.com", "password": "senha-segura" }
```

- **Response 200**

```json
{
  "user": {
    "id": "u_1",
    "nome": "Fulano",
    "email": "usuario@empresa.com",
    "role": "admin",
    "setor": "TI"
  },
  "tokens": {
    "accessToken": "jwt",
    "refreshToken": "jwt-refresh",
    "expiresIn": 3600
  }
}
```

### `POST /auth/refresh`

- **Request body**

```json
{ "refreshToken": "jwt-refresh" }
```

- **Response 200**

```json
{
  "tokens": {
    "accessToken": "novo-jwt",
    "refreshToken": "novo-refresh",
    "expiresIn": 3600
  }
}
```

### `POST /auth/logout`

- **Request body**: `{}`
- **Response 204** sem conteúdo.

### `GET /auth/me`

- **Response 200**

```json
{
  "id": "u_1",
  "nome": "Fulano",
  "email": "usuario@empresa.com",
  "role": "admin",
  "setor": "TI"
}
```

## Escopos

### `POST /scopes`

- **Request body**: parcial de `EscopoForm`.
- **Response 201**

```json
{ "id": "scope_123" }
```

### `GET /scopes`

- **Query params**: `status`, `cnpj`, `q`, `limit`, `offset`.
- **Response 200**

```json
{
  "items": [
    {
      "id": "scope_123",
      "cnpj": "12345678000100",
      "razao_social": "Empresa X",
      "status": "draft",
      "updated_at": "2026-01-10T10:00:00Z",
      "last_published_at": null,
      "version_count": 0,
      "completeness_score": 68
    }
  ],
  "total": 1,
  "limit": 10,
  "offset": 0
}
```

### `GET /scopes/:scopeId`

- **Response 200**

```json
{ "id": "scope_123", "status": "draft", "draft": { "...EscopoForm": true } }
```

### `PUT /scopes/:scopeId`

- **Request body**: `EscopoForm`.
- **Response 204** sem conteúdo.
- **Observação funcional (frontend 2026-03-31)**: este endpoint deve aceitar atualização de escopos em qualquer status (`draft`, `published` ou `archived`), pois o fluxo de versionamento foi removido da interface e a edição agora ocorre diretamente no registro existente.

### `DELETE /scopes/:scopeId` _(novo requerido)_

- Remove o registro de escopo selecionado a partir das ações de **Excluir** no dashboard e na listagem por cliente.
- **Response 204** sem conteúdo.
- **Response 404** quando o `scopeId` não existir.
- **Observação funcional (frontend 2026-03-31)**: endpoint usado com confirmação em modal antes da exclusão.

### `POST /scopes/:scopeId/publish` _(legado / opcional)_

- **Response 200**

```json
{
  "scope_id": "scope_123",
  "version_number": 2,
  "published_at": "2026-01-11T11:00:00Z"
}
```

### `GET /scopes/:scopeId/versions` _(legado / opcional)_

- **Response 200**

```json
[
  {
    "version_number": 1,
    "published_at": "2026-01-01T00:00:00Z",
    "data": { "...EscopoForm": true }
  }
]
```

## Dashboards por perfil

### `GET /dashboards/admin`

```json
{
  "createdLastMonth": 45,
  "outdatedScopes": 12,
  "scopesByPerson": [{ "group": "Maria", "total": 14 }],
  "scopesBySector": [{ "group": "Comercial", "total": 19 }],
  "comercialAveragePrice": 18500,
  "totalScopes": 230
}
```

### `GET /dashboards/comercial`

```json
{
  "responsibleScopes": 21,
  "salesAveragePrice": 17250,
  "createdLastMonthAsResponsible": 8
}
```

### `GET /dashboards/credenciamento`

```json
{
  "createdLastMonth": 33,
  "expiredScopes": 5,
  "createdByUser": 17,
  "waitingAdjustment": 6
}
```

### `GET /dashboards/operacao`

```json
{ "responsibleScopes": 40, "createdLastMonth": 12, "waitingAdjustment": 7 }
```

## Gestão de usuários (somente admin)

### `GET /users`

```json
[
  {
    "id": "u_2",
    "nome": "Ana",
    "email": "ana@empresa.com",
    "role": "comercial",
    "setor": "Comercial",
    "ativo": true
  }
]
```

### `POST /users`

- **Request body**

```json
{
  "nome": "Ana",
  "email": "ana@empresa.com",
  "password": "SenhaForte123",
  "role": "comercial",
  "setor": "Comercial"
}
```

- **Response 201**

```json
{
  "id": "u_2",
  "nome": "Ana",
  "email": "ana@empresa.com",
  "role": "comercial",
  "setor": "Comercial",
  "ativo": true
}
```

## Configurações e gestão administrativa

### `PUT /admin/settings`

- Endpoint já utilizado para salvar **Informações fixas** e também a coleção `prepostosContatos` após operações de criação/edição/exclusão na tela de **Contatos de prepostos**.

### `GET /admin/settings/prepostos` _(novo sugerido)_

- Sugestão para desacoplar a carga de prepostos da carga geral de configurações.
- **Response 200**

```json
{
  "items": [
    {
      "id": "preposto-1",
      "nome": "Despachante Sul",
      "localidade": "Itajaí",
      "operacao": "IMPORTACAO",
      "contatoNome": "Maria",
      "telefone": "+55 47 99999-0000",
      "email": "maria@empresa.com",
      "valor": 350,
      "observacoes": "Atendimento em horário comercial"
    }
  ]
}
```

### `POST /admin/settings/prepostos` _(novo sugerido)_

- Cria um registro de preposto.

### `PUT /admin/settings/prepostos/:id` _(novo sugerido)_

- Atualiza um registro existente.

### `DELETE /admin/settings/prepostos/:id` _(novo sugerido)_

- Remove um registro existente.

### `PUT /users/:id` _(novo sugerido)_

- Atualiza dados do usuário no fluxo de **Gerenciar usuários**.
- **Request body**: `Partial<CreateUserPayload>` com `password` opcional.

### `DELETE /users/:id` _(novo sugerido)_

- Exclui usuário pelo `id`.
- **Response 204** sem conteúdo.
