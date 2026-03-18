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
  "user": { "id": "u_1", "nome": "Fulano", "email": "usuario@empresa.com", "role": "admin", "setor": "TI" },
  "tokens": { "accessToken": "jwt", "refreshToken": "jwt-refresh", "expiresIn": 3600 }
}
```

### `POST /auth/refresh`
- **Request body**
```json
{ "refreshToken": "jwt-refresh" }
```
- **Response 200**
```json
{ "tokens": { "accessToken": "novo-jwt", "refreshToken": "novo-refresh", "expiresIn": 3600 } }
```

### `POST /auth/logout`
- **Request body**: `{}`
- **Response 204** sem conteúdo.

### `GET /auth/me`
- **Response 200**
```json
{ "id": "u_1", "nome": "Fulano", "email": "usuario@empresa.com", "role": "admin", "setor": "TI" }
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

### `PUT /scopes/:scopeId/draft`
- **Request body**: `EscopoForm`.
- **Response 204** sem conteúdo.

### `POST /scopes/:scopeId/publish`
- **Response 200**
```json
{ "scope_id": "scope_123", "version_number": 2, "published_at": "2026-01-11T11:00:00Z" }
```

### `GET /scopes/:scopeId/versions`
- **Response 200**
```json
[{ "version_number": 1, "published_at": "2026-01-01T00:00:00Z", "data": { "...EscopoForm": true } }]
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
{ "responsibleScopes": 21, "salesAveragePrice": 17250, "createdLastMonthAsResponsible": 8 }
```

### `GET /dashboards/credenciamento`
```json
{ "createdLastMonth": 33, "expiredScopes": 5, "createdByUser": 17, "waitingAdjustment": 6 }
```

### `GET /dashboards/operacao`
```json
{ "responsibleScopes": 40, "createdLastMonth": 12, "waitingAdjustment": 7 }
```

## Gestão de usuários (somente admin)

### `GET /users`
```json
[
  { "id": "u_2", "nome": "Ana", "email": "ana@empresa.com", "role": "comercial", "setor": "Comercial", "ativo": true }
]
```

### `POST /users`
- **Request body**
```json
{ "nome": "Ana", "email": "ana@empresa.com", "password": "SenhaForte123", "role": "comercial", "setor": "Comercial" }
```
- **Response 201**
```json
{ "id": "u_2", "nome": "Ana", "email": "ana@empresa.com", "role": "comercial", "setor": "Comercial", "ativo": true }
```
