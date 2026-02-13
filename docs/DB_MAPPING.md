# DB Mapping — Security24h MVP

Mapeamento das tabelas do SQL Server (documentadas em `tabelas.md`) para os
modulos do backend REST. Apenas as tabelas e campos utilizados na API sao
listados aqui; o schema completo permanece no `tabelas.md` original.

---

## 1. Produtos (Equipment)

**Tabela SQL:** `Produtos`
**PK:** `CodProduto` (int)
**Modulo MVP:** Products / Equipment

### Campos mapeados

| Coluna SQL           | Alias API          | Tipo SQL              | Descricao                                    |
|----------------------|--------------------|-----------------------|----------------------------------------------|
| CodProduto           | id                 | int (PK)              | Codigo do produto                            |
| Descriçao            | name               | nvarchar              | Nome do produto                              |
| CodFabricante        | sku                | nvarchar              | Codigo do fabricante                         |
| CodMarca             | brandId            | int (FK DadosEntidades)| Marca do produto (lookup)                   |
| CodGrupo             | groupId            | int (FK DadosEntidades)| Grupo do produto (ex: Sensor, Camera)       |
| CodSubGrupo          | subGroupId         | int (FK DadosEntidades)| Subgrupo do produto                         |
| CodCategoria         | categoryId         | int (FK DadosEntidades)| Categoria do produto                        |
| Preço                | price              | decimal               | Preco de lista (depreciado mas usado)        |
| Foto                 | photoPath          | nvarchar              | Caminho da foto                              |
| Cancelado            | cancelled          | bit                   | Se o produto esta cancelado                  |
| Pontos               | points             | int                   | Pontos de alarme (calculam qtd de servico)   |
| ProdutoKit           | isKit              | bit                   | Se e um kit de produtos                      |
| AcréscimoInstalação  | installSurcharge   | decimal               | Acrescimo no servico de instalacao           |
| AcréscimoMensal      | monthlySurcharge   | decimal               | Acrescimo na mensalidade                     |
| NCM                  | ncm                | nvarchar              | Nomenclatura Comum do Mercosul               |
| Aplicação            | description        | nvarchar              | Descricao detalhada do produto               |
| GrupoOrçamento       | quoteGroup         | nvarchar              | Grupo no orcamento                           |
| DataCadastro         | createdAt          | datetime              | Data de cadastro                             |
| ModeloFabricante     | manufacturerModel  | nvarchar              | Modelo do fabricante                         |
| CodUnidade           | unitId             | int (FK Unidades)     | Unidade de cadastro                          |

### Filtros API planejados
- `brandId` (CodMarca) — filtra por marca
- `groupId` (CodGrupo) — filtra por grupo/categoria
- `cancelled` — exclui cancelados (default: false)
- `q` — busca textual em Descriçao

---

## 2. ProdutosKits (Kit Composition)

**Tabela SQL:** `ProdutosKits`
**PK:** `CodInterno` (int)
**Modulo MVP:** Kits

### Campos mapeados

| Coluna SQL         | Alias API     | Tipo SQL    | Descricao                               |
|--------------------|---------------|-------------|------------------------------------------|
| CodInterno         | id            | int (PK)    | PK da composicao                        |
| CodProdutoKit      | kitProductId  | int (FK)    | Produto "mestre" (o kit em si)           |
| CodProdutoAgregado | itemProductId | int (FK)    | Produto que compoe o kit                 |
| Quantidade         | quantity      | decimal     | Quantidade de itens no kit               |
| Percentual         | percentage    | decimal     | Percentual do valor que o item representa|

### Relacao
- `CodProdutoKit` → `Produtos.CodProduto` (WHERE ProdutoKit = 1)
- `CodProdutoAgregado` → `Produtos.CodProduto`

### Filtros API planejados
- `kitProductId` — itens de um kit especifico
- Listagem de kits = `Produtos WHERE ProdutoKit = 1 AND Cancelado = 0`

---

## 3. Prospects (Leads / Pipeline)

**Tabela SQL:** `Prospects`
**PK:** `CodProspect` (int)
**Modulo MVP:** Leads / Pipeline / Kanban

### Campos mapeados

| Coluna SQL     | Alias API    | Tipo SQL              | Descricao                              |
|----------------|--------------|-----------------------|-----------------------------------------|
| CodProspect    | id           | int (PK)              | Codigo do prospect                     |
| Nome           | name         | nvarchar              | Nome                                   |
| Email          | email        | nvarchar              | Email                                  |
| Fone1          | phone        | nvarchar              | Telefone                               |
| Endereço       | address      | nvarchar              | Endereco                               |
| Cidade         | city         | nvarchar              | Cidade                                 |
| Estado         | state        | nvarchar              | Estado                                 |
| CEP            | zipCode      | nvarchar              | CEP                                    |
| Vendedor       | sellerId     | int (FK Clientes)     | Vendedor atrelado                      |
| Origem         | originId     | int (FK DadosEntidades)| Origem do prospect                    |
| Status         | status       | char(1)               | A=Ativo, X=Convertido, C=Cancelado     |
| DataCadastro   | createdAt    | datetime              | Data de cadastro                       |
| Inativo        | inactive     | bit                   | Se foi cancelado                       |
| CPF            | document     | nvarchar              | CPF/CNPJ                              |
| Latitude       | lat          | decimal               | Coordenada                             |
| Longitude      | lng          | decimal               | Coordenada                             |
| AcompanhaPipe  | pinOnPipeline| bit                   | Fixar no pipeline/kanban               |

### Status do Pipeline
| Valor | Significado       |
|-------|-------------------|
| A     | Prospect / Lead   |
| X     | Convertido em cliente |
| C     | Cancelado         |

### Tabela auxiliar: `EtapasOrçamento`
Define as etapas do Kanban de orcamentos:
| Coluna      | Descricao                        |
|-------------|----------------------------------|
| CodInterno  | PK                               |
| Etapa       | Nome da etapa                    |
| Ordem       | Posicao na tela                  |
| CorEtapa    | Cor de identificacao             |
| DescrEtapa  | Descricao                        |
| Unidade     | FK Unidades                      |

---

## 4. ProspectsAcaoVendas (Lead Timeline)

**Tabela SQL:** `ProspectsAçãoVendas`
**PK:** `CodAção` (int)
**Modulo MVP:** Timeline de atividades do Lead

### Campos mapeados

| Coluna SQL   | Alias API    | Tipo SQL   | Descricao                           |
|--------------|--------------|------------|--------------------------------------|
| CodAção      | id           | int (PK)   | PK da acao                          |
| CodProspect  | prospectId   | int (FK)   | Prospect relacionado                |
| Data         | date         | datetime   | Data da acao                        |
| Hora         | time         | nvarchar   | Hora                                |
| Descrição    | description  | nvarchar   | Relato do contato                   |
| Ação         | actionTypeId | int (FK)   | Tipo de acao (lookup DadosEntidades) |
| Vendedor     | sellerId     | int (FK)   | Vendedor que executou               |
| Probabilidade| probability  | int        | 0-100, probabilidade de fechamento  |

---

## 5. Orcamentos (Quotes)

**Tabela SQL:** `Orçamentos`
**PK:** `CodInterno` (int)
**Modulo MVP:** Orcamentos / Propostas

### Campos-chave

| Coluna SQL         | Alias API       | Descricao                               |
|--------------------|-----------------|-----------------------------------------|
| CodInterno         | id              | PK do orcamento                         |
| NumOrçamento       | quoteNumber     | Numero visivel do orcamento             |
| ClienteNome        | clientName      | Nome do cliente/prospect                |
| Prospect           | prospectId      | FK para Prospects                       |
| Vendedor           | sellerId        | FK para Clientes (vendedor)             |
| Status             | status          | A/P/L/E/C (ver legenda)                |
| Emissão            | issuedAt        | Data de emissao                         |
| TotalProdutos      | productsTotal   | Soma dos produtos                       |
| TotalServiços      | servicesTotal   | Soma dos servicos                       |
| ValorMonitoramento | monthlyValue    | Recorrencia mensal proposta             |
| Pontos             | points          | Pontos de alarme (somados dos produtos) |
| Etapa              | pipelineStage   | Etapa no pipeline/kanban                |
| ProbabilidadeOrçamento | probability | % de fechamento                         |

### Status do orcamento
| Valor | Significado                          |
|-------|--------------------------------------|
| A     | Aberto                               |
| P     | Aguardando aprovacao financeira      |
| L     | Liberado, aguardando abertura de OS  |
| E     | Em instalacao (com OSs pendentes)    |
| C     | Cancelado                            |

---

## 6. DadosEntidades (Lookup Table)

**Tabela SQL:** `DadosEntidades`
**PK:** `CodInterno` (int)
**Modulo MVP:** Lookups (marcas, grupos, origens, causas, etc.)

Tabela generica de cadastros simples. O campo `CodEntidade` identifica o TIPO
de dado (marca, grupo, origem, etc.) e `Descreve` e o nome legivel.

### Campos mapeados

| Coluna SQL   | Alias API   | Descricao                     |
|--------------|-------------|--------------------------------|
| CodInterno   | id          | PK                            |
| CodEntidade  | entityCode  | Tipo de entidade              |
| Codigo       | code        | Codigo do item                |
| Descreve     | label       | Descricao legivel             |
| Inativa      | inactive    | Se esta inativa               |

### Entidades relevantes para o MVP
- Marca de produto (CodEntidade para marcas)
- Grupo de produto
- Subgrupo de produto
- Origem do prospect
- Tipo de acao de vendas

---

## 7. OSs (Ordens de Servico)

**Tabela SQL:** `OSs`
**PK:** `CodInterno` (int)
**Modulo MVP:** Instalacoes / Servicos

### Campos-chave (subset)

| Coluna SQL      | Alias API     | Descricao                          |
|-----------------|---------------|------------------------------------|
| CodInterno      | id            | PK                                 |
| Ordem           | orderNumber   | Numero da OS                       |
| Cliente         | clientId      | FK Clientes                        |
| Técnico         | technicianId  | FK Clientes (tecnico)              |
| Vendedor        | sellerId      | FK Clientes (vendedor)             |
| Status          | status        | A=Aberta, B=Fechada, F=Faturada, C=Cancelada |
| Tipo            | type          | A/I/M/P/R/V (Ampliacao, Interna, Manutencao, Preventiva, Retirada, Vendas) |
| Prioridade      | priority      | A=Alta, N=Normal, B=Baixa          |
| DataAbertura    | openedAt      | Data de abertura                   |
| DataFechamento  | closedAt      | Data de fechamento                 |
| DataAgenda      | scheduledDate | Data agendada                      |
| Observações     | notes         | Descricao dos servicos             |
| Orçamento       | quoteNumber   | Orcamento vinculado                |

---

## Diagrama de Relacionamentos (simplificado)

```
DadosEntidades (Lookups)
    |
    +--[CodMarca]--> Produtos
    +--[Origem]----> Prospects
    +--[Etapa]-----> EtapasOrçamento

Prospects ───────────────> Orçamentos ──────> OSs
  (CodProspect)              (Prospect)        (Orçamento)
    |                           |
    +-> ProspectsAçãoVendas     +-> OrçamentosProdutos
         (Timeline)                  (Itens do orcamento)
                                       |
                                       +-> Produtos
                                            |
                                            +-> ProdutosKits
                                                 (composicao do kit)
```

---

## 8. Clientes (Multi-role: clients, vendors, technicians)

**Tabela SQL:** `Clientes`
**PK:** `CodCliente` (int)
**Modulo MVP:** Clientes, Vendedores, Tecnicos (read-only subset)

A tabela Clientes armazena diferentes tipos de cadastro (Tipo):
- `C` = Cliente
- `V` = Vendedor
- `F` = Fornecedor
- `T` = Transportadora
- `Z` = Tecnico
- `U` = Funcionario
- `A` = Ambos (Cliente e Fornecedor)

### Campos mapeados (subset read-only)

| Coluna SQL         | Alias API      | Tipo SQL              | Descricao                              |
|--------------------|----------------|-----------------------|-----------------------------------------|
| CodCliente         | id             | int (PK)              | Codigo do cliente                      |
| Nome               | name           | nvarchar              | Nome ou razao social                   |
| Fantasia           | tradeName      | nvarchar              | Nome fantasia                          |
| CGCCPF             | document       | nvarchar              | CPF ou CNPJ                            |
| Endereço           | address        | nvarchar              | Logradouro                             |
| Bairro             | neighborhood   | nvarchar              | Bairro                                 |
| Cidade             | city           | nvarchar              | Cidade                                 |
| Estado             | state          | nvarchar              | UF                                     |
| CEP                | zipCode        | nvarchar              | CEP                                    |
| Fone1              | phone          | nvarchar              | Telefone principal                     |
| Email              | email          | nvarchar              | Email                                  |
| Tipo               | type           | char(1)               | Tipo do cadastro (C/V/F/T/Z/U/A)      |
| Modalidade         | modality       | char(1)               | V=Venda, L=Locacao, R=Rastreamento    |
| Vendedor           | sellerId       | int (FK self)         | Vendedor responsavel                   |
| Técnico            | technicianId   | int (FK self)         | Tecnico responsavel                    |
| ValorNF            | monthlyValue   | decimal               | Valor recorrencia mensal               |
| Cancelamento       | cancelledAt    | datetime              | Data de cancelamento                   |
| PontosAlarme       | alarmPoints    | int                   | Pontos de alarme instalados            |
| NívelSegurança     | securityLevel  | char(1)               | 1=MAlto, 2=Alto, 3=Normal, 4=Baixo, 5=MBaixo |

---

## 9. OrçamentosProdutos (Quote Line Items)

**Tabela SQL:** `OrçamentosProdutos`
**PK:** `CodInterno` (int)
**FK:** `Planílha` → `Orçamentos.Planílha`

| Coluna SQL       | Alias API      | Tipo SQL   | Descricao                              |
|------------------|----------------|------------|----------------------------------------|
| CodInterno       | id             | int (PK)   | PK                                     |
| Planílha         | quoteSheet     | int (FK)   | Planilha do orcamento                  |
| CodProduto       | productId      | int (FK)   | Produto                                |
| Descrição        | description    | nvarchar   | Nome do produto                        |
| Quantidade       | quantity       | decimal    | Quantidade                             |
| Unitário         | unitPrice      | decimal    | Valor unitario sem desconto            |
| Total            | total          | decimal    | Total sem desconto                     |
| Líquido          | netPrice       | decimal    | Valor unitario com desconto            |
| TotalLiquido     | netTotal       | decimal    | Total com desconto                     |
| GrupoOrçamento   | quoteGroup     | nvarchar   | Grupo no orcamento                     |
| LocalInstalação  | installLocation| nvarchar   | Local de instalacao                    |

---

## 10. OrçamentosServiçosAdicionais (Quote Services)

**Tabela SQL:** `OrçamentosServiçosAdicionais`
**PK:** `CodInterno` (int)
**FK:** `Planílha` → `Orçamentos.Planílha`

| Coluna SQL     | Alias API      | Tipo SQL   | Descricao                    |
|----------------|----------------|------------|------------------------------|
| CodInterno     | id             | int (PK)   | PK                           |
| Planílha       | quoteSheet     | int (FK)   | Planilha do orcamento        |
| CodServiço     | serviceId      | int (FK)   | Servico adicional            |
| ValorServiço   | serviceValue   | decimal    | Valor mensal                 |
| Quantidade     | quantity       | decimal    | Quantidade                   |
| Manutenção     | maintenance    | bit        | Se tera manutencao           |
| Observações    | notes          | nvarchar   | Observacoes                  |

---

## Mapeamento Modulos MVP ↔ Tabelas SQL

| Modulo Frontend     | Tabela Principal     | Tabelas Secundarias                    |
|---------------------|----------------------|----------------------------------------|
| Pipeline / Kanban   | Prospects            | ProspectsAçãoVendas, EtapasOrçamento   |
| Orcamentos / Propostas | Orçamentos       | OrçamentosProdutos, OrçamentosServiçosAdicionais |
| Equipamentos        | Produtos             | DadosEntidades (marca, grupo)          |
| Kits                | ProdutosKits         | Produtos (WHERE ProdutoKit=1)          |
| Instalacoes / OS    | OSs                  | OSProdutos, OSServiços                 |
| Usuarios            | Senhas               | —                                      |

---

## Notas sobre o Schema Legado

1. **Acentos nos nomes de tabela e coluna** — O SQL Server permite acentos
   (`Orçamentos`, `Descriçao`, `Planílha`). O Prisma mapeia via `@@map` e `@map`.

2. **Tipo `Planílha`** — E um inteiro que identifica uma "sessao" de
   registros. Muitas tabelas-filha usam `Planílha` em vez de FK direta.

3. **`DadosEntidades` e generico** — Marcas, grupos, origens e dezenas de
   outros cadastros simples vivem na mesma tabela, diferenciados por
   `CodEntidade`.

4. **Clientes = multiplos papeis** — A tabela `Clientes` armazena clientes,
   vendedores, tecnicos e fornecedores. O campo `TipoCliente` diferencia.

5. **Sem soft-delete padrao** — Algumas tabelas usam `Cancelado` ou `Inativo`,
   outras usam `Status = 'C'`. Cada modulo trata individualmente.

6. **Decimal como string no TypeORM** — O TypeORM retorna decimais como string
   por padrao no MSSQL. O Prisma retorna `Decimal` (Prisma.Decimal).
