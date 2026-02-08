### AceiteAnexos
- **Descrição:** São arquivos anexos de um aceite digital, o Service não manipula diretamente
- **Relacionamento:** 
- `Ace_Codigo` → `AceiteDigital.Ace_Codigo`

---

### AceiteDigital
- **Descrição:** Aceites digitais de documentos. Manipulado pelo IntegraService, o sistema apenas visualiza o Ace_Status para validar os assinados
- **Relacionamento:** 
- `Cli_Codigo` → `Clientes.CodCliente`
- `Orc_Codigo` → `Orçamentos.CodInterno` 
- `Adt_Codigo` → `Aditivos.CodInterno`
- `Distrato_Codigo` → `ClientesCancelamentos.CodInterno`
- **Ace_Tipo:**
- `A`: Aditivo
- `C`: Contrato
- `O`: Orçamento
- `D`: Cancelamento
- **Ace_Status:**
- `A`: Aguardando aceite
- `F`: Aceito
- `C`: Cancelado
- **Campos:**
- `Ace_Codigo`: Código do aceite
- `Ace_Tipo`: Tipo do aceite, documento que ele se relaciona
- `Cli_Codigo`: Código do cliente
- `Orc_Codigo`: Código do orçamento
- `Adt_Codigo`: Código do aditivo
- `Distrato_Codigo`: Código do distrato
- `Ace_Status`: Status do aceite (se está em aberto, aceito ou cancelado)

---

### AceiteDigitalEnvioTestemunha
- **Descrição:** Identifica a assinatura ou não dos aceites por parte das testemunhas, manipulado pelo IntegraService
- **Relacionamento:** 
- `AceiteCodigo` → `AceiteDigital.Ace_Codigo`
- `CodInternoTestemunha` → `AceiteDigitalTestemunha.CodInterno`

---

### AceiteDigitalEventos
- **Descrição:** São os eventos ocorridos no aceite, manipulado pelo IntegraService
- **Relacionamento:** 
- `Ace_Codigo` → `AceiteDigital.Ace_Codigo`

---

### AceiteDigitalTestemunha
- **Descrição:** São as testemunhas do aceite, manipulado pelo IntegraService
- **Relacionamento:** 
- `CodCliente` → `Clientes.CodCliente`
- `Unidade` → `Unidades.CodUnidade`

---

### Adiantamentos
- **Descrição:** Adiantamentos financeiros feitos para fornecedores ou recebido de clientes
- **Relacionamento:** 
- `CliFor` → `Clientes.CodCliente`
- `Empresa` → `Empresas.CodEmpresa`
- `CodAdi` → `Adiantamentos.CodInterno`
- `Planílha` → `MovimentoCaixa.Planílha`
- **Campos:**
- `CodInterno`: código interno PK do adiantamento
- `Motivo`: descrição do motivo do adiantamento
- `Planílha`: código da planílha do movimento de caixa que gerou o adiantamento
- `CliFor`: código do cliente ou fornecedor
- `Data`: data da ocorrência do adiantamento
- `Tipo`: tipo de adiantamento, F - para Fornecedor, C - para Cliente
- `Empresa`: código da empresa do adiantamento
- `NumAdiantamento`: contador de adiantamento
- `Valor`: valor do adiantamento ou baixa dele
- `Saldo`: saldo do adiantamento
- `AdiMov`: A - criação do adiantamento, M - movimento (baixa) do adiantamento
- `CodAdi`: CodInterno do adiantamento ao qual está ocorrendo a baixa
- **Regras:**
- Quando um adiantamento é criado ele cria um registro onde o campo AdiMov é `A`, após isso, a cada movimento de baixa (recebimento ou pagamento) vai gerar um registro `M` com o campo CodAdi preenchido com o código do adiantamento que está sofrendo movimento

---

### AditivosServiçosAdicionais
- **Descrição:** Serviços adicionais a serem incluídos/excluídos em um aditivo de contrato
- **Relacionamento:** 
- `CodAditivo` → `ClientesAditivos.CodInterno`
- `CodServiço` → `ServiçosAdicionais.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK 
- `CodAditivo`: código do aditivo que está vinculado
- `CodServiço`: código do serviço adicional
- `ValorServiço`: valor do serviço, caso negativo é a retirada do serviço

---

### AditivosVeículos
- **Descrição:** Veículos a serem incluídos ou retirados pelo aditivo
- **Relacionamento:** 
- `CodAditivo` → `ClientesAditivos.CodInterno`
- `CodVeículo` → `GRVeículos.CodInterno`
- `CodServiço` → `ServiçosAdicionais.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK 
- `CodAditivo`: código do aditivo que está vinculado
- `CodVeículo`: código do veículo que está vinculado ao aditivo
- `CodServiço`: código do serviço adicional

---

### AditivosVeículosServiçosAdicionais
- **Descrição:** Serviços adicionais vinculados aos veículos de um aditivo
- **Relacionamento:** 
- `CodAditivo` → `ClientesAditivos.CodInterno`
- `CodVeículo` → `GRVeículos.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK 
- `CodAditivo`: código do aditivo que está vinculado
- `CodVeículo`: código do veículo que está vinculado ao aditivo

---

### Agenda
- **Descrição:** Agendamentos feitos no sistema
- **Relacionamento:** 
- `CodContato` → `ProspectsContatos.CodContato`
- `CodCancelamento` → `ClientesCancelamentos.CodInterno`
- `OrçamentoVinculado` → `Orçamentos.CodInterno`
- **Campos:**
- `CodAtividade`: código interno PK 
- `Data`: data do evento
- `Hora`: hora do evento
- `Duração`: duração do evento
- `Usuário`: usuário ao qual o agendamento está vinculado
- `Status`: A - A fazer, X - Feito
- `CodContato`: Código do contato vinculado ao evento
- `CodCancelamento`: Código do processo de cancelamento de cliente vinculado ao evento
- `OrçamentoVinculado`: Código do orçamento vinculado ao evento

---

### ApoliceSeguradora
- **Descrição:** Apólice de seguro criada via integração com seguradora
- **Relacionamento:** 
- `CodCliente` → `Clientes.CodCliente`
- `CodClienteServicoAdicional` → `ClientesServiçosAdicionais.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK 
- `CodCotacao`: código da apolice na seguradora
- `CodCliente`: código do cliente detentor da apólice
- `CodClienteServicoAdicional`: código interno PK do serviço adicional do cliente ao qual a apólite está ligada
- `Status`: A - A ativa, C - Cancelada

---

### Áreas
- **Descrição:** Áreas de atendimento da empresa
- **Relacionamento:** 
- `Unidade` → `Unidades.CodUnidade`
- **Campos:**
- `CodÁrea`: código da área
- `DescrÁrea`: descrição da área, nome informado
- `Unidade`: código da unidade ao qual a área está cadastrada

---

### Armas
- **Descrição:** Cadastro das armas que a empresa dispõe
- **Relacionamento:** 
- `Unidade` → `Unidades.CodUnidade`

---

### Bancos
- **Descrição:** Cadastro de bancos brasileiros
- **Campos:**
- `CodBanco`: código do banco na Febraban
- `Banco`: nome do banco

---

### BancosEmpresa
- **Descrição:** Configurações para emissão de boletos bancários (integração bancária)
- **Relacionamento:** 
- `CodBanco` → `Bancos.CodBanco`
- `Empresa` → `Empresas.CodEmpresa`
- `FormaPagamento` → `FormasPagto.CodFormaPagto`
- **Campos:**
- `CodBanco`: código do banco na Febraban
- `Empresa`: empresa em que a configuração está vinculada
- `FormaPagamento`: forma de pagamento em que a configuração está vinculada

---

### BeneficioFiscal
- **Descrição:** Cadastro de benefícios fiscais
- **Relacionamento:** 
- `CodUnidade` → `Unidades.CodUnidade`
- **Campos:**
- `CodInterno`: código interno PK
- `CFOP`: cfop em que o benefício está vinculado
- `CST`: cst em que o benefício está vinculado
- `UF`: estado em que o benefício está cadastrado
- `CodBeneficio`: código do benefício

---

### BoletosPJ
- **Descrição:** Tabela temporária com dados de boletos gerados no PJBank e seu vínculo com o contas a receber

---

### BraspagProcessamento
- **Descrição:** Log de eventos de erros ou sucessos em cobranças de cartão de crédito
	
---

### CaixaCompetência
- **Descrição:** Apuração de movimentos por regime de competência
- **Relacionamento:** 
- `CodCliente` → `Clientes.CodCliente`
- `Empresa` → `Empresas.CodEmpresa`
- `CentroResultado` → `SubContas.CodInterno`
- `CentroCusto` → `Centros.CodInterno`
- `CodFatLote` → `FaturamentosRealizados.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `CodCliente`: cliente ao qual o movimento está vinculado
- `Planílha`: planílha do movimento
- `Empresa`: código da empresa
- `CentroResultado`: conta que foi movimentada
- `CentroCusto`: centro de custo vinculado
- `Competência`: mês/ano de competência do movimento
- `Entrada`: valor de crédito
- `Saída`: valor de débito
- `Complemento`: descritivo do movimento
- `DataLcto`: data em que o lançamento foi feito
- `Usuário`: usuário responsável pelo movimento
- `Operação`: ação que gerou o movimento
- `Eliminado`: se 0 ativo, caso contrário foi eliminado
- `CodFatLote`: faturamento realizado que gerou o movimento

---

### CaixaConciliação
- **Descrição:** Conciliações de caixa
- **Relacionamento:** 
- `CodConta` → `ContasCaixa.CodCaixa``
- **Status:**
- `A`: aberta
- `X`: encerrada
- `C`: cancelada
- **Campos:**
- `CodInterno`: código interno PK
- `CodConta`: conta de caixa da conciliação
- `Status`: status da conciliação
- `DataConciliação`: data da conciliação (encerramento do caixa)
- `LançamentosAté`: data de fechamento dos lançamentos
- `SaldoAnterio`: saldo da conciliação anterior
- `SaldoExtrato`: saldo que consta no extrato bancário
- `SaldoConciliado`: saldo final da conciliação
- `Planílha`: planílha que identifica a conciliação nos movimentos
- `UsuárioEncerramento`: quem encerrou a conciliação
- `EncerradoEm`: data em que foi encerrado
- `CanceladaEm`: data em que foi cancelada
- `CanceladaPor`: quem cancelou a conciliação

---

### CaixaConciliaçãoLançamentos
- **Descrição:** Itens da conciliação de caixa
- **Relacionamento:** 
- `Planílha` → `CaixaConciliação.Planilha`
- `CodLançamento` → `MovimentoCaixa.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `Planílha`: planílha da conciliação
- `CodLançamento`: código do lançamento de caixa conciliado
- `ValorConciliado`: valor que foi contabilizado na conciliação

---

### CampanhaMarketingBoleto
- **Descrição:** Boletos gerados como campanha de marketing, são boletos de propostas de contratação de serviços, que quando quitados incluem o serviço adicional no cliente
- **Relacionamento:** 
- `Empresa` → `Empresas.CodEmpresa`
- `CodFormaPagamento` → `FormasPagto.CodFormaPagto`
- `CodServiçoAdicional` → `ServiçosAdicionais.CodInterno`
- `CentroResultados` → `SubContas.CodInterno`
- **Status:**
- `A`: aberta
- `X`: encerrada
- `C`: cancelada
- **Campos:**
- `CodCampanha`: código interno PK
- `Descrição`: nome dado a campanha
- `Empresa`
- `Usuário`: quem gerou a campanha
- `Geração`: data de criação
- `CodFormaPagamento`: forma de pagamento selecionada, relaciona ao banco e boleto
- `CodServiçoAdicional`: serviço adicional que está sendo proposto
- `Status`
- `UsuárioEncerramento`: quem encerrou a campanha
- `Encerramento`: data de encerramento
- `PrazoVencimento`: tempo que a campanha fica ativa
- `ValorServiço`: valor do serviço adicional que está sendo proposto
- `CentroResultados`: conta de receita vinculada ao serviço adicional proposto

---

### CampanhasVenda
- **Descrição:** Configuram a forma como serão pagas as comissões de vendedores
- **Relacionamento:** 
- `Unidade` → `Unidades.CodUnidade`
- **VendaTipo:**
- `0`: faturamento da OS
- `1`: primeiro recebimento dos produtos e serviços
- `2`: parcelado no recebimento de cada duplicata
- `3`: fechamento da OS 
- `4`: liberação do Orçamento
- **MonitoraGeração:**
- `0`: gerar junto com a comissão de vendas (produtos e serviços)
- `1`: no recebimento de cada mensalidade
- `2`: ao gerar o faturamento em lote da mensalidade
- **TipoSoma:**
- `0`: considera o mês corrente
- `1`: considera todo o prazo da campanha
- `2`: dia de corte para mês
- **TipoCliente:**
- `0`: todos os clientes
- `1`: somente novos (prospects)
- `2`: somente existentes (ampliação)
- **TipoPagamentoPrevenda:**
- `0`: não comissiona
- `1`: uma fração do percentual calculado para o vendedor
- `2`: valor fixo por cliente novo
- **GRFormaGeração:**
- `0`: padrão (valor da mensalidade do orçamento)
- `1`: por veículo com percentual proporcional
- `2`: valor fixo por tipo de veículo
- `3`: por veículo por percentual sobre o valor do veículo
- `4`: por veículo com percentual sobre o tipo de serviço 
- **Campos:**
- `CodCampanha`: código interno PK
- `Descrição`: nome dado a campanha de comissões
- `DataInício`: início da vigência da campanha
- `DataFim`: fim da vigência da campanha
- `VendaTipo`: momento em que é gerada a comissão
- `VendaSeparaProdServ`: booleano que indica se informa separadamente produtos e serviços
- `VendaAcimaServ`: valor mínimo para gerar a comissão de serviços
- `VendaServUnitário`: booleano para considerar o valor unitário na configuração do VendaAcimaServ
- `VendaMinProduto`: percentual mínimo para gerar a comissão de produtos
- `VendaProduto`: percentual máximo da comissão de produtos (quando VendaMinProduto e VendaProduto são diferentes o sistema faz um calculo de proporcionalidade do lucro do orçamento com a lucratividade esperada)
- `VendaMinServ`: percentual mínimo para serviços
- `MonitoraTipo`: 1 - valor total da mensalidade, 2 - comissão apurada por tipo de serviço adicional
- `MonitoraVenda`: percentual de comissão sobre a mensalidade (descontando a locação)
- `MonitoraLocado`: percentual de comissão sobre a locação
- `MonitoraParcelas`: quantidade de parcelas que serão pagas para a comissão sobre a mensalidade
- `MonitoraGeração`: momento em que a comissão sobre a mensalidade é gerada
- `Unidade`
- `PagaInadimplente`: booleano que identifica se gera a comissão caso o cliente tenha outras duplicatas vencidas
- `CampanhaGrupo`: identifica um grupo de campanhas (geradas por critérios de faixas)
- `LTV`: booleano para considerar o prazo de contrato para calcular o percentual da comissão da mensalidade
- `TipoSoma`: em grupos de campanhas determina como somar as condições para encontrar a faixa em que deve comissionar
- `DiaCorte`: quando o TipoSoma=2 determina o dia do mês que encerra o ciclo do grupo
- `VendasDe`: para grupos de campanhas determina a faixa inicial dessa regra em valores vendidos
- `VendasAté`: para grupos de campanhas determina a faixa final dessa regra em valores vendidos
- `MensalDe`: para grupos de campanhas determina a faixa inicial dessa regra em valores de mensalidades
- `MensalAté`: para grupos de campanhas determina a faixa final dessa regra em valores de mensalidades
- `ContratosDe`: para grupos de campanhas determina a faixa inicial dessa regra em quantidade de contratos
- `ContratosAté`: para grupos de campanhas determina a faixa final dessa regra em quantidade de contratos
- `DescontosDe`: para grupos de campanhas determina a faixa inicial dessa regra em percentual de descontos
- `DescontosAté`: para grupos de campanhas determina a faixa final dessa regra em percentual de descontos
- `TipoCliente`: tipo de cliente que deve entrar nessa faixa de comissão
- `TipoPagamentoPrevenda`: determina como será paga a comissão ao prévendas
- `PercentualMonitoramentoPrevenda`: quanto TipoPagamentoPrevenda=1 informa o percentual da comissão a ser aplicado
- `ValorMonitoramentoPrevenda`: valor fixo a ser pago para clientes novos ao prevenda, quando TipoPagamentoPrevenda=2
- `PercentualVendaPrevenda`: percentual a ser pago de comissão de produtos e serviços ao prevendas
- `PagaSemContrato`: booleano que identifica se a comissão será paga quando o cliente não tem contrato assinado
- `ToleranciaInadimplencia`: dias de tolerância do vencimento para considerar o cliente com duplicatas vencidas
- `GeraTrocaContratoVencido`: identifica se gera a comissão de mensalidades sobre trocas de titularidade onde já venceu o prazo de contrato original
- `GRFormaGeração`: forma como será gerada a comissão em orçamentos de rastreamento veicular
- `VeículoPercentual`: percentual a ser pago sobre o valor do veículo na comissão de mensalidade
- `GRPercMonitoramento`: percentual a ser pago sobre o valor do veículo na comissão de mensalidade quando GRFormaGeração=4
- `GRPercLocação`: percentual a ser pago sobre o valor do veículo na comissão de mensalidade quando GRFormaGeração=4
- `ApurarFim`: booleano que determina que o enquadramento e geração das comissões só vai ocorrer ao final do ciclo da campanha
- `ValorMensalAcima`: orçamentos com valor mensal acima do valor informado (quando diferente de 0), serão contados como um novo cliente e comissionado dessa forma
- `LogAltera`: log de alterações dos dados da campanha
- `GRVeiAtivo`: booleano que determina que o enquadramento e geração das comissões só vai ocorrer ao final do ciclo da campanha

---

### CampanhasVendaPendentes
- **Descrição:** São processos de comissão que estão aguarando geração, é utilizada quando na tabela CampanhasVenda o campo ApurarFim está como 'true'
- **Relacionamento:** 
- `Empresa` → `Empresas.CodEmpresa`
- `Unidade` → `Unidades.CodUnidade`
- `CodCliente` → `Clientes.CodCliente`
- `CampanhaGrupo` → `CampanhasVenda.CodCampanha`
- `CampanhaCalculada` → `CampanhasVenda.CodCampanha`
- **Origem:**
- `O`: orçamento, fechamento e liberação
- `F`: faturamento de OS 
- `S`: fechamento de OS 
- **Campos:**
- `CodInterno`: código interno PK
- `DataGeracao`: data em que foi criado o processo
- `Usuário`: quem gerou o processo
- `Processo`: ação que gerou a pendência, (liberação de orçamento, fechamento ou faturamento de OS)
- `CampanhaGrupo`: grupo de campanha que gerou o processo
- `CodCliente`
- `Empresa`
- `Unidade`
- `Origem`: origem do processo
- `Planilha`: planílha da OS
- `PlanilhaOrcamento`: planílha do orçamento
- `ClienteNovo`: booleano que determina se é um novo cliente
- `Processado`: booleano que determina se o processo foi gerado e a comissão gerada
- `ProcessadoEm`: data de processamento
- `ProcessadoPor`: quem processou
- `CampanhaCalculada`: campanha na qual se enquadrou a faixa de comissão
- `ComiProd`: comissão de produtos calculada
- `ComiServ`: comissão de serviços calculada
- `ValorMensal`: comissão de mensalidade calculada

---

### CampanhasVendaServiçosAdicionais
- **Descrição:** Configuração de percentuais de comissão a gerar para serviços adicionais vinculados a uma campanha de comissão
- **Relacionamento:** 
- `CodCampanha` → `CampanhasVenda.CodCampanha`
- `CodServiçoAdicional` → `ServiçosAdicionais.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `CodCampanha`: campanha vinculada
- `CodServiçoAdicional`: código do serviço adicional vinculado
- `Percentual`: perncentual a ser pago de comissão sobre o valor do serviço
- `MesesGerar`: quantidade de meses a pagar de comissão para o serviço

---

### CampanhasVendaTiposVeículo
- **Descrição:** Configuração de valor de comissão a gerar para rastreamento por tipo de veículo
- **Relacionamento:** 
- `CodCampanha` → `CampanhasVenda.CodCampanha`
- `CodTipo` → `DadosEntidades.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `CodCampanha`: campanha vinculada
- `CodTipo`: tipo de veículo
- `ValorFixo`: valor por veículo

---

### CampanhasVendaVeículosServiçosAdicionais
- **Descrição:** Configuração de percentuais de comissão a gerar para serviços adicionais de veículos vinculados a uma campanha de comissão
- **Relacionamento:** 
- `CodCampanha` → `CampanhasVenda.CodCampanha`
- `CodServiçoAdicional` → `ServiçosAdicionais.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `CodCampanha`: campanha vinculada
- `CodServiçoAdicional`: código do serviço adicional vinculado
- `Percentual`: perncentual a ser pago de comissão sobre o valor do serviço

---

### CampanhasVendaVendedores
- **Descrição:** Vendedores que estão integrando uma campanha de comissão
- **Relacionamento:** 
- `CodCampanha` → `CampanhasVenda.CodCampanha`
- `CodCliente` → `Clientes.CodCliente`
- **Campos:**
- `CodInterno`: código interno PK
- `CodCampanha`: campanha vinculada
- `CodCliente`: código do vendedor

---

### CanaisWhatsMessageHub
- **Descrição:** Canais da integração Whatsapp (manipulado pelo MessageHub)

---

### CanaisWhatsMessageHubEmpresa
- **Descrição:** Canais da integração Whatsapp por empresa (manipulado pelo MessageHub)

---

### CartaoCliente
- **Descrição:** Cartão de crédito cadastrado para pagamentos pelo portal do cliente (manipulado pelo IntegraService)

---

### CartasCobrança
- **Descrição:** Tabela com dados temporários dos clientes pendentes de geração de cartas de cobrança

---

### CartõesPJ
- **Descrição:** Tabela temporária com dados de cobranças de cartão gerados no PJBank e seu vínculo com o contas a receber

---

### CentroResultados
- **Descrição:** Tipos de contas do plano de contas, equivalem a uma conta sintética contábil
- **ReceitaDespesa:**
- `R`: receitas
- `D`: despesas
- `A`: ativo
- `P`: passivo
- **Rateia:**
- `0`: sem rateio
- `1`: rateio fixo
- `2`: rateio variável
- **RatResultados:**
- `0`: sem rateio
- `1`: rateio fixo
- `2`: rateio variável
- **RateiaEmpresa:**
- `0`: sem rateio
- `1`: rateio fixo
- `2`: rateio variável
- **Ordem:**
- `1`: ativo
- `2`: passivo
- `3`: receitas
- `4`: despesas
- **Campos:**
- `CodInterno`: código interno PK
- `Descrição`: nome da conta
- `ReceitaDespesa`: identifica se trata-se de despesa ou receita
- `Tipo`: grupo de contas no plano de contas
- `Rateia`: booleano que determina se a despesa será rateada entre os clientes para calcular os resultados por cliente
- `Ordem`: ordem em que vai aparecer no centro de contas
- `TpRateio`: identifica se o rateio de despesas para os clientes será fixo ou variavel (fixo, todos os clientes; variavel, considera a quantidade de deslocamentos)
- `RatResultados`: identifica se o rateio para centros de custos será fixo ou variavel (fixo, cadastrado; variavel, o usuário vai informar ao lançar o movimento) depreciado, agora grava por unidade na tabela CentroResultadosRateio
- `RateiaEmpresa`: identifica se o rateio para empresas será fixo ou variavel (fixo, cadastrado; variavel, o usuário vai informar ao lançar o movimento)
- `ApuraResultado`: booleano que identifica se deve somar como receita/despesas para gerar a análise orçamentária
- `OrdemPersonalizada`: ordem personalizada para aparecer no plano de contas
- `NaoBloquearAcimaTeto`: booleano que permite informar não bloquear lançamentos nessa conta quando existe um teto configurado
- `LogAlterações`: log das alterações feitas

---

### CentroResultadosEmpresas
- **Descrição:** Cadastro de percentuais fixos de rateio para empresas
- **Relacionamento:** 
- `Empresa` → `Empresas.CodEmpresa`
- `CodConta` → `CentroResultados.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `Empresa`
- `CodConta`: centro de resultados vinculado
- `Percentual`: percentual a ser calculado para a empresa

---

### CentroResultadosPreviões
- **Descrição:** Cadastro de previsões com os dados do ano base para centro de resultados
- **Relacionamento:** 
- `Empresa` → `Empresas.CodEmpresa`
- `CentroResultados` → `CentroResultados.CodInterno`
- `CentroCustos` → `Centros.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `CentroResultados`: centro de resultados vinculado
- `Indice`: percentual a ser aplicado mês a mês
- `Ano`: ano base
- `ValorBase`: valor a ser aplicado o índice
- `Empresa`
- `CentroCustos`: centro de custos vinculado

---

### CentroResultadosPrevisõesDiárias
- **Descrição:** Cadastro de previsões diárias de um centro de resultados (utilizado no fluxo diário de caixa)
- **Relacionamento:** 
- `Empresa` → `Empresas.CodEmpresa`
- `CentroResultados` → `CentroResultados.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `Empresa`
- `Data`: dia da previsão
- `Previsto`: valor previsto para o dia
- `CentroResultados`: centro de resultados vinculado

---

### CentroResultadosPrevisõesMensais
- **Descrição:** Cadastro de previsões mensais de um centro de resultados
- **Relacionamento:** 
- `Empresa` → `Empresas.CodEmpresa`
- `CentroResultados` → `CentroResultados.CodInterno`
- `CentroCustos` → `Centros.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `Mês`: mês da previsão
- `Ano`: ano da previsão
- `Manual`: booleano que identifica se foi digitado ou calculado por valor e indice
- `Previsto`: valor previsto para o mês
- `CentroResultados`
- `Reajuste`: booleano que identifica se aplica o reajuste do indice neste mês na tela de lançamento
- `Empresa`
- `CentroCustos`: centro de custos vinculado

---

### CentroResultadosRateio
- **Descrição:** Configura por unidade o tipo de rateio da conta com para os centros de custos
- **Relacionamento:** 
- `Unidade` → `Unidades.CodUnidade`
- `CentroResultados` → `CentroResultados.CodInterno`
- **RatResultados:**
- `0`: sem rateio
- `1`: rateio fixo
- `2`: rateio variável
- **Campos:**
- `CodInterno`: código interno PK
- `CentroResultados`
- `Unidade`
- `RatResultados`: identifica se o rateio para centros de custos será fixo ou variavel (fixo, cadastrado; variavel, o usuário vai informar ao lançar o movimento)

---

### Centros
- **Descrição:** Cadastro de Centros de Custos
- **Relacionamento:** 
- `Unidade` → `Unidades.CodUnidade`
- **Campos:**
- `CodInterno`: código interno PK
- `Unidade`: Unidade onde o centro de custo atua, se 0 vale para todas
- `Descrição`: Descrição/Nome do centro de custo
- `ContaExportação`: Utilizada para exportação de dados contábeis
- `Inativo`: booleano que identifica se a conta está inativa e não deve aparecer
- `UnidadesExcessões`: lista de unidades separadas por ; onde o centro de custo não deve constar (quando a Unidade=0)
- `Destaque`: booleano que identifica se os lançamentos do centro de custo devem ser destacados nos relatórios de caixa

---

### CentrosCAC
- **Descrição:** Cadastro de Centros de Custos para Apuração do CAC (Custo de Aquisição de Clientes)
- **Relacionamento:** 
- `CentroResultados` → `CentroResultados.CodInterno`
- `Centros` → `Centros.CodInterno`
- **Tipo:**
- `M`: Marketing e Publicidade
- `V`: Vendas
- **Campos:**
- `CodInterno`: código interno PK
- `CentroResultados`
- `CentroCusto`
- `Tipo`: Determina se as despesas estão ligadas ao marketing ou as vendas

---

### CentrosContas
- **Descrição:** Cadastro de Percentuais para Centros de Resultados com Rateio Fixo
- **Relacionamento:** 
- `CodConta` → `CentroResultados.CodInterno`
- `CodCentro` → `Centros.CodInterno`
- `Empresa` → `Empresas.CodEmpresa`
- **Campos:**
- `CodInterno`: código interno PK
- `CodCentro`
- `CodConta`
- `Percentual`: Percentual a ser aplicado
- `Empresa`: em geral nulo, só é preenchido se configurado que o % será por empresa

---

### CentrosEmpresasExporta
- **Descrição:** Cadastro de conta de exportação por empresa para exportações contábeis
- **Relacionamento:** 
- `CodCentro` → `Centros.CodInterno`
- `Empresa` → `Empresas.CodEmpresa`
- **Campos:**
- `CodInterno`: código interno PK
- `CodCentro`
- `Empresa`
- `ContaExportacao`: conta de exportação

---

### Cep
- **Descrição:** Cadastro de CEPs (atualizado pelo WS quando disponível)

---

### CepLocalidade
- **Descrição:** Cadastro de CEPs de localidades (em especial em municípios sem CEP por rua)

---

### CFOPCategoria
- **Descrição:** Determina que categorias de produtos podem ser lançadas por CFOP
- **Relacionamento:** 
- `CodCategoria` → `DadosEntidades.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `CFOP`: CFOP em que a categoria está inclusa
- `CodCategoria`

---

### Chaves
- **Descrição:** Cadastro das chaves (centrais de monitoramento) vinculadas ao cliente
- **Relacionamento:** 
- `EmpresaSigma` → `ConexãoSigma.CodInterno`
- `CodCliente` → `Clientes.CodCliente`
- **Campos:**
- `CodInterno`: código interno PK
- `CodCliente`
- `Chave`: Chave/SP/PS que identifica o a central de alarme no monitoramento
- `Partição`: partição da central
- `EmpresaSigma`
- `IDMonitoramento`: Em algumas integrações traz o código que identifica chave/partição no sistema de monitoramento
- `IDParticao`: Em algumas integrações traz o código da partição no sistema de monitoramento

---

### Chamados
- **Descrição:** São os deslocamentos feitos para atender um evento de alarme, são buscados do software de monitoramento. Utilizado para calcular os custos de atendimento para o relatório de resultado por cliente
- **Relacionamento:** 
- `Unidade` → `Unidades.CodUnidade`
- `EmpresaSigma` → `ConexãoSigma.CodInterno`
- `CodCliente` → `Clientes.CodCliente`
- **Campos:**
- `CodInterno`: código interno PK
- `Chave`: Chave/SP/PS que identifica o a central de alarme no monitoramento
- `Data`: Data das ocorrências
- `Quantidade`: Quantidade de ocorrências no dia
- `Unidade`
- `Partição`: partição da central
- `EmpresaSigma`
- `CodCliente`

---

### Chaves_Historico
- **Descrição:** Mesmo cadastro de chaves mas com as datas em que a chave foi incluída/excluída do cadastro de clientes, é gerado por trigger no banco e utilizado em BI

---

### ChequesEmitidos
- **Descrição:** Cadastro de cheques emitidos pela empresa
- **Relacionamento:** 
- `ContaCaixa` → `ContasCaixa.CodCaixa`
- `CodBanco` → `Bancos.CodBanco`
- `Unidade` → `Unidades.CodUnidade`
- `Planílha` → `MovimentoCaixa.Planílha`
- **Tipo:**
- `A`: A compensar
- `X`: Compensado
- `C`: Cancelado
- **Campos:**
- `CodInterno`: código interno PK
- `ContaCaixa`
- `Número`: Número do Cheque
- `Emitido`: Data de emissão
- `CompensaEm`: Data em que deve ser descontado
- `ValorCheque`: Valor do cheque
- `Planílha`: Planílha do movimento de caixa que gerou o cheque
- `Nominal`: Nome para qual foi emitido o cheque
- `Telefone`: Telefone do recebedor
- `Status`: Status do cheque
- `Movimento`: Data em que o cheque foi compensado ou cancelado
- `Motivo`: Motivo de cancelamento
- `Empresa`
- `Documento`: Duplicata ou documento ao qual o cheque está vinculado
- `Apresentação`: Data em que o cheque foi entregue na mão do recebedor
- `SérieCheque`: Série do talão
- `EventosCheque`: Log de eventos que ocorreram com o cheque

---

### ChequesRecebidos
- **Descrição:** Cadastro de cheques recebidos pela empresa
- **Relacionamento:** 
- `Banco` → `Bancos.CodBanco`
- `Planílha` → `MovimentoCaixa.Planílha`
- `Titular` → `Clientes.CodCliente`
- `ContaCorrente` → `ContasCaixa.CodCaixa`
- `Cliente` → `Clientes.CodCliente`
- **Tipo:**
- `A`: A compensar
- `X`: Compensado/Depositado
- `C`: Cancelado
- `D`: Devolvido
- `R`: Reapresentado
- `P`: Segunda Devolução
- **Campos:**
- `CodInterno`: código interno PK
- `Banco`: banco emissor do cheque
- `Número`: Número do Cheque
- `ValorCheque`: Valor do cheque
- `Recebido`: Data em que o cheque foi recebido pela empresa
- `CompensaEm`: Data em que deve ser descontado
- `Planílha`: Planílha do movimento de caixa que está vinculada ao cheque
- `Titular`: Cliente/Fornecedor emissor do qual o cheque foi recebido
- `TitularNome`: Nome do emissor do cheque
- `CGC`: CNPJ/CPF do emissor do cheque
- `Telefone`: Telefone do emissor do cheque
- `Documento`: Duplicata ou documento ao qual o cheque está vinculado
- `Status`: Status do cheque
- `Movimento`: Data em que o cheque foi compensado ou cancelado
- `Motivo`: Motivo de cancelamento
- `Empresa`
- `ContaCorrente`: Conta onde o cheque foi compensado
- `Agência`: Agência do cheque
- `Cliente`: Cliente/Fornecedor para o qual o cheque foi repassado
- `Observações`: Observações do cheque
- `Repassado`: nome para o qual foi repassado o cheque
- `EventosCheque`: eventos que ocorreram com o cheque

---

### ChequesRecebidosMovimento
- **Descrição:** Movimentos que ocorreram com o cheque recebido
- **Relacionamento:** 
- `CodCheque` → `ChequesRecebidos.CodInterno`
- `Empresa` → `Empresas.CodEmpresa`
- `Conta` → `ContasCaixa.CodConta`
- `Planílha` → `MovimentoCaixa.Planílha`
- `MotivoDevolução` → `DadosEntidades.CodInterno`
- **Movimento:**
- `X`: Compensação
- `D`: Devolução
- `R`: Reapresentação
- `P`: Segunda Devolução
- **Campos:**
- `CodInterno`: código interno PK
- `CodCheque`
- `Data`: Número do Cheque
- `Movimento`: Tipo de Movimento do Cheque
- `Empresa`
- `Conta`
- `MotivoDevolução`
- `Planílha`
- `Repassado`: nome para o qual foi repassado o cheque

---

### CidadesSigma
- **Descrição:** Dados temporários com o cadastro de cidades do Sigma Desktop para validar a inserção de um novo cadastro

---

### ClienteNotificacoesPortal
- **Descrição:** Manipulado pelo IntegraService

---

### Clientes
- **Descrição:** Clientes/Fornecedores/Técnicos/Gecom/Getec cadastrados
- **Relacionamento:** 
- `CodOcupação` → `DadosEntidades.CodInterno`
- `CodSituação` → `DadosEntidades.CodInterno`
- `Vendedor` → `Clientes.CodCliente`
- `Técnico` → `Clientes.CodCliente`
- `Gecom` → `Clientes.CodCliente`
- `ClienteMestre` → `Clientes.CodCliente`
- `VendedorOriginal` → `Clientes.CodCliente`
- `ClienteFaturaOS` → `Clientes.CodCliente`
- `TécnicoPreventiva` → `Clientes.CodCliente`
- `PortariaTec` → `Clientes.CodCliente`
- `CodPréVenda` → `Clientes.CodCliente`
- `Empresa` → `Empresas.CodEmpresa`
- `FormaPagamento` → `FormasPagto.CodFormaPagto`
- `FormaPagamentoPadrãoOS` → `FormasPagto.CodFormaPagto`
- `TipoFaturamento` → `TiposFaturamento.CodTipoFaturamento`
- `CodCancelamento` → `DadosEntidades.CodInterno`
- `Unidade` → `Unidades.CodUnidade`
- `Área` → `Áreas.CodÁrea`
- `SubÁrea` → `SubÁreas.CodSubÁrea`
- `TipoÍndice` → `DadosEntidades.CodInterno`
- `CodTipoServiço` → `TipoServiços.Código`
- `CodCarteiraCobrança` → `DadosEntidades.CodInterno`
- `EquipeTécnica` → `VigzulEquipeTécnica.CodInterno`
- `OrçamentoOrigem` → `Orçamentos.Planílha`
- `PlanoComissãoRecorrenteVendedor` → `PlanosComissãoRecorrente.CodInterno`
- `PlanoComissãoRecorrenteCliente` → `PlanosComissãoRecorrente.CodInterno`
- `Gênero` → `DadosEntidades.CodInterno`
- `CodTabelaPreçosVinculada` → `ProdutosTabelas.CodInterno`
- `Carteira` → `DadosEntidades.CodInterno`
- `GrupoEconomico` → `DadosEntidades.CodInterno`
- `EmpresaContasReceber` → `Empresas.CodEmpresa`
- `GRIntegração` → `GRIntegrações.CodInterno`
- `SLAPadrão` → `SLAOSs.CodRegra`
- `GrupoDefeito` → `DadosEntidades.CodInterno`
- `TpISS` → `DadosEntidades.CodInterno`
- `OSTpISS` → `DadosEntidades.CodInterno`
**Modalidade:**
- `V`: Venda
- `L`: Locação
- `R`: Rastreamento
**Tipo:**
- `C`: Cliente
- `V`: Vendedor
- `F`: Fornecedor
- `U`: Funcionário
- `A`: Ambos (Cliente e Fornecedor)
- `T`: Transportadora
- `Z`: Técnico
**EstadoCivil:**
- `A`: AMAZIADO
- `C`: CASADO
- `Q`: DESQUITADO
- `D`: DIVORCIADO
- `N`: NÃO DECLARADO
- `S`: SOLTEIRO
- `V`: VIÚVO
**NívelSegurança:**
- `1`: Muito Alto
- `2`: Alto
- `3`: Normal
- `4`: Baixo
- `5`: Muito Baixo
**EnvioBoleto:**
- `0`: Ambos
- `1`: Email
- `3`: DDA
- `4`: WhatsApp
**OSServCobraM:**
- `0`: Padrão (Não cobrar)
- `1`: Sempre cobrar
- `2`: Nunca cobrar
**OSServCobraP:**
- `0`: Padrão (Não cobrar)
- `1`: Sempre cobrar
- `2`: Nunca cobrar
**Natureza:**
- `01`: Orgão, Autarquia ou Fundação Federal
- `02`: Outras Entidades Administração Federal
- `03`: Pessoa Juridica de Direito Privado
- `04`: Sociedade Cooperativa
- `05`: Fabricante de Máquinas e Veículos
- `99`: Outras Retenções
- **Campos:**
- `CodCliente`: código do cliente, pode aparecer como `Cliente`, `Fornecedor`, `Técnico`, `Gecom`, `Getec`
- `Nome`: nome ou razão social 
- `Fantasia`: nome fantasia 
- `CGCCPF`: CPF ou CNPJ  (Quando a quantidade de caracteres for acima de 14, é CNPJ (pessoa jurídica), se for menor, é CPF (pessoa física))
- `InscriçãoEstadual`: número da inscrição estadual ou ISENTO
- `RG`: número do RG
- `OrgãoEmissorRG`: órgão emissor do RG
- `DataEmissãoRG`: data de emissão do RG
- `Endereço`: rua/logradouro com o endereço
- `NumCasa`: número do endereço
- `Celular`: numero do celular 
- `Fax`: telefone 3 
- `Observações`: observações
- `CodOcupação`: atividade 
- `LimiteCrédito`: depreciado - não utilizado atualmente
- `Bairro`: bairro
- `Cidade`: cidade
- `Naturalidade`: cidade onde nasceu
- `Estado`: UF/Estado
- `EstadoNaturalidade`: UF/Estado onde nasceu
- `CEP`: CEP
- `Fone1`: telefone fixo 
- `Fone2`: telefone fixo alternativo 
- `País`: país onde se encontra
- `Nascimento`: data de nascimento
- `Pai`: nome do pai
- `Mãe`: nome da mãe
- `Renda`: valor da renda
- `Cobrar`: booleano que identifica se o cliente deve ser cobrado por inadimplência
- `Autorizados`: pessoas autorizadas a comprar
- `DataCadastro`: data de cadastro
- `EndereçoCobrança`: endereço de cobrança
- `BairroCobrança`: bairro do endereço de cobrança
- `CEPCobrança`: cep do endereço de cobrança
- `EstadoCobrança`: estado do endereço de cobrança
- `Praça`: cidade do endereço de cobrança
- `EmpresaTrabalha`: empresa em que trabalha
- `Profissão`: profissão em que atua
- `FoneEmpresa`: telefone da empresa em que trabalha
- `DataAdmissão`: data em que foi admitido na empresa
- `EstadoCivil`: estado civil
- `Cônjuge`: nome do conjuge
- `NascimentoCônjuge`: data de nascimento do conjuge
- `RendaCônjuge`: valor da renda do conjuge
- `EmpresaCônjuge`: empresa em que trabalha o conjuge
- `ProfissãoCônjuge`: profissão em que atua o conjuge
- `FoneEmpresaCônjuge`: telefone da empresa em que trabalha o conjuge
- `Email`: email ou lista de emails
- `HomePage`: página da empresa
- `Contato1`: primeiro contato da pessoa física
- `Contato2`: segundo contato da pessoa física
- `Tipo`: tipo de cadastro
- `TempoResidência`: a quanto tempo mora no endereço
- `CodSituação`: situação cadastral para venda
- `Foto`: caminho da foto
- `Comissão`: percentual de comissão quando vendedor
- `Consumidor`: booleano que identifica que o cliente é um consumidor (usado em orçamentos e vendas quando não há cadastro ainda feito)
- `NumCasaCobrança`: número do endereço de cobrança
- `Representante`: representante legal da pessoa jurídica
- `EndereçoRepresentante`: endereço do representante
- `NumRepesentante`: número do endereço do representante
- `FoneRepresentante`: telefone do representante
- `FaxRepresentante`: telefone2 do representante
- `CidadeRepresentante`: cidade do endereço do representante
- `EstadoRepresentante`: estado do endereço do representante
- `CelularRepresentante`: celular do representante
- `ContatoRepresentante`: bairro do endereço do representante
- `EmailRepresentante`: email ou lista de emails do representante
- `ContatoJurídica1`: primeiro contato da pessoa jurídica
- `ContatoJurídica2`: segundo contato da pessoa jurídica
- `ComplEndereço`: complemento do endereço do cliente
- `Vendedor`: vendedor responsável pelo cliente
- `Empresa`: empresa onde o cliente gera as notas de recorrência
- `FaturaLote`: se 1, o cliente faz parte do lote de faturamento mensal (faturamento em lote)
- `DiaVencimento`: dia do mês do vencimento da fatura mensal
- `ValorNF`: valor da recorrência mensal do cliente (valor da fatura mensal)
- `ValorME`: valor recorrência mensal do cliente
- `Modalidade`: modalidade do cliente
- `FormaPagamento`: forma de pagamento das duplicatas geradas pelo faturamento em lote
- `BaseCalculo`: depreciado - não utilizado
- `ISS`: percentual de ISS do faturamento em lote
- `DISS`: booleano que indica se o ISS será retido (descontado) da nota
- `IRPF`: percentual de IRRF do faturamento em lote
- `DIRPF`: booleano que indica se o IRRF será retido (descontado) da nota
- `INSS`: percentual de INSS do faturamento em lote
- `DINSS`: booleano que indica se o INSS será retido (descontado) da nota
- `PIS`: percentual de PIS do faturamento em lote
- `DPIS`: booleano que indica se o PIS será retido (descontado) da nota
- `COFINS`: percentual de COFINS do faturamento em lote
- `DCOFINS`: booleano que indica se o COFINS será retido (descontado) da nota
- `CSLL`: percentual de CSLL do faturamento em lote
- `DCSLL`: booleano que indica se o CSLL será retido (descontado) da nota
- `Cancelamento`: data em que o cliente foi cancelado do faturamento em lote mensal
- `TextoNF1`: texto personalizado para o cliente na nota do faturamento em lote mensal
- `TextoNF2`: texto personalizado para o cliente na nota do faturamento em lote mensal
- `TextoNF3`: texto personalizado para o cliente na nota do faturamento em lote mensal
- `TextoNF4`: texto personalizado para o cliente na nota do faturamento em lote mensal
- `TextoNF5`: texto personalizado para o cliente na nota do faturamento em lote mensal
- `TextoNF6`: texto personalizado para o cliente na nota do faturamento em lote mensal
- `TextoNF7`: texto personalizado para o cliente na nota do faturamento em lote mensal
- `TextoNF8`: texto personalizado para o cliente na nota do faturamento em lote mensal
- `TextoNF9`: texto personalizado para o cliente na nota do faturamento em lote mensal
- `TextoNF10`: texto personalizado para o cliente na nota do faturamento em lote mensal
- `EmiteNota`: depreciado - não utilizado
- `NotaPersonalizada`: booleano que indica se deve ser utilizado o texto personalido na nota de faturamento em lote
- `PrimeiroFaturamento`: data em que o cliente foi ativado para faturamento, início do contrato na empresa
- `ListaChaves`: lista de chaves cadastradas no cliente
- `BaseISS`: base de calculo do ISS para a nota de faturamento
- `ReferênciaSIGMA`: referência do endereço no monitoramento
- `ObservaçãoSIGMA`: observações do cliente no monitoramento
- `ResponsávelSIGMA`: responsável do cliente no monitoramento
- `DataInstalaçãoAlarme`: data de instalação no monitoramento
- `Central`: central no monitoramento
- `ÚltimoEvento`: último evento recebido no monitoramento
- `ÚltimoX1`: último evento X1 recebido no monitoramento
- `MínimoComissão`: percentual mínimo a ser recebido de comissão pelo vendedor para comissão escalonada
- `CentroResultados`: subconta de resultado que deve ser gerada na nota de faturamento em lote mensal
- `BaseISSAnt`: base de calculo do ISS anterior (alterado)
- `ValorNFAnt`: valor NF anterior (alterado)
- `ValorMEAnt`: valor ME anterior (alterado)
- `BaseCalculoAnt`: depreciado
- `ÍndiceReajuste`: índice do último reajuste do cliente
- `DataReajuste`: data do último reajuste do cliente
- `BaseIRPF`: base de calculo do IRRF para a nota de faturamento
- `BaseINSS`: base de calculo do INSS para a nota de faturamento
- `BasePIS`: base de calculo do PIS para a nota de faturamento
- `BaseCOFINS`: base de calculo do COFINS para a nota de faturamento
- `BaseCSLL`: base de calculo do CSLL para a nota de faturamento
- `TipoFaturamento`: tipo de faturamento em lote mensal
- `RatChip`: depreciado
- `RatRonda`: depreciado
- `RatFone`: depreciado
- `RatExtras`: depreciado
- `ValorEntrega`: depreciado
- `TelefoneLimpo`: depreciado
- `TelefoneLimpo`: depreciado
- `PropNome`: depreciado
- `PropEnd`: endereço no monitoramento
- `PropNum`: depreciado
- `PropEnd`: endereço no monitoramento
- `PropBairro`: bairro no monitoramento
- `PropCompl`: depreciado
- `PropCidade`: cidade no monitoramento
- `PropUF`: repreciado
- `Região`: repreciado
- `Cobrando`: repreciado
- `FantasiaSigma`: fantasia no sistema de monitoramento
- `ValorCHIP`: depreciado
- `RGRepresentante`: RG do representante
- `CPFRepresentante`: CPF do representante
- `Contrato`: Contrato no sistema de monitoramento
- `RatRadio`: depreciado
- `ValorRadio`: depreciado
- `SubstitutoTributário`: booleano que identifica que o cliente é substituto tributário e não gera ISS em algumas cidades
- `MotivoCancelamento`: motivo do cancelamento do cliente
- `NaoReajusta`: booleano que identifica que o cliente não deve sofrer reajustes
- `TaxaBoletos`: booleano que identifica que o cliente não deve ter somado ao valor do boleto as taxas
- `Técnico`: técnico responsável vinculado ao cliente
- `CodCancelamento`: código do motivo de cancelamento
- `Unidade`
- `ValorRonda`: depreciado
- `ValorFone`: depreciado
- `ValorExtras`: depreciado
- `ValorComodato`: valor da recorrência mensal da locação de equipamentos ao cliente
- `SigmaBloqueado`: booleano que identifica que o cliente está desativado no monitoramento
- `SigmaBloqueioData`: data em que o cliente foi desativado no monitoramento
- `SigmaBloqueioUsuário`: quem desativou o cliente no monitoramento
- `NívelSegurança`: determina o nível de risco do cliente e é utilizado para calcular o resultado do cliente
- `PontosAlarme`: quantidade de pontos de alarme do cliente e é utilizado para calcular o resultado do cliente
- `ComissãoServiços`: quando vendedor, determina o percentual de comissão em serviços
- `MínimoComissãoServiços`: quando vendedor, determina o percentual mínimo de comissão em serviços em comissão escalonada
- `Área`: área de atendimento técnico
- `SubÁrea`: subárea de atendimento técnico
- `ReferênciasBancárias`: referências financeiras 
- `Gecom`: quando vendedor, determina o gerente comercial
- `CobraProporcional`: booleano que determina em um cliente novo que ele deve ter a cobrança proporcional no primeiro faturamento
- `PlanilhaProporcional`: planílha da nota que gerou a primeira cobrança proporcional
- `GeraCréditoICMS`: booleano que sendo verdadeiro é empresa normal, falso é simples e não gera créditos
- `CFOPPersonalizado`: CFOP específico para o cliente para notas geradas no faturamento em lote mensal
- `EndereçoNF`: Endereço fiscal, caso em branco busca o endereço geral para o faturamento de notas fiscais
- `NumCasaNF`: Numero do endereço fiscal
- `BairroNF`: Bairro do endereço fiscal
- `CEPNF`: CEP do endereço fiscal
- `CidadeNF`: Cidade do endereço fiscal
- `EstadoNF`: Estado do endereço fiscal
- `ObservaçãoOS`: depreciado
- `DataObservação`: depreciado
- `UsuárioObserva`: depreciado
- `TipoÍndice`: tipo de índice de reajuste para o cliente
- `UsuárioReajuste`: usuário responsável pelo ultimo reajuste
- `ComissãoFaturamento`: para vendas sem campanha, determina se a comissão do valor mensal será gerada no recebimento da duplicata de contas a receber
- `CEPRepresentante`: Cep do representante legal
- `InscriçãoMunicipal`: Inscrição municipal
- `DataLimiteObserva`: depreciado
- `ClienteMestre`: em clientes agrupados, traz qual o cliente mestre que este está ligado
- `NãoGuias`: booleano que determina que o cliente não deve gerar guias de Darf e GPS de notas com retenção
- `EmailNotaDigital`: email ou lista de emails para envio de documentos fiscais
- `EmailCobrança`: email ou lista de emails para envio de cobranças
- `TpISS`: tipo de ISS, usado principalmente em integrações com prefeituras
- `Latitude`: coordenada geo de latitude
- `Longitude`: coordenada geo de longitude
- `Serasa`: booleano que determina se o cliente está incluído no serasa pela empresa
- `SerasaData`: data em que o cliente foi incluído pela empresa no Serasa
- `ControlaPreventiva`: booleano que determina se o cliente tem manutenções preventivas
- `TempoPreventiva`: tempo em dias para ocorrer as preventivas
- `DadosPreventiva`: texto que vai constar na OS preventiva
- `EnvioBoleto`: forma que os boletos serão enviados
- `UsaDDA`: caso use DDA não envia o boleto (somente permite controlar por Itau)
- `MêsReajuste`: mês de reajuste do cliente quando diferente do mês de aniversário de contrato
- `TelefoneCobrança`: telefone para ligações de cobrança
- `CodTipoServiço`: tipo de serviço, utilizado para integrações com prefeituras
- `SigmaLocalizaPainel`: localização do painel no sistema de monitoramento
- `GeoManual`: booleano que identifica se as posições de latitude e longitude foram digitadas ou buscadas no google pelo endereço
- `QtdeParcelasComissão`: quando a comissão não é por campanha, determina a quantidade de parcelas a serem geradas
- `ChipGPRSMonitoramento`: depreciado
- `ContaExportacao`: conta contábil do cliente para exportações contábeis
- `CodCarteiraCobrança`: carteira de cobrança do cliente
- `SenhaOnline`: senha no portal do cliente
- `BrasPagNomeCartão`: nome do cartão de crédito para pagamentos
- `BrasPagNúmeroCartão`: número do cartão de crédito
- `BrasPagCCV`: CCV do cartão
- `BrasPagExpiracao`: Expiração do cartão
- `ManterISS`: booleano que identifica se permite digitar ou não um ISS diferente no cadastro
- `TextoNFLocação`: texto do recibo de locação do cliente
- `UsuárioCadastro`: quem cadastrou o cliente
- `VendedorOriginal`: vendedor que foi responsável pela venda inicial do cliente
- `EquipeTécnica`: equipe técnica que o técnico está vinculado (quando técnico)
- `ObsNotaFaturamento1`: observações gravadas para nota de faturamento
- `ObsNotaFaturamento2`: observações gravadas para nota de faturamento
- `ObsNotaAvulsa1`: observações gravadas para notas avulsas
- `ObsNotaAvulsa2`: observações gravadas para notas avulsas
- `AceitandoOS`: depreciado
- `CodigoSigma`: Código no monitoramento para integração (técnicos)
- `SigmaFonePainel`: Telefone no sistema de monitoramento
- `OrçamentoOrigem`: Planílha do orçamento que deu origem ao cliente
- `FaturaDecimo`: Booleano que indica se fatura decimo terceira cobrança no ano
- `Inativo`: Booleano que determina que o vendedor/tecnico está inativo
- `IDUsuárioPagseguro`: depreciado
- `SigmaRota`: rota no sistema de monitoramento
- `ComplementoNF`: complemento do endereço fiscal
- `NãoReterPISCOFINSAuto`: booleano que indica que o cliente não deve reter Pis e Cofins
- `PlanoMMN`: depreciado
- `SemDescontoBoleto`: booleano que determina que o cliente não deve receber descontos por pagamento antecipado do boleto
- `ClienteFaturaOS`: cliente em que as OSs devem ser faturadas
- `DataDemissão`: data de demissão no complemento de pessoa física
- `NãoEnviaSerasa`: cliente não deve ser incluído no serasa pela empresa 
- `NãoMalaDireta`: cliente não deve receber mala direta
- `SigmaMeioComunicação`: meio de comunicação no sistema de monitoramento
- `IgnoraTextoServiços`: booleano que indica que os textos dos serviços adicionais não devem ser incluídos na nota para este cliente
- `ComplementoEndCobrança`: complemento do endereço de cobrança
- `EntregaCPFCNPJ`: CPF ou CNPJ para entrega de mercadorias no faturamento de produtos (NFe)
- `EntregaEndereço`: endereço de entrega
- `EntregaNúmero`: número do endereço de entrega
- `EntregaComplemento`: complemento do endereço de entrega
- `EntregaBairro`: bairro do endereço de entrega
- `EntregaCidade`: cidade do endereço de entrega
- `EntregaEstado`: estado do endereço de entrega
- `CSAPISCOFINS`: CSA do PIS/COFINS ('01' - Não cumulativo; '51' - Cumulativo)
- `AguardandoChave`: booleano que identifica que o cliente aguarda a criação da chave no sistema de monitoramento
- `UsuárioChave`: quem gerou a chave
- `DataChave`: quando a chave foi gerada
- `FulltrackCode`: ID do cliente no sistema de rastreamento
- `PlanoComissãoRecorrenteVendedor`: código do plano de comissão por recorrência (sem final)
- `PlanoComissãoRecorrenteCliente`: código do plano de comissão por recorrência (sem final)
- `DataInativação`: data em que o cadastro foi inativado
- `Gênero`: gênero da pessoa física
- `FaturaDiasAdicionais`: calcula o vencimento da mensalidade adicionando a quantidade de dias na data atual
- `FaturaValorOndemand`: determina se o cliente fatura eventos ondemand do monitoramento
- `ConsumidorFinal`: indica se o cliente é consumidor final, existem tratativas fiscais específicas
- `InCardToken`: token do cartão no PJBank
- `ReajusteLote`: booleano que determina se o último reajuste foi feito automático ou manualmente
- `MunicípioISS`: município para tributação do iss
- `EstadoISS`: estado do município para tributação do iss
- `NaoGerarPerfil`: não gerar cobrança por perfis do MessageHub
- `NaoExibeMySecurity`: usado na integração com a Segware
- `PercDescontoBoleto`: percentual de desconto em boletos específico para este cliente
- `Representante2`: segundo representante legal da pessoa jurídica
- `RGRepresentante2`: RG do segundo representante
- `CPFRepresentante2`: CPF do segundo representante
- `EndereçoRepresentante2`: endereço do segundo representante
- `NumRepresentante2`: número do endereço do segundo representante
- `BairroRepresentante2`: bairro do endereço do segundo representante
- `CidadeRepresentante2`: cidade do segundo representante
- `EstadoRepresentante2`: estado do segundo representante
- `CEPRepresentante2`: CEP do segundo representante
- `EmailRepresentante2`: email ou lista de emails do segundo representante
- `InvTipoGerente`: depreciado
- `InvTipoAdministrativo`: depreciado
- `InvTipoVendedorInterno`: depreciado
- `InvTipoVendedorExterno`: depreciado
- `InvTipoMonitorInterno`: depreciado
- `InvTipoMonitorExterno`: depreciado
- `InvTipoTecManutenção`: depreciado
- `InvTipoTecInstalação`: depreciado
- `InvTipoTecTerceiro`: depreciado
- `NãoEnviarEmailNFe`: não enviar o email ao confirmar NFe
- `TécnicoPreventiva`: técnico que vai ser usado para gerar as OSs preventivas
- `ExibirAviso`: depreciado
- `IDMonitoramento`: depreciado
- `CodTabelaPreçosVinculada`: tabela de preços vinculada ao cliente
- `BaseOutros`: base de calculo de outros impostos
- `Outros`: percentual de outros impostos
- `Carteira`: carteira do cliente (cadastral)
- `GrupoEconomico`: grupo economico (cadastral)
- `NãoBloquearInadimplente`: booleano que indica para não bloquear o sistema de monitoramento quando inadimplente
- `NãoDanfeAuto`: booleano que indica para não enviar a Danfe ao cliente quando cofirmar uma NFe
- `GsFamily`: booleano que indica se o cliente é GsFamily, exclusivo SystemSat
- `EmpresaContasReceber`: permite informar outra empresa para gerar o contas a receber do cliente
- `CelularCobrança`: celular de cobrança
- `FormaPagamentoPadrãoOS`: identifica uma forma de pagamento padrão para faturar OSs sem orçamento
- `GRIntegração`: identifica o tipo de integração com sistema de rastreamento
- `MoniDataCadastro`: data de cadastro no sistema de monitoramento
- `GRDescreveServiçoMensal`: texto para a nota de faturamento mensal de rastreamento veicular
- `UserIter`: na Iter, grava o ID do usuário 
- `semReporteNao`: booleano que identifica sem reporte de não armado, apenas para a Semax
- `OSServCobraP`: comportamento com serviços na manutenção preventiva, se serão cobrados ou não
- `OSServCobraM`: comportamento com serviços na manutenção corretiva, se serão cobrados ou não
- `CodPréVenda`: prévendas que foi vinculada a venda do cliente
- `Síndico`: nome do sindico (condominio)
- `SíndicoInícioMandato`: data do inicio do mandato
- `SíndicoFimMandato`: data do fim do mandato
- `SigmaDescPart`: descrição da partição no sistema de monitoramento
- `MunicípioPrestação`: município da prestação de serviço
- `EstadoPrestação`: estado do município da prestação de serviço
- `EndereçoResidencial`: endereço residencial do contato pessoa fisica
- `NúmeroResidencial`: número do endereço residencial
- `EstadoPrestação`: estado do endereço residencial
- `BairroResidencial`: bairro do endereço residencial
- `CidadeResidencial`: cidade do endereço residencial
- `EstadoResidencial`: estado do endereço residencial
- `ComplementoResidencial`: complemento do endereço residencial
- `CepResidencial`: CEP do endereço residencial
- `RepresentanteDataNascimento`: Data de nascimento do representante pessoa juridica
- `Representante2DataNascimento`: Data de nascimento do segundo representante
- `Representante2Fone`: fone do segundo representante
- `Representante2Celular`: celular do segundo representante
- `ObservacoesTecnicas`: depreciado
- `TipoConta`: depreciado
- `SolucxCod`: código no Solucx
- `EmailOS`: email ou lista de emails para envio de OSs e criticas
- `OSLimiteM`: limite mensal de OSs de manutenção
- `OSLimiteP`: limite mensal de OSs preventivas
- `ObsCancelamento`: texto de observações do cancelamento
- `DataEnvioDeclaraDebito`: último envio da declaração anual de débitos pendentes
- `NFeAutorizados`: CNPJs autorizados a verificar a NFe na receita (contador etc)
- `PortariaTec`: Técnico da portaria
- `PortariaEmail`: email ou lista de emails para envio de dados da portaria
- `CelularOS`: celular para envio de informações sobre OSs
- `IncardTokenInside`: token do cartão no PJBank
- `ConceitoClasse`: Classe do conceito Service
- `ConceitoIndice`: Indice do conceito
- `ConceitoqtCli`: Quantidade de cliente
- `ConceitoSituacao`: Situação
- `ConceitoDetalhes`: Detalhes
- `ConceitoMediaAtrasos`: Média de atrasos do cliente
- `EntregaNome`: Nome do endereço de entrega
- `EntregaFone`: Fone do endereço de entrega
- `EntregaCEP`: CEP do endereço de entrega
- `EntregaEmail`: Email ou lista de emails do endereço de entrega
- `RepresentanteProfissao`: Profissão do representante legal
- `RepresentanteEstadoCivil`: Estado civil do representante legal
- `RepresentanteProfissao2`: Profissão do segundo representante legal
- `RepresentanteEstadoCivil2`: Estado civil do segundo representante legal
- `AlteroSenhaPadrao`: booleano que indica que o cliente mudou a senha do portal
- `ScTTD212`: booleano que indica se o cliente está no programa pró emprego de SC
- `GetrakSubCliente`: subcliente na getrak
- `GetrakClienteID`: id do cliente na getrak
- `GetrakClienteIDGetrak`: id do cliente na getrak
- `AgruparNotaPorTipo`: no faturamento por tipo de serviço, determina se soma as notas do mesmo tipo
- `SLAPadrão`: SLA padrão para as OSs do cliente
- `SeguroCodAtividade`: Código de atividade para integração com seguro
- `PercComissaoGecom`: Percentual de comissão do gecom
- `GrupoDefeito`: Grupo de defeitos do cliente
- `EnviaNFLocação`: Determina se envia email das NFEs de locação
- `AddObservOS`: depreciado
- `OSTpISS`: Tipo de ISS para OSs
- `OSISS`: Percentual de ISS para OSs
- `OSDISS`: booleano que determina se deduz o ISS em OSs
- `IdClienteMovidesk`: id do cliente na integração Movidesk
- `SACExcluiPesquisas`: não fazer pesquisas do SAC
- `CreditoOutorgado`: percentual de crédito outorgado nos estados que utilizam
- `NumART`: ART para OSs do cliente
- `CodObra`: Código de obra para OSs do cliente
- `CodCadastroMatriz`: Na porter identifica do cadastro cliente na matriz
- `OSMunicípioISS`: Município do ISS para OSs do cliente
- `OSEstadoISS`: Estado do Município do ISS para OSs do cliente
- `OSMunicípioPrestação`: Município de prestação para OSs do cliente
- `OSEstadoPrestação`: Estado do Município de prestação para OSs do cliente
- `SolicitaLiberacaoAberturaOS`: booleano que identifica se deve soliticar liberação para OSs
- `NaoEnviarSMSAberturaOS`: evita que o cliente receba SMS da abertura de OS
- `NãoValidaDistancia`: não valida a distancia no OSMobile para atendimento do cliente
- `Natureza`: natureza da empresa
- `SeparaBoletoLoca`: em empresas onde não está configurado para faturar a locação separadamente, permite marcar alguns clientes para que isso ocorra

---

### Clientes_Log
- **Descrição:** Log de alterações no cadastro de clientes
- **Campos:**
- `CodInterno`: código interno PK
- `UsuárioGravação`: quem gravou a alteração
- `DataHora`: data/hora da alteração
- `OutrasAlterações`: outras alterações feitas (exclusão ou inclusão de arquivos)
... demais campos os mesmos da tabela clientes

---

### ClientesAcesso
- **Descrição:** São os usuários do sistema de alarme cadastrados no software de monitoramento, dados são gravados temporiamente para constar em telas e na ordem de serviço
- **Relacionamento:** 
- `CodCliente` → `Clientes.CodCliente`
- **Campos:**
- `CodInterno`: código interno PK
- `CodCliente`
- `Nome`: nome do usuário
- `Chave`: chave/id da central no monitoramento
- `Fone1`
- `Fone2`
- `StrFunção`: função gravada no monitoramento
- `Tipo`: C - Contato, U - Usuário

---

### ClientesAditivos
- **Descrição:** Aditivos de contrato dos clientes
- **Relacionamento:** 
- `CodCliente` → `Clientes.CodCliente`
- `PlaOrçamento` → `Orçamentos.Planílha`
- **TipoAditivo:**
- `V`: Valor Monitoramento
- `C`: Valor Rastreamento
- `S`: Tipo de Serviço
- `R`: Razão Social
- `E`: Endereço
- `A`: Acréscimo de Equipamentos
- `T`: Troca de Equipamentos
- `X`: Alteração de Veículos
- `Y`: Inclusão de Veículos
- `M`: Alteração de Meio de Comunicação
- `L`: Alteração de Cláusula
- `G`: Cláusula LGPD
- **Campos:**
- `CodInterno`: código interno PK
- `CodCliente`
- `NumAditivo`: contador de aditivos do cliente
- `Impresso`: booleano que determina se o aditivo foi impresso
- `DataImpressão`: data da impressão do aditivo
- `Assinado`: booleano que indica se o aditivo foi assinado (aceito) pelo usuário
- `DataAssinatura`: data da assinatura do aditivo
- `Usuário`: usuário que gerou o aditivo
- `TipoAditivo`: tipo de aditivo
- `PlaOrçamento`: planílha do orçamento que gerou o aditivo (quando o caso)
- `Planílha`: planílha da baixa do aditivo, pode vincular bonificações e despesas
- `Cancelado`: booleano que indica que o aditivo foi cancelado
- `BaixouServAD`: booleano que indica se o aditivo alterou serviços adicionais do cliente
- `NãoAjustaPrazoFinalContrato`: booleano que indica que o prazo final do contrato de monitoramento não é alterado com o aditivo

---

### ClientesAvisos
- **Descrição:** Avisos cadastrados para serem exibidos ao buscar um cliente
- **Relacionamento:** 
- `CodCliente` → `Clientes.CodCliente`
- **Exibir:** 
- `0`: Somente OS
- `1`: Somente Financeiro
- `3`: Somente Cancelamento
- `4`: Somente Orçamento
- `2`: Ambos
- **Campos:**
- `CodInterno`: código interno PK
- `CodCliente`
- `Título`: título da mensagem
- `Texto`: mensagem
- `Usuário`: quem gerou 
- `DataCadastro`: data em que foi gerado
- `DataLimite`: até quando deve ser exibido, se nulo sempre
- `Exibir`: onde deve ser exibido o aviso
- `AddObservaOS`: se adiciona a mensagem no texto de abertura da OS

---

### ClientesBonificações
- **Descrição:** Bonificações de clientes (valores que devem ser descontados ao faturar em lote)
- **Relacionamento:** 
- `CodCliente` → `Clientes.CodCliente`
- `PlanílhaNota` → `NotasFiscaisSaída.Planílha`
- `CodFatLote` → `FaturamentosRealizados.CodInterno`
- `CodPosto` → `ClientesPostos.CodInterno`
- `CodMotivo` → `DadosEntidades.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `CodCliente`
- `Data`: data da bonificação
- `Descrição`: descrição da bonificação
- `ValorDespesa`: valor da bonificação
- `Usuário`: quem gravou a bonificação
- `Faturada`: booleano que indica que a bonificação já foi descontada de um faturamento
- `PlanílhaNota`: planílha da nota que foi gerada abatendo a bonificação
- `ExibeNota`: booleano que indica se descrição da bonificação deve constar no texto da NF
- `Planílha`: planílha do processo que gerou a bonificação (aditivo etc)
- `Liberado`: booleano que infica que a bonificação está liberada para faturamento
- `CodMotivo`: motivo da bonificação
- `BonificaIntegral`: identifica que a mensalidade não deve ser cobrada totalmente
- `CodFatLote`: faturamento em lote que faturou a bonificação
- `CodAditivo`: aditivo que gerou a bonificação
- `CodPosto`: identifica o posto de serviço para o qual foi o aditivo (quando o caso)
- `Cancelado`: booleano que infica que a bonificação foi cancelada
- `PlanilhaProcessamento`: depreciado

---

### ClientesBonificaçõesServiços
- **Descrição:** Serviços adicionais vinculados a bonificação
- **Relacionamento:** 
- `CodBonificação` → `ClientesBonificações.CodInterno`
- `CodServiço` → `ServiçosAdicionais.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `CodBonificação`: código da bonificação vinculada
- `CodServiço`: serviço adicional vinculado
- `ValorServiço`: valor da bonificação do serviço

---

### ClientesCancelamentos
- **Descrição:** Processos de cancelamento de clientes
- **Relacionamento:** 
- `CodCliente` → `Clientes.CodCliente`
- `PlanílhaMulta` → `ContasReceber.Planílha`
- `CodCanc` → `DadosEntidades.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `CodCliente`
- `StatusCancelamento`: A - Ativo, C - Cancelado
- `DataComunicação`: data em que o cliente pediu cancelamento
- `Observações`: informações do cancelamento
- `UsuárioComunicação`: quem cadastrou
- `DataVisita`: data de contato com o cliente
- `ObservaçõesVisita`: informações do contato
- `UsuárioVisita`: quem gravou o contato
- `ResponsávelVisita`: quem foi responsável pelo contato
- `DataConfirmação`: data em que foi confirmado o cancelamento
- `ValorMulta`: valor a cobrar de multa contratual
- `Planílha`: planílha do cancelamento (pode ligar com NF e contas a receber em cobrança proporcional)
- `UsuárioConfirmação`: quem confirmou o cancelamento
- `DataDesativação`: data em que foi desativado o cliente no sistema de monitoramento
- `UsuárioDesativação`: quem desativou o sistema
- `ValorMonitoramento`: valor prorata do tempo que o cliente usou o sistema
- `ChavesCanceladas`: lista de chaves (centrais) do cliente que foram canceladas
- `FaturadoMulta`: booleano que indica se foi faturada a cobrança proporcional
- `OSAberta`: indica se já foi aberta a OS para retirada de equipamentos locados/desligamento do sistema
- `DataVisitaRealizada`: data em que foi feito o contato com o cliente
- `CobradoMulta`: indica se a multa contratual foi cobrada
- `PlanílhaMulta`: planílha do contas a receber gerado para cobrar a multa contratual
- `DataProgramada`: data em que foi acordado o cancelamento do cliente
- `PartiçõesChaves`: lista das partições das centrais desativadas
- `DataExtorno`: data em que o processo foi cancelado pois o cliente continuará na empresa
- `UsuárioExtorno`: quem estornou o processo
- `DistratoImprimir`: se imprimirá o distrato
- `DistratoImpresso`: se o distrato foi impresso
- `DistratoImpressão`: quando foi impresso o distrato
- `DistratoImpressãoUsuário`: quem imprimiu o distrato
- `CodCanc`: codigo do motivo de cancelamento
- `MotCanc`: motivo de cancelamento
- `DistratoAssinado`: se o distrato foi assinado/aceito
- `DistratoAssinatura`: data da assinatura
- `DistratoAssinaturaUsuário`: usuário que registrou a assinatura
- `EmpresasChaves`: lista das empresas (codigo de integração com o monitoramento) das centrais que foram canceladas 
- `DataBaseValorParcial`: data para a qual foi calculada a proprocionalidade
- `EventosCancelamento`: log de eventos ocorridos
- `idAceite`: aceite digital vinculado

---

### ClientesCancelamentosContatos
- **Descrição:** Contatos feitos com cliente em processo de cancelamento
- **Relacionamento:** 
- `CodCancelamento` → `ClientesCancelamentos.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `CodCancelamento`: código do cancelamento vinculado
- `Data`: data da gravação do contato com o cliente
- `Usuário`: quem gravou o contato
- `Relato`: relato do contato
- `Visita`: data em que ocorreu o contato
- `ResponsávelVisita`: quem foi responsável pelo contato

---

### ClientesChip
- **Descrição:** Chips GPRS vinculados a clientes
- **Relacionamento:** 
- `CodCliente` → `Clientes.CodCliente`
- `CodChip` → `GRChip.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `CodCliente`: código do cliente vinculado
- `CodChip`: código do chip vinculado

---

### ClientesContaPagamento
- **Descrição:** Cadastro de dados bancários de fornecedores para geração de remessa de pagamentos ou pagamentos via PJBank
- **Relacionamento:** 
- `CodFornecedor` → `Clientes.CodCliente`
- `Banco` → `Bancos.CodBanco`
- **TipoConta:** 
- `0`: Sem conta
- `1`: CC - Conta Corrente
- `2`: CP - Conta Poupança
- **FormaPagamento:** 
- `01`: Crédito em Conta Corrente
- `02`: Pagamento Contra-Recibo
- `03`: DOC/TED
- `04`: Cartão Salário
- `05`: Crédito em Conta Poupança
- `10`: Ordem de Pagamento
- `41`: TED Outra Titularidade
- `43`: TED Mesma Titularidade
- **TipoPagamento:** 
- `01`: Pagamentos Diversos
- `20`: Fornecedores
- `22`: Tributos
- `30`: Salários
- `94`: Arrecadações
- `98`: Diversos
- **CliTipoChavePIX:** 
- `01`: Telefone
- `02`: E-Mail
- `03`: CPF/CNPJ
- `04`: Chave Aleatória
- `PG`: Conta de Pagamento
- **Campos:**
- `CodInterno`: código interno PK
- `CodFornecedor`: código do cliente vinculado
- `FormaPagamento`: forma de pagamento (para remessa de pagamento)
- `Banco`: código do banco
- `Agência`
- `DvAgência`
- `Conta`
- `DvConta`
- `DvGeral`
- `Operação`: usado geralmente na CEF 104
- `TipoConta`: tipo de conta
- `TipoPagamento`: tipo de pagamento (para remessa de pagamento)
- `CliTipoChavePIX`: tipo de chave para PIX
- `CliChavePix`: chave para PIX

---

### ClientesContatos
- **Descrição:** Contato do sistema de monitoramento - similar a ClientesAcesso

---

### ClientesContratos
- **Descrição:** Cadastro do contrato do cliente com recorrência mensal (faturamento em lote)
- **Relacionamento:** 
- `CodCliente` → `Clientes.CodCliente`
- `CodMotDesistência` → `DadosEntidades.CodInterno`
- **Campos:**
- `CodCliente`: código do cliente 
- `HoraTeste`: hora do teste do sistema
- `Impressão`: data em que foi impresso
- `Assinado`: indica se o contrato foi assinado
- `Assinatura`: data em que o contrato foi assinado
- `Area`: area de cobertura do alarme
- `FPgto`: forma de pagamento
- `Liberado`: se o contrato está liberado para impressão
- `Usuário`: quem gerou o contrato
- `Decimo`: se o cliente fatura decimo terceiro
- `Fone`: se existe comunicação por telefone
- `Radio`: se existe comunicação por radio
- `GPRS`: se existe comunicação por GPRS
- `TesteRadio`: tempo do teste de radio
- `Internet`: se existe comunicação por internet IP
- `TipoInternet`: forma de conexão
- `Prazo`: prazo do contrato
- `DiaVcto`: dia de vencimento da mensalidade
- `AR1`: depreciado
- `AR2`: depreciado
- `AR3`: depreciado
- `AvisaDisparo`: se o cliente deseja ser avisado em todos os disparos
- `TérminoContrato`: data em que encerra o contrato
- `NumContrato`: número do contrato
- `BaixaAvulsa`: indica se a assinatura foi registrada por baixa avulsa
- `CodMotDesistência`: código do motivo de desistência do contrato
- `DataDesistência`: data da desistência do contrato
- `UsuárioDesistência`: quem registrou a desistência
- `MotDesistência`: motivo da desistência
- `idAceite`: aceite digital vinculado ao contrato
- `Satelital`: indica se existe comunicação via Satelite

---

### ClientesDespesas
- **Descrição:** Despesas avulsas de clientes de clientes (valores que devem ser somados ao faturar em lote)
- **Relacionamento:** 
- `CodCliente` → `Clientes.CodCliente`
- `PlanílhaNota` → `NotasFiscaisSaída.Planílha`
- `CodFatLote` → `FaturamentosRealizados.CodInterno`
- `CodPosto` → `ClientesPostos.CodInterno`
- `ContaVinculada` → `SubContas.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `CodCliente`
- `Data`: data da despesa
- `Descrição`: descrição da despesa
- `ValorDespesa`: valor da despesa
- `Usuário`: quem gravou a despesa
- `Faturada`: booleano que indica que a despesa já foi cobrada em um faturamento
- `PlanílhaNota`: planílha da nota que foi gerada a cobrança
- `ExibeNota`: booleano que indica se descrição da despesa deve constar no texto da NF
- `Planílha`: planílha do processo que gerou a despesa
- `FaturaRecibo`: infica se deve ser incluída no recibo de locação
- `CodFatLote`: faturamento em lote que faturou 
- `CodAditivo`: aditivo que gerou
- `CodPosto`: identifica o posto de serviço para o qual foi a despesa (quando o caso)
- `Cancelado`: booleano que infica que a despesa foi cancelada
- `DadosAdicionais`: log dos eventos da despesa
- `ContaVinculada`: subconta do plano de contas para geração da receita

---

### ClientesDuplicadosEliminados
- **Descrição:** Log de eliminação de cliente por duplicidade
- **Relacionamento:** 
- `CodClienteCorreto` → `Clientes.CodCliente`
- `CodClienteEliminado` → `Clientes.CodCliente`
- **Campos:**
- `CodInterno`: código interno PK
- `Data`: data do evento
- `Usuário`: quem fez o processo
- `CodClienteCorreto`
- `CodClienteEliminado`
- `NomeClienteEliminado`

---

### ClientesEndereços
- **Descrição:** Endereços de clientes para OSs
- **Relacionamento:** 
- `CodCliente` → `Clientes.CodCliente`
- **Campos:**
- `CodInterno`: código interno PK
- `CodCliente`
- `Inativo`: indica se está inativo
- `Padrão`: se por padrão esse é o endereço do cliente

---

### ClientesEventos
- **Descrição:** São os pontos do sistema de alarme trazidos do sistema de monitoramento
- **Relacionamento:** 
- `CodCliente` → `Clientes.CodCliente`
- **Campos:**
- `CodInterno`: código interno PK
- `CodCliente`
- `Evento`: id do ponto
- `Descrição`: descreve o ponto
- `Chave`: central de alarme

---

### ClientesGR
- **Descrição:** Era utilizada na GR para cobrança mensal, depreciada

---

### ClientesGRAgregados
- **Descrição:** Era utilizada na GR para cobrança mensal, depreciada

---

### ClientesGRReajustes
- **Descrição:** Era utilizada na GR para cobrança mensal, depreciada

---

### ClientesHashtags
- **Descrição:** Tags vinculadas a clientes
- **Relacionamento:** 
- `CodCliente` → `Clientes.CodCliente`
- `CodHashTag` → `Hashtags.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `CodCliente`
- `CodHashTag`

---

### ClientesHashtags
- **Descrição:** Tags vinculadas a clientes
- **Relacionamento:** 
- `CodCliente` → `Clientes.CodCliente`
- `CodHashTag` → `Hashtags.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `CodCliente`
- `CodHashTag`

---

### ClientesHistórico
- **Descrição:** Histórico de alterações de valores da mensalidade dos clientes
- **Relacionamento:** 
- `CodCliente` → `Clientes.CodCliente`
- `CodAditivo` → `ClientesAditivos.CodInterno`
- `CodPosto` → `ClientesPostos.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `CodCliente`
- `Data`
- `Motivo`
- `Usuário`
- `CodAditivo`: aditivo que gerou a alteração
- `CodPosto`: posto de serviço alterado (quando o caso)

---

### ClientesHistóricoServiçosAdicionais
- **Descrição:** Histórico de alterações de valores dos serviços adicionais da mensalidade dos clientes
- **Relacionamento:** 
- `CodHistórico` → `ClientesHistórico.CodInterno`
- `CodServiço` → `ServiçosAdicionais.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `CodHistórico`
- `CodServiço`

---

### ClientesPortaria
- **Descrição:** Dados do cliente na portaria remota (integração com Situator)
- **Relacionamento:** 
- `CodCliente` → `Clientes.CodCliente`
- `Integração` → `PortariaIntegração.CodInterno`
- `PlaOrc` → `Orçamentos.Planílha`
- **Campos:**
- `CodInterno`: código interno PK
- `CodCliente`
- `Integração`: id da integração configurada
- `IdSituator`: id no Situator
- `PlaOrc`: planílha de orçamento vinculada

---

### ClientesPostos
- **Descrição:** Cadastro de Postos de Serviços que são vinculados a cliente e faturados separadamente, possuem os mesmos dados da tabela clientes, listando apenas campos diferentes
- **Relacionamento:** 
- `CodCliente` → `Clientes.CodCliente`
- **Status:**
- `P`: aguardando implantação
- `X`: implantado
- `C`: cancelado
- **Campos:**
- `CodInterno`: código interno PK
- `CodCliente`
- `TérminoContrato`: fim do contrato
- `Identificação`: nome do posto
- `ProtGuiaINSS`: anexa guia INSS
- `ProtGuiaFGTS`: anexa guia FGTS
- `ProtGuiaSEFIP`: anexa documentos SEFIP
- `ProtGuiaEmpregados`: anexa relação de empregados
- `ProtGuiaPagto`: anexa recibo de pagamento de colaboradores
- `ProtGuiaPagto`: anexa recibo de pagamento de colaboradores
- `Status`: status do processo de inclusão do posto

---

### ClientesPostos_Log
- **Descrição:** Log de alterações do posto, os mesmos campos da tabela ClientesPostos adicionando o usuário e data e hora da alteração

---

### ClientesPostosServiços
- **Descrição:** Serviços vinculados a um posto
- **Relacionamento:** 
- `CodPosto` → `ClientesPostos.CodInterno`
- `CodServiço` → `ServiçosAdicionais.CodInterno`
- `CodAditivoInclusão` → `ClientesAditivos.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `CodPosto`
- `CodServiço`
- `PercLucro`: percentual de lucro
- `CodAditivoInclusão`: aditivo que incluiu, quando o caso
- `PercBaseISS`: percentual da base de iss
- `PercBaseIRRF`
- `PercBaseINSS`
- `PercBasePIS`
- `PercBaseCOFINS`
- `PercBaseCSLL`
- `PercBaseOutras`

---

### ClientesPostosVendedores
- **Descrição:** Vendedores do posto de serviço que devem receber comissão
- **Relacionamento:** 
- `CodPosto` → `ClientesPostos.CodInterno`
- `Vendedor` → `Clientes.CodCliente`
- **Campos:**
- `CodInterno`: código interno PK
- `CodPosto`
- `Vendedor`
- `Percentual`: percentual do total de comissão destinado ao vendedor

---

### ClientesProdutos
- **Descrição:** Depreciada, tratava-se de produtos vinculados ao contrato para emitir NFe no lugar de nota de serviço no faturamento em lote

---

### ClientesReajustes
- **Descrição:** Reajustes efetuados em clientes
- **Relacionamento:** 
- `Cliente` → `Clientes.CodCliente`
- `CodPosto` → `ClientesPostos.CodInterno`
- **Tipo:** 
- `C`: cliente
- `V`: veículos
- `P`: postos
- **Campos:**
- `CodInterno`: código interno PK
- `Planílha`: planílha do reajuste em lote
- `Data`
- `Cliente`
- `Tipo`: tipo do reajuste
- `Percentual`: percentual nominal
- `PercentualReal`: percentual real considerando arredondamentos
- `AlteradoManualmente`: se foi em lote ou o usuário informou um valor
- `CodPosto`

---

### ClientesReajustesVeículos
- **Descrição:** Reajustes efetuados em veículos vinculados a clientes
- **Relacionamento:** 
- `CodVeículo` → `GRVeículos.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `Planílha`: planílha do reajuste em lote
- `CodVeículo`
- `Cliente`
- `ValorAnterior`
- `NovoValor`

---

### ClientesResultados
- **Descrição:** Dados temporários gravados para alimentar o relatório de resultados por cliente

---

### ClientesServiçosAdicionais
- **Descrição:** Serviço adicionais do contrato vinculado ao cliente
- **Relacionamento:** 
- `CodCliente` → `Clientes.CodCliente`
- `CodServiço` → `ServiçosAdicionais.CodInterno`
- `CodAditivoInclusão` → `ClientesAditivos.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `CodCliente`
- `CodServiço`
- `ValorServiço`: valor total e liquido do serviço (valor efetivo a ser cobrado)
- `Manutenção`: indica se é dada manutenção nesse serviço, meramente cadastral para constar na tela do Service Control
- `Observações`
- `DataCadastro`
- `Quantidade`: quantidade do serviço, para chegar ao unitário deve-se ValorServiço/Quantidade
- `DescontoTotal`: valor total de desconto aplicado, para chegar o valor bruto ValorServiço+DescontoTotal
- `CodAditivoInclusão`: aditivo que fez a inclusão do serviço

---

### ClientesServiçosAdicionaisExcluídos
- **Descrição:** Registra os serviços que foram excluídos do cliente, mesmos campos da tabela ClientesServiçosAdicionais incluindo CodAditivoExc(que excluiu), DataExclusão e Usuário (quem excluiu)

---

### ClientesSMS
- **Descrição:** Mensagens enviadas aos clientes 
- **Relacionamento:** 
- `CodCliente` → `Clientes.CodCliente`
- **TipoEnvio:**
- `L`: livre
- `C`: cobrança
- `F`: fechamento de OS
- `A`: abertura de OS
- **EnvioPor:**
- `S`: SMS
- `E`: E-Mail
- `W`: WhatsApp
- **Campos:**
- `CodInterno`: código interno PK
- `CodCliente`
- `Celular`: pode identificar o telefone ou email para qual foi madnada a mensagem
- `DataEnvio`
- `HoraEnvio`
- `Usuário`
- `TipoEnvio`: processo que gerou a mensagem
- `TextoEnvio`
- `IdMensagemEnviada`: identificação da mensagem enviada (retorno do WS)
- `EnvioPor`: identifica como foi enviada a mensagem

---

### ClientesSMSRespostas
- **Descrição:** Respostas de SMS recebidas
- **Relacionamento:** 
- `IdMensagemEnviada` → `ClientesSMS.IdMensagemEnviada`
- **Campos:**
- `CodInterno`: código interno PK
- `IdMensagemEnviada`: id da mensagem original que foi respondida
- `DataLeitura`: quando foi lida
- `Telefone`: numero do celular
- `ReferID`: id de referência
- `Nome`: não utilizado
- `MensagemEnviada`: texto da mensagem enviada que foi respondida
- `IdResposta`: id da resposta no ws
- `Resposta`: texto da resposta
- `Status`: A - A tratar; X - Tratada
- `LogEventos`: Eventos da resposta

---

### ClientesWakeUp
- **Descrição:** Integração WakeUp Cadastro dos clientes na API
- **Relacionamento:** 
- `CodCliente` → `Clientes.CodCliente`
- `Empresa` → `Empresas.CodEmpresa`
- **Campos:**
- `CodInterno`: código interno PK
- `CodCliente`
- `Empresa`
- `IDWakeUp`: id do cadastro na WakeUp
- `CPFCNPJ`: CPF/CNPJ cadastrado na WakeUp

---

### ClienteTokenNotificacaoPortal
- **Descrição:** Manipulado pelo IntegraService

---

### Cobrança
- **Descrição:** Cobranças realizadas
- **Relacionamento:** 
- `Cliente` → `Clientes.CodCliente`
- `Ação` → `DadosEntidades.CodInterno`
- `Unidade` → `Unidades.CodUnidade`
- **Campos:**
- `CodInterno`: código interno PK
- `Cliente`
- `Títulos`: quantidade de títulos na cobrança
- `Dívida`: soma do saldo dos títulos cobrados
- `Cobrança`: Data da cobrança
- `Ação`: Ação a ser executada 
- `MoraPara`: Data negociada para pagamento
- `Observações`: O relato do contato
- `Usuário`: Quem gravou a cobrança
- `HoraCobrança`: Hora da cobrança
- `Unidade`
- `SemContato`: indica se não foi possível contatar o cliente para cobrança

---

### CodigosTributacaoNFSe
- **Descrição:** Manipulado pelo NFSe

---

### Coletes
- **Descrição:** Cadastro de Coletes Balísticos (módulo Segurança)
- **Relacionamento:** 
- `CodPS` → `PostosDeServiço.CodPS`
- `Unidade` → `Unidades.CodUnidade`
- **Campos:**
- `CodColete`: código interno PK
- `Modelo`: modelo do colete
- `Lote`: lote de fabricação
- `Série`: série de fabricação
- `Proteção`: nível de proteção
- `Tamanho`: tamanho do colete
- `DataFabricação`: Data de fabricação
- `DataValidade`: Data de validade
- `CodPS`: Posto de Serviço ao qual o boleto está alocado
- `Unidade`
- `Status`: A - Ativo; B - Baixado
- `MotivoBaixa`: motivo da baixa
- `DataBaixa`: data da baixa
- `BOBaixa`: BO da baixa (perda, roubo)
- `Delegacia`: Delegacia do BO da baixa (perda, roubo)
- `InformadoPF`: Se a PF foi informada da baixa
- `ObservaçõesBaixa`: Observações da baixa

---

### Comissões
- **Descrição:** Comissões de vendedores
- **Relacionamento:** 
- `Vendedor` → `Clientes.CodCliente`
- `Cliente` → `Clientes.CodCliente`
- `Gecom` → `Clientes.CodCliente`
- `Empresa` → `Empresas.CodEmpresa`
- `CodDupl` → `ContasReceber.CodInterno`
- `CodCampanha` → `CampanhasVenda.CodCampanha`
- `CodFatLote` → `FaturamentosRealizados.CodInterno`
- `CodVeículo` → `GRVeículos.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `Vendedor`
- `Cliente`
- `NotaFiscal`: nota fiscal/os/orçamento 
- `Credito`: valor creditado de comissão
- `Debito`: valor debitado de comissão (estornos)
- `ValorBase`: Valor base utilizado para o calculo
- `Descrição`: Descrição do crédito/débito
- `Eliminado`: Identifica se a comissão foi eliminada 
- `EliminadoPor`: quem eliminou
- `Operação`: Tipo de operação que gerou a comissão
- `Movimento`: data da geração
- `Planílha`: planílha vinculada ao movimento (da NF, OS ou Orçamento)
- `Empresa`
- `Tipo`: F - Mensalidade; V - Vendas de produtos e serviços
- `ValorNota`: Valor da NF que gerou a comissão
- `Gecom`: gerente comercial vinculado
- `CodDupl`: código da duplicata que gerou a comissão
- `ValorMensalidade`: depreciado
- `Comodato`: depreciado
- `GPRS`: depreciado
- `Rádio`: depreciado
- `Ronda`: depreciado
- `Outros`: depreciado
- `SMS`: depreciado
- `Monitoramento`: depreciado
- `Confirmado`: depreciado
- `ConfirmadoPor`: depreciado
- `ConfirmadoEm`: depreciado
- `ObservaFat`: observações adicionais
- `CreditoOriginal`: valor original de crédito
- `VlrDSR`: DSR
- `VlrComissão`: mesmo do crédito
- `CodCampanha`: campanha de venda vinculada
- `Residual`: depreciado
- `Nível`: depreciado
- `CodPlano`: depreciado
- `PlanílhaOriginal`: planílha original
- `CodDuplOriginal`: duplicata original
- `CodFatLote`: faturamento em lote que gerou a comissão
- `CodVeículo`: veículo vinculado a comissão
- `LiberaComissãoPlanílha`: planílha da liberação da comissão
- `PlanilhaProcessamento`: planílha do processamento da comissão (comissões apuradas no final do período)
- `GecomConf`: indica se confirmado pelo Gecom
- `GecomConfEm`: data da confirmação
- `GecomConfPor`: quem gravou a confirmação
- `GecomConfPlanílha`: planílha de liberação do Gecom 

---

### ComissõesControle
- **Descrição:** Controle de comissões de mensalidade 
- **Relacionamento:** 
- `CodVendedor` → `Clientes.CodCliente`
- `CodCliente` → `Clientes.CodCliente`
- `PlanoComissao` → `CampanhasVenda.CodCampanha`
- `Planílha` → `Orçamentos.Planílha`
- `CodServiço` → `ServiçosAdicionais.CodInterno`
- `CodVeículo` → `GRVeículos.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `CodVendedor`
- `CodCliente`
- `NomeCliente`: nome do cliente
- `DataCadastro`: quando foi cadastrado
- `DbtoConta`: indica se o cliente vai pagar com debito em conta
- `PlanoComissao`: plano de comissão
- `Parc_Nr`: numero da parcela de comissão
- `Parc_Valor`: valor a ser pago de comissão
- `Parc_DataPgto`: quando a comissão foi gerada
- `Parc_CodDupli`: duplicata que foi gerada/quitada para gerar a comissão
- `ValorNF`: valor da mensalidade
- `Mon`: depreciado
- `Loc`: depreciado
- `OutrosServ`: depreciado
- `Planílha`: planílha do processo que gerou o controle (liberação de orçamento)
- `Parc_Valor_Descontar`: valor a descontar da parcela
- `CodServiço`: serviço que está gerando a comissão
- `ObsGravação`: observações
- `Bloqueado`: indica se foi bloqueado e não será pago
- `BloqueadoData`: quando foi bloqueado
- `BloqueadoPor`: quem bloqueou
- `LogAlterações`: log
- `CodVeículo`: veículo que está vinculado
- `PlanílhaOS`: planílha da OS que gerou
- `BloqueadoPorPlanílha`: planílha de bloqueio
- `PlanilhaProcessamento`: planílha de processamento (comissões apuradas no final do período)

---

### ComissõesControleServiçosAdicionais
- **Descrição:** Controle de comissões de mensalidade, serviços adicionais vinculados
- **Relacionamento:** 
- `Planílha` → `ComissõesControle.Planílha`
- `CodServiçoAdicional` → `ServiçosAdicionais.CodInterno`
- `CodAditivo` → `ClientesAditivos.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `Planílha`: planílha do controle
- `CodServiçoAdicional`
- `ValorServiço`
- `Percentual`
- `ValorComissão`
- `Cancelada`: indica se foi cancelada
- `CodAditivo`: caso gerado por aditivo, identifica o mesmo

---

### CondiçõesPagto
- **Descrição:** Condições de pagamento
- **Relacionamento:** 
- `CodFormaPagto` → `FormasPagto.CodFormaPagamento`
- **Campos:**
- `CodInterno`: código interno PK
- `CodFormaPagto`
- `Entrada`: S - Sem entrada; E - Com entrada
- `Data1`: dias da primeira condição, se nulo ignora
- `Data2`
...
- `JuroDiário`: taxa de juro diária, será multiplicada pelo maior vencimento para calculo
- `CondInativa`: indica que a condição não está ativa e não pode ser usada

---

### Condutores
- **Descrição:** Cadastro de condutores de veículos
- **Relacionamento:** 
- `Unidade` → `Unidades.CodUnidade`
- **Campos:**
- `CodCondutor`: código interno PK
- `Nome`
- `Habilitação`: numero da CNH
- `Categoria`: categoria da CNH
- `Vencimento`: data de vencimento da CNH
- `Identidade`: RG
- `CPF`
- `Observações`
- `Unidade`
- `Inativo`: indica que o condutor está inativo
- `NumGSVG`: numero do cadastro no Grupamento de Supervisão de Vigilância e Guardas (RS)
- `EmissãoGSVG`: data de emissão GSVG
- `ValidadeGSVG`: quando expira o GSVG

---

### CondutoresVeículos
- **Descrição:** Vínculo entre condutores e veículos aos quais ele está habilitado
- **Relacionamento:** 
- `CodCondutor` → `Condutores.CodCondutor`
- `CodVeículo` → `Veículos.CodVeículo`
- **Campos:**
- `CodInterno`: código interno PK
- `CodCondutor`
- `CodVeículo`

---

### ConexãoSigma
- **Descrição:** Grava o cadastro de integrações com software de monitoramento
- **Relacionamento:** 
- `Unidade` → `Unidades.CodUnidade`
- **TipoConexão:**
- `0`: Sigma Desktop
- `1`: Moni
- `2`: Sigma Cloud
- `3`: Remoty
- `4`: Iris Cloud
- `5`: Solutio Sowil
- `6`: Zins
- `7`: Monitoring
- **Campos:**
- `CodInterno`: código interno PK
- `Servidor`: url ou ip do servidor 
- `Banco`: banco de dados a ser acessado no servidor, em alguns casos pode armazenar tenant ou coisa parecida
- `Usuário`: usuário de acesso ao banco ou de login da API
- `Senha`: senha de acesso ao banco ou de login da API
- `Unidade`
- `IDSigma`: identifica o servidor e a integração cadastrada, obrigatório
- `VersãoNova`: obsuleto
- `PesquisaChaveGeral`: se pesquisa a nova chave em todas as empresas 
- `ServidorIris`: obsuleto
- `BancoIris`: obsuleto
- `UsuarioIris`: obsuleto
- `SenhaIris`: obsuleto
- `BancoMDBIris`: obsuleto
- `SenhaIrisMDB`: obsuleto
- `ChaveInicial`: inicio do intervalo de chave onde o sistema vai buscar ao criar um novo cliente no Sigma Desktop
- `TipoConexão`: qual a integração que está sendo feita
- `ConexãoPadrão`: identifica se é a conexão padrão da unidade
- `IDGrupoSigma`: id de grupo de cliente no Sigma (obsuleto)
- `QtDigitosSigma`: quantidade de digitos no ID da Central (Chave)
- `IdentificaçãoServidor`: nome da conexão
- `EventosIgnorar`: eventos a ignorar na importação dos deslocamentos
- `NovaVersãoIris`: identifica se é nova versão do Iris (obsuleto)
- `ParceiraIris`: id de parceira no Iris antigo
- `TokenSigmaCloud`: token de acesso na API
- `Inativo`: identifica se a API está inativa

---

### ConfigCFOPExp
- **Descrição:** Depreciado

---

### ConfiguraçãoBoletos
- **Descrição:** Configuração de impressão matricial de boletos, depreciado

---

### ConfiguraçãoCheques
- **Descrição:** Configuração de impressão matricial de cheques, depreciado

---

### ConfiguraçãoCOI
- **Descrição:** Configuração de COI (Código de Operação Interna) para geração ou entrada de notas fiscais
- **Relacionamento:** 
- `ContaCrédito` → `SubContas.CodInterno`
- `ContaDébito` → `SubContas.CodInterno`
- `ContaResultados` → `SubContas.CodInterno`
- `ContaCMV` → `SubContas.CodInterno`
- `TabelaPreço` → `ProdutosTabelas.CodInterno`
- `TipoEstoque` → `TiposEstoque.CodEstoque`
- `EstoqueContrapartida` → `TiposEstoque.CodEstoque`
- **FinNFe:**
- `1`: NF-e Normal
- `2`: NF-e Complementar
- `3`: NF-e de Ajuste
- `4`: Devolução de Mercadoria
- **Campos:**
- `Identificação`: Nome do COI PK
- `Descrição`: descrição do COI
- `SaldoEstoque`: indica se movimenta estoque
- `PagarReceber`: indica se gera contas a pagar ou receber
- `Comissão`: indica se gera comissão
- `Custo`: indica se nas notas de entrada movimenta o custo
- `Tipo`: tipo de movimento que a nota realiza
- `CFOPEstadoNC`: CFOP para dentro do estado não contruinte
- `CFOPForaEstadoNC`: CFOP para fora do estado não contribuinte
- `CFOPEstadoC`: CFOP para dentro do estado contribuinte
- `CFOPForaEstadoC`: CFOP para dentro do estado contribuinte
- `Série`: Série da nota
- `ContadorNota`: contador da nota
- `DigitaNota`: indica se o usuário pode informar o numero da nota
- `IsentoICMS`: indica se a nota não deve gerar ICMS
- `NotaComplementar`: indica se a nota é complemento de ICMS
- `TipoEstoque`: tipo de estoque que deve ser movimentado no COI
- `Obs1`: observações já cadastradas para a nota no COI
- `Obs2`
- `Obs3`
- `Obs4`
- `Obs5`
- `NotaPrópria`: indica se a nota é gerada pela empresa
- `NFESefaz`: indica se é NFe
- `UsaCusto`: indica se os produtos devem buscar o preço de custo ao invés de venda
- `ContaCrédito`: conta para lançamento de receita do valor dos produtos
- `ContaDébito`: conta para lançamento de despesa do valor dos produtos
- `NFeExtorno`: indica se a nota é uma nota de estorno
- `TributaPIS`: indica se deve tributar PIS
- `TributaCofins`: indica se deve tributar COFINS
- `NaturezaOperação`: natureza da operação que deve constar na nota
- `EstoqueContrapartida`: estoque de contrapartida dos produtos
- `OcultaValorImposto`: não gerar valor aproximado de impostos
- `Difal`: indica se deve calcular Difal de ICMS
- `ContaResultados`: subconta de resultados para geração da duplicata
- `GeraCompetência`: indica se gera lançamentos na apuração por competência
- `ContaCMV`: indica se gera lançamentos de CMV para apuração de custos
- `InformaEstoqueContrapartida`: indica se permite alterar o estoque de contrapartida
- `SolicitaLiberação`: indica se pede liberação para usar o COI
- `TabelaPreço`: tabela de preço vinculada
- `CSTPadrão`: cst padrão dos produtos para contribuinte
- `CSOSNPadrão`: csosn padrão dos produtos para contribuinte simples
- `CSTPadrãoNC`: cst padrão dos produtos para não contribuinte
- `CSOSNPadrãoNC`: csosn padrão dos produtos para não contribuinte simples
- `CSTPisCOFINS`: cst para PIS e COFINS para contribuintes
- `CSTPisCOFINSNC`: cst para PIS e COFINS para não contribuintes
- `NãoEtiquetaRastreio`: identifica que o movimento não deve gerar rastreabilidade dos produtos
- `NFAjuste`: identifica que a nota gerada será de ajuste
- `FinNFe`: finalidade da NFe
- `GeraDevOS`: identifica que ao emitir a nota, vai automaticamente gerar uma nota de devolução dos equipamentos da OS
- `NaoSomaICMS`: identifica que não deve ser somado o valor do ICMS no total da nota
- `NaoSomaIPI`: identifica que não deve ser somado o valor do IPI no total da nota
- `NaoSomaII`: identifica que não deve ser somado o valor do Imposto de Importação no total da nota
- `NaoSomaOutras`: identifica que não deve ser somado o valor de outras despesas no total da nota
- `SomaPISCOFINS`: identifica que a soma do PIS e COFINS dos produtos deve ser somado no total da nota (nota de importação)

---

### ConfiguraCOIEmpresa
- **Descrição:** Configuração de COI por Empresa
- **Relacionamento:** 
- `Identificação` → `ConfiguraçãoCOI.Identificação`
- `Empresa` → `Empresas.CodEmpresa`
- **Campos:**
- `CodInterno`: Codigo interno pk
- `Empresa`: empresa da configuração
- `Identificação`: COI
- `SaldoEstoque`: indica se movimenta estoque
- `TipoEstoque`: tipo de estoque que deve ser movimentado no COI
- `EstoqueContrapartida`: estoque de contrapartida dos produtos

---

### ConfiguraçãoComanda
- **Descrição:** Depreciado

---

### ConfiguraçãoNFS
- **Descrição:** Configuração para impressão matricial da NF, depreciado

---

### ConfiguracoesPortal
- **Descrição:** Configuração do Portal de Clientes, manipulado pelo IntegraService

---

### ConfiguracoesPortalFormasPagto
- **Descrição:** Configuração do Portal de Clientes, manipulado pelo IntegraService

---

### ConfiguracoesPortalFormasPagtoNaoAtualiza
- **Descrição:** Configuração do Portal de Clientes, manipulado pelo IntegraService

---

### ConfiguracoesPortalLinksRedesSociais
- **Descrição:** Configuração do Portal de Clientes, manipulado pelo IntegraService

---

### ConfiguracoesPortalProspect
- **Descrição:** Configuração do Portal de Clientes, manipulado pelo IntegraService

---

### ConfiguracoesPortalProspectUnidade
- **Descrição:** Configuração do Portal de Clientes, manipulado pelo IntegraService

---

### ConfiguraGNRE
- **Descrição:** Configuração para comunicação Sefaz para gerar a GNRE por estado
- **Campos:**
- `CodInterno`: código interno PK
- `GNREIdentifica`: tipo de imposto, Difal ou FCP
- `UF`: estado
- `CodigoReceita`: código da receita do imposto
- `DetalhamentoReceita`: código de detalhe da receita
- `Produto`: código do produto no detalhamento
- `TipoDocumentoOrigem`: código do tipo de documento no detalhamento
- `Convenio`: código do convênio
- `CodigoCampoExtra`: código do campo extra no detalhamento
- `TipoCampoExtra`: tipo de campo extra
- `ExigeDestinatario`: identifica se deve ser preenchido o destinatário
- `ExigeCampoExtra`: identifica se deve ser preenchido o campo extra
- `ExigeTipoDocumento`: identifica se deve ser preenchido o tipo de documento
- `ExigeReferencia`: identifica se deve ser preenchida a referência
- `ExigeProduto`: identifica se deve ser preenchido o produto
- `ExigeDetalhamentoReceita`: identifica se deve ser preenchido o detalhamento da receita

---

### ConfiguraNotaDigital
- **Descrição:** Configuração para emissão de NFSe
- **Relacionamento:** 
- `Empresa` → `Empresas.CodEmpresa`
- `CódigoAtividade` → `TipoServiços.Código`
- **Campos:**
- `CodInterno`: código interno PK
- `Empresa`: código da empresa
- `InscricãoMunicipal`: inscrição municipal da empresa
- `SérieDocumento`: série da NFSe
- `NaturezaOperação`: natureza da operação de serviço
- `CódigoMunicípio`: código do município
- `CódigoAtividade`: tipo de serviço prestado
- `CPFUsuário`: CPF do usuário da prefeitura
- `SenhaUsuário`: senha usuário prefeitura
- `CaminhoCertificado`: caminho do certificado para assinatura
- `SenhaCertificado`: senha do certificado
- `EmailRemetente`: email remetente
- `LoginSMTP`: usuário do SMTP para envio do email
- `SenhaSMTP`: senha do SMTP para envio do email
- `ServidorSMTP`: caminho do servidor SMTP
- `SMTPAutenticado`: identifica se o SMTP exige autenticação

---

### ConsultasSPC
- **Descrição:** Resultados das Consultas de Crédito (SPC, Serasa, etc)
- **Relacionamento:** 
- `CodCliente` → `Clientes.CodCliente`
- `CodProspect` → `Prospects.CodProspect`
- `Unidade` → `Unidades.CodUnidade`
- **Campos:**
- `CodInterno`: código interno PK
- `CodCliente`: código do cliente
- `CodProspect`: quando ainda não cadastrado o cliente, traz o prospect
- `Consulta`: data e hora da consulta
- `Usuário`: quem consultou
- `Documento`: CPF/CNPJ consultado
- `TipoConsulta`: tipo de consulta que foi executada
- `ComRestrição`: identifica se o CPF/CNPJ tem restrições de crédito (quando existe o dado na consulta)
- `XMLRetorno`: retorno do servidor da consulta
- `HTMLRetorno`: html formatado para exibição ao usuário
- `Nome`: nome retonado da consulta
- `Fantasia`: fantasia retornada
- `Endereço`: endereço retornado
- `NumCasa`: número do endereço
- `Bairro`: bairro do endereço
- `Cidade`: cidade do endereço
- `Estado`: estado do endereço
- `CEP`: CEP do endereço
- `RG`: número do RG retornado
- `Inscrição`: número da inscrição estadual retornada
- `Email`: email retornado
- `Telefone`: telefone retornado
- `Celular`: telefone retornado
- `Fax`: telefone retornado
- `Complemento`: complemento do endereço
- `Unidade`: unidade da consulta

---

### ContabilidadeLayouts
- **Descrição:** Obsuleto

---

### ContabilidadeLayoutsConfiguração
- **Descrição:** Obsuleto

---

### ContasCaixa
- **Descrição:** Contas de caixa que recebem lançamentos de movimento de caixa, exemplo: CEF, Bradesco, Caixa Físico, etc
- **Relacionamento:** 
- `CodCaixa` → `MovimentoCaixa.Caixa`
- `CodBanco` → `Bancos.CodBanco`
- `Unidade` → `Unidades.CodUnidade`
- **FiltroExibeCaixa:**
- `0`: somente empresa atual
- `1`: consolidado de todas as empresas
- `2`: consolidado das empresas conciliadas
- `3`: consolidado das empresas da unidade
- **Campos:**
- `CodCaixa`: código da conta de caixa
- `Descreve`: nome/descrição da conta de caixa
- `ContaCorrente`: Indica se é conta corrente ou poupança ou caixa fisico
- `CodBanco`: banco da conta
- `Agência`: agência da conta
- `Conta`: número da conta
- `Titular`: titular da conta
- `Aplicação`: Indica se é aplicação financeira ou não
- `Unidade`: unidade da conta (se 0 consta em todas as unidades)
- `SérieCheque`: Série para emissão de cheque
- `TempoCompensação`: Dias para considerar como vencido em alguns relatórios
- `ContaExportacao`: conta contábil para exportações
- `Inativo`: indica se a conta está inativa
- `EmpresasLiberadas`: lista as empresas onde a conta deve constar, se vazio em todas
- `FiltroExibeCaixa`: forma como deve mostrar o saldo no movimento financeiro
- `LimiteChequeEspecial`: valor de limite do cheque especial
- `Gera1601`: identifica se no Sped Fiscal a conta deve gerar o registro 1601
- `Cliente1601`: quando gera o registro 1601, identifica o cliente da instituição bancária
- `Credencial`: credencial do PJ Bank para integração de pagamentos
- `Chave`: chave do PJ Bank para integração de pagamentos
- **Regras:**
- Ignorar registros com `Inativo = 1`
- Considerar como conta corrente contas com `ContaCorrente = 1` e aplicação financeira contas com `Aplicação = 0`
- Considerar como caixa físico contas com `ContaCorrente = 0` e `Aplicação = 0`
- Considerar como aplicação financeira contas com `ContaCorrente = 0` e `Aplicação = 1`

---

### ContasCaixaCentros
- **Descrição:** Obsuleto

---

### ContasDébito
- **Descrição:** Cadastro da conta do cliente para débito automático de faturas
- **Relacionamento:** 
- `Cliente` → `Clientes.CodCliente`
- `Banco` → `Bancos.CodBanco`
- **Campos:**
- `CodInterno`: código interno PK
- `Banco`: instituição bancária
- `Agência`: número da agência da conta do cliente
- `Conta`: número da conta
- `DígitoConta`: dígito verificador da conta
- `RazãoConta`: razão da conta
- `CNPJConta`: cpf ou cnpj do cliente na conta
- `Operação`: para a CEF, operação da conta
- `Startup`: depreciado
- `IdentificadorCliente`: código que identifica o cliente no débito automático do banco

---

### ContasMovimento
- **Descrição:** São os movimentos de recebimento ou pagamento de contas a pagar e receber
- **Relacionamento:** 
- `Duplicata` → `ContasReceber.CodInterno`/`ContasPagar.CodInterno`
- `PlanílhaCaixa` → `MovimentoCaixa.Planílha`
- `CaixaBaixa` → `ContasCaixa.CodCaixa`
- **Campos:**
- `CodInterno`: código interno PK
- `Duplicata`: código interno da duplicata
- `DataMovimento`: data da ocorrência
- `FormaPgto`: descrição da forma como foi feito o movimento
- `Valor`: valor da baixa
- `Usuário`: quem fez a baixa
- `Juros`: valor dos juros/descontos (quando negativo se trata de um desconto)
- `RecPag`: R - Contas a Receber, P - Contas a Pagar
- `PlanílhaCaixa`: planílha de caixa que gerou o movimento
- `ObsBaixaAvulsa`: observações registradas quando baixa avulsa
- `BrasPagID`: id da transação no cartão de crédito
- `DataBaixaDuplicata`: data em que a duplicata recebeu baixa (ex DataMovimento na segunda mas duplicata quitada na sexta, registra DataBaixaDuplicata da sexta)
- `TarifasBanco`: valor das tarifas bancárias
- `CaixaBaixa`: conta de caixa onde foi movimentada a duplicata

---

### ContasPagar
- **Descrição:** Contas a pagar aos fornecedores.
- **Relacionamento:** 
- `Fornecedor` → `Clientes.CodCliente`
- `CentroResultados` → `SubContas.CodInterno` 
- `Planílha` → `NotasFiscaisEntrada.Planilha`
- `Empresa` → `Empresas.CodEmpresa`
- `FormaPagamento` → `FormasPagto.CodFormaPagto`
- `ContaVinculada` → `ContasCaixa.CodCaixa`
- **Campos:**
- `Empresa`: código da empresa
- `Operação`: operação que gerou a duplicata
- `Fornecedor`
- `NotaFiscal`: número da nota fiscal
- `Série`: série da nota fiscal
- `DataEmissão`: data de emissão da duplicata
- `FormaPagamento`: forma de pagamento da duplicata (Dinheiro, Cartão, Boleto, etc)
- `Pago`: identifica se a duplicata está quitada (Saldo=0)
- `Número`: número da duplicata, geralmente é o número da nota fiscal
- `Letra`: parcela, ex 01, 02, 03, etc
- `Vencimento`: data de vencimento
- `ValorDuplicata`: valor da duplicata
- `DataPagamento`: data de pagamento
- `Credito`: valor da duplicata
- `Debito`: valor pago
- `Saldo`: valor pendente a pagar
- `Planílha`: código da planilha
- `Usuário`: quem gravou a duplicata
- `CodInterno`: código interno PK
- `Impresso`: depreciado
- `Agrupada`: indica se a duplicata em questão é uma duplicata de agrupamento
- `Selecionada`: depreciado
- `CentroResultados`: conta contábil ou centro de resultados da despesa, identifica se é energia eletrica, combustivel, estoque, etc
- `AcrescimosFinanceiros`: valor de acréscimos que a duplicata pode ter
- `Liberado`: indica se a duplicata foi liberada para pagamento
- `DataLiberação`: data da liberação para pamento
- `UsuárioLiberação`: quem liberou o pagamento
- `LiberadoHolding`: depreciado
- `DataLiberaçãoHolding`: depreciado
- `UsuárioLiberaçãoHolding`: depreciado
- `Observações`: observações da duplicata
- `Observações2`: segundas observações da duplicata
- `NumCP`: número da CP (comando de pagamento)
- `Confirmado`: indica se a CP foi finalizada no caixa
- `DataConfirmação`: data da confirmação
- `UsuárioConfirmação`: quem confirmou
- `Favorecido`: nome do favorecido na duplicata
- `JurosDuplicata`: valor de juros embutidos na duplicata
- `SelePla`: depreciado
- `EventosDuplicata`: log de eventos da duplicata
- `CodigoBarras`: código de barras da duplicata
- `Remessa`: indica se foi gerada remessa de contas a pagar
- `ContaVinculada`: conta de caixa em que espera-se pagar a duplicata
- `LiberadaPagto`: indica se a duplicata está liberada para pagamento
- `LiberadaPagtoData`: data da liberação
- `LiberadaPagtoPor`: quem liberou
- `VencimentoOriginal`: guarda a data do primeiro vencimento da duplicata caso ocorram alterações
- `Beneficiário`: nome do beneficiário da duplicata
- `CNPJBeneficiário`: CNPJ/CPF do beneficiário da duplicata
- `RespLiberação`: o responsável pela liberação a pagar

---

### ContasPagarAgrupadas
- **Descrição:** São as duplicatas que compõe um agrupamento, ao agrupar elas passam para esta tabela deixando a duplicata agrupada no ContasPagar
- **Relacionamento:** 
- `DuplAgrupada` → `ContasPagar.Planílha`
- **Campos:**
- `CodInternoOriginal`: codinterno original da tabela ContasPagar 
- `DuplAgrupada`: planílha da duplicata agrupadora que está no ContasPagar
- Demais campos são os mesmos de ContasPagar

---

### ContasPagarCancelamento
- **Descrição:** Duplicatas de contas a pagar que foram canceladas (excluídas)
- **Relacionamento:** 
- `Fornecedor` → `Clientes.CodCliente`
- `Empresa` → `Empresas.CodEmpresa`
- **Campos:**
- `CodInterno`: código interno PK
- `Fornecedor`
- `Número`: número da duplicata, geralmente é o número da nota fiscal
- `Letra`: parcela, ex 01, 02, 03, etc
- `NumCP`: número da CP (comando de pagamento)
- `Empresa`: empresa da duplicata
- `ValorDuplicata`: valor da duplicata
- `Observações`: observações da duplicata
- `Observações2`: segundas observações da duplicata
- `Favorecido`: nome do favorecido na duplicata
- `MotivoCancelamento`: descreve o motivo do cancelamento
- `DataCancelamento`: data em que foi cancelada a duplicata
- `UsuárioCancelamento`: quem cancelou a duplicata

---

### ContasPagarCentro
- **Descrição:** Rateio de centros de custos da duplicata de contas a pagar
- **Relacionamento:** 
- `Planílha` → `ContasPagar.Planílha`
- `CodCentro` → `Centros.CodInterno`
- `ContaResultados` → `SubContas.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `Planílha`: planílha das duplicatas atreladas
- `CodCentro`: código do centro de custos
- `Percentual`: percentual do rateio
- `ContaResultados`: subconta de resultados, quando nulo vale a da duplicata

---

### ContasPagarEmpresas
- **Descrição:** Rateio das duplicatas de contas a pagar entre empresas
- **Relacionamento:** 
- `Planílha` → `ContasPagar.Planílha`
- `Empresa` → `Empresas.CodEmpresa`
- **Campos:**
- `CodInterno`: código interno PK
- `Planílha`: planílha das duplicatas atreladas
- `Empresa`
- `Percentual`: percentual do rateio

---

### ContasPagarPrevisão
- **Descrição:** Previsões de contas a pagar lançadas
- **Relacionamento:** 
- `Fornecedor` → `Clientes.CodCliente`
- `PlanílhaNota` → `NotasFiscaisEntrada.Planilha`
- `CentroResultados` → `SubContas.CodInterno`
- `FPagto` → `FormasPagto.CodFormaPagto`
- `ContaVinculada` → `ContasCaixa.CodCaixa`
- `Empresa` → `Empresas.CodEmpresa`
- `PlanílhaPedido` → `Pedidos.Planílha`
- **Campos:**
- `CodInterno`: código interno PK
- `Descrição`: descrição da previsão
- `Emissão`: data da gravação
- `Vencimento`: vencimento da previsão
- `ValorPrevisto`: valor da previsão 
- `Usuário`: quem gravou a previsão
- `Efetivado`: indica se a previsão foi efetivada
- `PlanílhaNota`: planílha da nota que efetivou a previsão
- `CentroResultados`: subconta de resultados atrelada
- `FPagto`: forma de pagamento
- `ContaVinculada`: conta de caixa prevista para pagamento
- `Empresa`
- `PlanílhaPedido`: planílha do pedido de compra quando efetivada por pedido
- `ObsCompra`: observações

---

### ContasPagarPrevisãoCentro
- **Descrição:** Rateio de centros de custos da previsão de contas a pagar
- **Relacionamento:** 
- `CodPrev` → `ContasPagarPrevisão.CodInterno`
- `CodCentro` → `Centros.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `CodPrev`: código da previsão
- `CodCentro`: código do centro de custos
- `Percentual`: percentual do rateio

---

### ContasReceber
- **Descrição:** Contas a receber dos clientes.
- **Relacionamento:** 
- `Cliente` → `Clientes.CodCliente`
- `CentroResultados` → `SubContas.CodInterno` 
- `Planílha` → `NotasFiscaisSaída.Planílha`
- `Empresa` → `Empresas.CodEmpresa`
- `FormaPagamento` → `FormasPagto.CodFormaPagto`
- `CodMarketing` → `CampanhaMarketingBoleto.CodCampanha`
- `CodFatLote` → `FaturamentosRealizados.CodInterno`
- `CodMarketingVei` → `GRVeículos.CodInterno`
- `WakeEmpresaRegistro` → `Empresas.CodEmpresa`
- **Campos:**
- `Empresa`: código da empresa
- `Operação`: operação que gerou a duplicata
- `Cliente`
- `NotaFiscal`: número da nota fiscal
- `Série`: série da nota fiscal
- `DataEmissão`: data de emissão da duplicata
- `FormaPagamento`: forma de pagamento da duplicata (Dinheiro, Cartão, Boleto, etc)
- `Pago`: indica se a duplicata foi quitada (Saldo=0)
- `Número`: número da duplicata, geralmente é o número da nota fiscal
- `Letra`: parcela, ex 01, 02, 03, etc
- `Vencimento`: data de vencimento
- `ValorDuplicata`: valor da duplicata
- `Credito`: mesmo ValorDuplicata
- `Debito`: valor recebido
- `Saldo`: valor a receber
- `Planílha`: código da planilha
- `Usuário`: quem gravou a duplicata
- `CodInterno`: código interno PK
- `NossoNumero`: nosso número do boleto bancário
- `DataPagamento`: data de recebimento 
- `Impresso`: indica se a duplicata foi impressa
- `Agrupada`: indica se a duplicata é um agrupamento
- `Selecionada`: depreciada
- `BloquetoImpresso`: indica se o boleto foi impresso/enviado
- `CentroResultados`: conta contábil ou centro de resultados da receita, permite verificar sobre o que é a receita: monitoramento, rastreamento, manutenção, etc
- `Remessa`: indica se a duplicata teve remessa gerada
- `AcrescimosFinanceiros`: valor de acréscimos financeiros embutidos na duplicata
- `PedidoBaixa`: indica se a duplicata está pendente de remessa de baixa
- `PedidoAlteração`: indica se a duplicata está pendente de remessa de alteração
- `DuplicataDescontada`: indica se a duplicata recebeu desconto (antecipação de recebível)
- `Protesto`: indica se a duplicata foi protestada na assessoria
- `VencimentoOriginal`: vencimento original da duplicata em caso de alterações
- `SelePla`: obsuleto
- `Assessoria`: indica se a duplicata foi enviada para assessoria
- `ForaRegime`: indica que recebeu baixa foi avulsa e deve ficar fora do regima de caixa
- `NFLoca`: indica que a duplicata é de receita de locação
- `JurosBoleto`: juros embutidos no boleto
- `EventosDuplicata`: log de eventos da duplicata
- `BrasPagID`: id da baixa feita por cartã de crédito
- `NumeroRemessa`: contador da remessa de entrada de título
- `RemessaBanco`: banco da remessa
- `RemessaAgência`: agência da remessa
- `RemessaDVConta`: dv conta remessa
- `BoletoLinhaDigitavel`: linha digitável do boleto bancário
- `BoletoCodigoBarras`: representação numérica do código de barras
- `NãoEnviarSerasa`: indica que não deve ser protestado
- `CodMarketing`: código da campanha de marketing ao qual o boleto pertence
- `BoletoProtestado`: indica se o boleto foi a protesto pelo banco
- `RemessaBluestar`: indica se o boleto foi enviado para a BlueStar (assessoria)
- `IDInBoleto`: código da duplicata no PJBank
- `EntradaConfirmada`: data em que o boleto recebeu retorno de entrada confirmada
- `LinkBoleto`: link do boleto no PJBank
- `PedidoAbatimento`: valor de pedido de abatiemtno
- `IDUnicoPJ`: código da duplicata no PJBank
- `NomeAssessoria`: assessoria que está com o boleto
- `EliminadaPJ`: indica se a duplicata foi baixada no PJBank
- `CodFatLote`: código do faturamento em  lote que gerou a duplicata
- `CodMarketingVei`: veículo atrelado a campanha de marketing
- `ErroCartão`: indica se houve erro ao processar o pagamento por cartão
- `IDWakeUp`: ID da duplicata na WakeUp (assessoria)
- `WakeEmpresaRegistro`: Empresa em que houve registro da duplicata
- `PixUrl`: URL do PIX
- `PixTxId`: TxID do PIX
- `PixEMV`: QRCode Copie a Cola do PIX
- `CodRestriçãoInnove`: ID da restrição na Innove (Protesto)
- `IDCobrance`: ID na Cobrance (cobrança)

---

### ContasReceberAgrupadas
- **Descrição:** São as duplicatas que compõe um agrupamento, ao agrupar elas passam para esta tabela deixando a duplicata agrupada no ContasReceber
- **Relacionamento:** 
- `DuplAgrupada` → `ContasReceber.Planílha`
- **Campos:**
- `CodInternoOriginal`: codinterno original da tabela ContasReceber 
- `DuplAgrupada`: planílha da duplicata agrupadora que está no ContasReceber
- Demais campos são os mesmos de ContasReceber

---

### ContasReceberAgrupadasServiçosAdicionais
- **Descrição:** Serviços adicionais vinculados a duplicatas que estão compondo um agrupamento
- **Relacionamento:** 
- `CodDuplicata` → `ContasReceberAgrupadas.CodInterno`
- `CodServiço` → `ServiçosAdicionais.CodInterno`
- `PlanílhaAgrupada` → `ContasReceberAgrupadas.Planílha`
- `CodFatLote` → `FaturamentosRealizados.CodInterno`
- `ContaVinculada` → `SubContas.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `CodDuplicata`: duplicata agrupada atrelada
- `CodServiço`: código do serviço adicional
- `ValorServiço`: valor do serviço adicional
- `PlanílhaAgrupada`: planílha do contas a receber agrupador
- `CodFatLote`: código do faturamento em  lote que gerou o agrupamento
- `ContaVinculada`: subconta de resultados vinculada ao serviço

---

### ContasReceberAjustes
- **Descrição:** Duplicatas que sofreram ajustes
- **Relacionamento:** 
- `Cliente` → `Clientes.CodCliente`
- `Empresa` → `Empresas.CodEmpresa`
- `CodDuplicata` → `ContasReceber.CodInterno`/`ContasPagar.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `CodDuplicata`: duplicata ajustada
- `Cliente`: código do cliente
- `Empresa`: empresa da duplicata
- `Número`: número da duplicata
- `Letra`: letra da duplicata
- `RecPag`: R - Contas a Receber, P - Contas a Pagar
- `DataAjuste`: quando foi gravado o ajuste
- `Ajuste`: qual o ajuste feito
- `Usuário`: quem fez o ajuste

---

### ContasReceberCobranças
- **Descrição:** Cobranças que foram efetuadas nas duplicatas
- **Relacionamento:** 
- `Duplicata` → `ContasReceber.CodInterno`
- `CodCobrança` → `Cobrança.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `Duplicata`: duplicata cobrada
- `Evento`: quando foi a cobrança
- `Usuário`: quem fez a cobrança
- `Meio`: através de qual recurso a duplicata foi cobrada
- `CodCobrança`: código do evento de cobrança vinculado

---

### ContasReceberEliminadas
- **Descrição:** Duplicatas que foram excluídas da tabela ContasReceber (cancelamento de notas etc)
- **Relacionamento:** 
- `Cliente` → `ContasReceber.CodInterno`
- `Empresa` → `Cobrança.CodInterno`
- `CentroResultados` → `SubContas.CodInterno`
- `FormaPagamento` → `FormasPagto.CodFormaPagto`
- **Campos:**
- `CodInterno`: código interno PK
- `Planílha`: planílha da duplicata
- `DataCancelamento`: quando foi excluída
- `Usuário`: quem excluiu
- `MotivoCancelamento`: motivo ao qual a duplicata foi excluída
- `Número`: número da duplicata
- `Letra`: letra da duplicata
- `Emissão`: data de emissão da duplicata
- `Vencimento`: data de vencimento da duplicata
- `Cliente`: código do cliente
- `NomeCliente`: nome do cliente
- `Empresa`: empresa da duplicata
- `ValorDuplicata`: valor da duplicata
- `NossoNúmero`: nosso número da duplicata
- `EventosDuplicata`: log de eventos da duplicata
- `CodInternoOriginal`: codinterno original da tabela ContasReceber
- `CentroResultados`: subconta de resultados da receita da duplicata
- `Remessa`: indica se sofreu remessa
- `FormaPagamento`: forma de pagamento
- `LinkBoleto`: link do boleto PJ
- `IDUnicoPJ`: ID do boleto PJ
- `PixUrl`: Url do PIX
- `PixTxId`: TxID do PIX
- `PixEmv`: EMV do PIX (copia e cola)
- `CodRestriçãoInnove`: Código da duplicata na Innove
- `BrasPagID`: Código da baixa de cartão de crédito
- `IDInBoleto`: ID do boleto PJ
- `IDCobrance`: ID na Cobrance (cobrança)

---

### ContasReceberServiçosAdicionais
- **Descrição:** Serviço adicionais vinculados a duplicata (identifica os serviços que a duplicata está quitando)
- **Relacionamento:** 
- `CodDuplicata` → `ContasReceber.CodInterno`
- `CodServiço` → `ServiçosAdicionais.CodInterno`
- `CodFatLote` → `FaturamentosRealizados.CodInterno`
- `ContaVinculada` → `SubContas.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `CodDuplicata`: código da duplicata de contas a receber
- `CodServiço`: código do serviço
- `ValorServiço`: valor do serviço
- `CodFatLote`: código do faturamento que gerou a duplicata
- `ContaVinculada`: subconta de resultados vinculada ao serviço adicional

---

### ContasSaldo
- **Descrição:** Saldo de contas nas conciliações com OFX
- **Relacionamento:** 
- `CodConta` → `ContasCaixa.CodCaixa`
- **Campos:**
- `CodInterno`: código interno PK
- `CodConta`: código da conta
- `DataSaldo`: data do saldo
- `Saldo`: saldo da conta no dia
- `Planílha`: planílha da conciliação

---

### ContasTransações
- **Descrição:** Transações da conta importadas do arquivo OFX do banco
- **Relacionamento:** 
- `CodConta` → `ContasCaixa.CodCaixa`
- `Planílha` → `ContasSaldo.Planílha`
- **Campos:**
- `CodInterno`: código interno PK
- `CodConta`: código da conta
- `Data`: data da transação
- `TipoTransação`: tipo de transação (DEBIT, CREDIT)
- `FitID`: identificador único da transação
- `CheckNum`: número do cheque ou identificador de transação
- `Memo`: texto de descrição da transação
- `ValorTransação`: valor da transação (positivo em Crédito, negativo em Débito)
- `Planílha`: planílha da importação do OFX (identifica uma importação)
- `Status`: se 'X' está conciliado
- `PlaVinculo`: planílha do movimento de caixa que está vinculado
- `SaldoConta`: obsuleto

---

### CorrigeLocados
- **Descrição:** Clientes locados possuem equipamentos da empresa em sua posse, essa tabela ajusta os equipamentos que estão com o cliente quando necessário
- **Relacionamento:** 
- `CodCliente` → `Clientes.CodCliente`
- `CodProduto` → `Produtos.CodProduto`
- **Modalidade:**
- `V`: Venda
- `L`: Locação
- `E`: Empréstimo
- `G`: Garantia
- `B`: Gratifica
- `I`: Interno
- `M`: Manutencao
- **Campos:**
- `CodInterno`: código interno PK
- `CodCliente`: código do cliente
- `CodProduto`: código do produto
- `Quantidade`: quantidade do item
- `Data`: data em que o cliente recebeu o produto
- `Responsável`: quem incluiu
- `Observações`: observações do produto
- `Modalidade`: modalidade de negociação do produto

---

### Cotação
- **Descrição:** Registro das cotações do Dólar, obsuleto

---

### Cotações
- **Descrição:** Cotações de preços produtos
- **Relacionamento:** 
- `Unidade` → `Unidades.CodUnidade`
- `Conciliadora` → `Empresas.CodEmpresa`
- **Status:**
- `A`: Aberta
- `F`: Encerrada
- `C`: Cancelada
- **Campos:**
- `CodInterno`: código interno PK
- `Identificação`: nome da cotação
- `DataCotação`: data em que foi iniciada
- `Usuário`: quem gravou
- `Unidade`: unidade da cotação
- `Status`: status da cotação
- `DataFechamento`: data do encerramento
- `UsuárioFechamento`: usuário que encerrou
- `Conciliadora`: empresa conciliadora da cotação
- `MotivoCancelamento`: motivo que a cotação foi cancelada
- `PrazoMedia`: prazo de vendas para exibir na tela de edição da cotação

---

### CotaçõesFornecedores
- **Descrição:** Fornecedores de uma cotação de preços
- **Relacionamento:** 
- `CodCotação` → `Cotações.CodInterno`
- `CodFornecedor` → `Clientes.CodCliente`
- `FormaPagamento` → `FormasPagto.CodFormaPagto`
- `Transportadora` → `Clientes.CodCliente`
- **Campos:**
- `CodInterno`: código interno PK
- `CodCotação`: código da cotação
- `CodFornecedor`: código do fornecedor
- `Obs`: observações do fornecedor na cotação
- `NomeContato`: nome de contato
- `EmailContato`: email de contato
- `FoneContato`: fone de contato
- `FormaPagamento`: condição de pagamento
- `VigênciaCotação`: prazo que a cotação vale
- `Transportadora`: transportadora que vai ser usada para receber o produto
- `PrazoEntrega`: dias em que demora a entrega
- `TipoFrete`: 1 - por conta do fornecedor, 2 - por conta do cliente
- `ValorFrete`: valor do frete
- `PrazoPagamento`: dias de prazo para pagamento
- `EmailEnviado`: quando foi gerado o envio de email
- `LinkCotacao`: link da cotação enviado para o fornecedor
- `Assinado`: indica se o fornecedor preencheu a cotação pelo link
- `FornecedorTelefone`: telefone preenchido
- `NomePreenchido`: nome preenchido
- `DataHoraPreenchimento`: quando preencheu

---

### CotaçõesPedidos
- **Descrição:** Pedidos gerados pela cotação
- **Relacionamento:** 
- `CodCotação` → `Cotações.CodInterno`
- `Planílha` → `Pedidos.Planílha`
- **Campos:**
- `CodInterno`: código interno PK
- `CodCotação`
- `Planílha`

---

### CotaçõesPreços
- **Descrição:** Preços dos produtos da cotação
- **Relacionamento:** 
- `CodCotação` → `Cotações.CodInterno`
- `CodFornecedor` → `Clientes.CodCliente`
- `CodProduto` → `Produtos.CodProduto`
- **Campos:**
- `CodInterno`: código interno PK
- `CodCotação`
- `CodFornecedor`
- `CodProduto`
- `Custo`: valor informado pelo fornecedor
- `CustoReal`: valor com frete e impostos
- `ProdutoTop`: identifica se é o melhor preço da cotação
- `SubTotal`: subtotal do produto x a quantidade
- `TopForçado`: identifica que o usuário definiu a escolha desse preço
- `ObsTributação`: observações do preço

---

### CotaçõesProdutos
- **Descrição:** Preços dos produtos da cotação
- **Relacionamento:** 
- `CodCotação` → `Cotações.CodInterno`
- `CodProduto` → `Produtos.CodProduto`
- `FornecedorTop` → `Clientes.CodCliente`
- **Destaque:**
- `P`: preço selecionado pelo usuário
- `U`: melhor preço
- `I`: preço escolhido pelo regime tributário do fornecedor
- **Campos:**
- `CodInterno`: código interno PK
- `CodCotação`
- `CodProduto`
- `Quantidade`: quantidade de itens que está sendo cotado
- `Observações`: observações do item
- `Destaque`: tipo de destaque do item de acordo como foi escolhido o preço
- `FornecedorTop`: fornecedor com melhor preço
- `CustoTop`: melhor preço
- `QtEstoque`: quantidade em estoque na abertura da cotação
- `ObsUsuário`: observações informadas pelo usuário
- `DescricaoProduto`: descrição do produto que aparece para o fornecedor

---

### CrosChamados
- **Descrição:** Tabela temporária para montagem de relatório

---

### CrosServiços
- **Descrição:** Tabela temporária para montagem de relatório

---

### DadosEntidades
- **Descrição:** Tabela que armazena diversas descrição de cadastros simples, como causas, soluções, etc
- **Relacionamento:** 
- `CodEntidade` → `DadosEntidades.CodEntidade`
- `Unidades` → `Unidades.CodUnidade`
- `Empresas` → `Empresas.CodEmpresa`
- **Campos:**
- `CodInterno`: codinterno pk
- `CodEntidade`: código da entidade
- `Codigo`: códdigo do item
- `Descreve`: descrição do item
- `Unidade`: unidade de cadastro
- `Empresa`: empresa de cadastro
- `Detalhes`: detalhes do dado
- `Inativa`: indica se o item está ativo
- `SSXIDMapIcon`: na entidade de tipos de veículo, informa o icone no SSX
- `SSXIDMapIconColor`: na entidade de tipos de veículo, informa a cor no SSX
- `SSXIgnitionStatus`: para entidade de tipos de veículo, integração com o SSX 
- `SSXOperationalStatus`: para entidade de tipos de veículo, integração com o SSX 
- `SSXGPSStatus`: para entidade de tipos de veículo, integração com o SSX 
- `SSXWarningStatus`: para entidade de tipos de veículo, integração com o SSX 

---

### DadosPedidos
- **Descrição:** Produtos que constam em um Pedido de Compra
- **Relacionamento:** 
- `CodPedido` → `Pedidos.CodPedido`
- `CodProduto` → `Produtos.CodProduto`
- **Campos:**
- `CodInterno`: codinterno pk
- `CodProduto`
- `ValorUnitário`: valor unitário do pedid
- `Quantidade`: quantidade pedida
- `CodPedido`
- `QuantidadeRecebida`: quanto recebeu do item
- `CustoBruto`: preço de custo
- `TotalItem`: subtotal
- `MotivoCompra`: motivo informado para compra
- `DescricaoProduto`: descrição do produto para o fornecedor
- `IPIUn`: valor do IPI unitário
- `IPITot`: valor total do IPI

---

### DadosPlanílhas
- **Descrição:** Tabela de dados temporários que auxilia em diversas telas do sistema

---

### DadosPlanílhasRastreio
- **Descrição:** Tabela de dados temporários que auxilia em diversas telas do sistema

---

### DadosPlanílhasRetirar
- **Descrição:** Tabela de dados temporários que auxilia em diversas telas do sistema

---

### DadosPlanílhasServiços
- **Descrição:** Tabela de dados temporários que auxilia em diversas telas do sistema

---

### DadosR2
- **Descrição:** Dados recebidos da ECF para montagem do SPED

---

### DadosR3
- **Descrição:** Dados recebidos da ECF para montagem do SPED

---

### DébitosRetornos
- **Descrição:** Nos retornos de débito automático, armazena os dados de processamento. Obsuleto

---

### Delivery
- **Descrição:** Depreciado

---

### DeliveryProdutos
- **Descrição:** Depreciado

---

### Deslocamento
- **Descrição:** Não usado no Service, pode estar sendo usado pelo OSMobile

---

### DiárioECF
- **Descrição:** Dados recebidos da ECF para montagem do SPED

---

### DispositivosMobile
- **Descrição:** São os aparelhos de celular autorizados a utilizar os aplicativos mobile
- **Relacionamento:** 
- `Unidade` → `Unidades.CodUnidade`
- `IDUsuário` → `Senhas.IDUsuário`
- **Campos:**
- `CodDispositivo`: codigo interno PK
- `NomeDispositivo`: nome de identificação
- `UltimoAcesso`: data do último acesso
- `Macs`: Mac address do dispositivo
- `Habilitado`: indica se pode acessar o sistema
- `GuidID`: GuidID que identifica o aparelho
- `Unidade`: Unidade para a qual foi cadastrado
- `IDUsuário`: Identifica o usuário vinculado ao sistema
- `IDFcm`: Id para envio de notificações
- `IDPacote`: id do produto que está usando
- `Removido`: se foi cancelado
- `LogEventos`: eventos no cadastro do dispositivo
- `UsuarioLogado`: se está logado neste momento

---

### DPF
- **Descrição:** Obsuleto

---

### EmailBlackList
- **Descrição:** Emails que estão na BlackList (não devem ser enviados)
- **Relacionamento:** 
- `Unidade` → `Unidades.CodUnidade`
- **Campos:**
- `CodInterno`: codigo interno PK
- `Email`: email da blacklist
- `Unidade`: unidade que cadastrou

---

### EmailsControle
- **Descrição:** Gestão de envio de emails e mensanges feito pela MessageHub (enfileiramento e lote de emails e mensagens)
- **Relacionamento:** 
- `Cliente` → `Clientes.CodCliente`
- `CodPerfil` → `SMSPerfil.CodInterno`
- `Empresa` → `Empresas.CodEmpresa`
- **Status:**
- `P`: Pendente de envio
- `X`: Enviado
- `C`: Cancelado
- `A`: Em gravação
- **Campos:**
- `CodInterno`: codigo interno PK
- `Para`: endereços dos destinatários
- `Assunto`: assunto do email
- `Mensagem`: corpo do email
- `CCO`: com cópia oculta
- `Remetente`: identificação do email remetente
- `DataGeração`: quando foi gerado
- `Usuário`: quem gerou
- `DataEnvio`: quando foi enviado ao destinatário
- `TentativaEnvio`: última tentativa de envio com erro
- `TextoErro`: erro retornado ao tentar enviar a mensagem
- `Status`: status da mensagem
- `TentativasEnvio`: quantidade de tentativas de envio com erro
- `SolicitaConfirmação`: endereço de email para gerar em copia para o remetente
- `ConfirmaRecebimento`: endereço de email para receber confirmação de recebimento
- `Cliente`: cliente da mensagem
- `ExcluídoPor`: quem cancelou a mensagem
- `ExcluídoData`: quando foi cancelada
- `DuplicatasBoleto`: nos casos onde o MessageHub deve gerar o PDF do boleto, identifica quais seriam as duplicatas
- `EmailCópias`: outros endereços para enviar em cópia a mensagem
- `CodPerfil`: perfil de cobrança que gerou a mensagem
- `IdMensagemMailgun`: identificador do email gerado no EmailGun
- `ExcluídoMotivo`: motivo que a mensagem foi cancelada
- `Empresa`: identifica qual empresa estava logada quando gerado o email
- `ContaEnvio`: conta que vai ser usada para o envio do email
- `CodLembrete`: campo utilizado pelo MessageHub

---

### Empresas
- **Descrição:** Cadastro das empresas 
- **Relacionamento:** 
- `Unidade` → `Unidades.CodUnidade`
- `Conciliadora` → `Empresas.CodEmpresa`
- `FormaPagamentoPadrão` → `FormasPagto.CodFormaPagto`
- `BraspagHistórico` → `HistóricosCaixa.CodHistórico`
- `BrasPagContrapartida` → `HistóricosCaixaContrapartida.CodContrapartida`
- `FustCodServiço` → `ServiçosAdicionais.CodInterno`
- `FustCOI` → `ConfiguraçãoCOI.Identificação`
- `FustCodProduto` → `Produtos.CodProduto`
- `TipoFaturamentoPadrão` → `TiposFaturamento.CodTipoFaturamento`
- `CentroResultadosFaturamentoOSM` → `SubContas.CodInterno`
- `CentroResultadosFaturamentoOSV` → `SubContas.CodInterno`
- `CentroResultadosFaturamentoOSP` → `SubContas.CodInterno`
- `CentroResultadosFaturamentoOSA` → `SubContas.CodInterno`
- `CentroResultadosFaturamentoOSR` → `SubContas.CodInterno`
- `CentroResultadosFaturamentoOSI` → `SubContas.CodInterno`
- `CentroResultadosFaturamentoOSMServ` → `SubContas.CodInterno`
- `CentroResultadosFaturamentoOSVServ` → `SubContas.CodInterno`
- `CentroResultadosFaturamentoOSPServ` → `SubContas.CodInterno`
- `CentroResultadosFaturamentoOSAServ` → `SubContas.CodInterno`
- `CentroResultadosFaturamentoOSRServ` → `SubContas.CodInterno`
- `CentroResultadosFaturamentoOSIServ` → `SubContas.CodInterno`
- `FatLoteContaOndemand` → `ServiçosAdicionais.CodInterno`
- `ContrapartidaCobrança` → `HistóricosCaixaContrapartida.CodContrapartida`
- `ReqAlmoxCreditoSaida` → `SubContas.CodInterno`
- `ReqAlmoxDebitoSaida` → `SubContas.CodInterno`
- `ReqAlmoxCreditoEntrada` → `SubContas.CodInterno`
- `ReqAlmoxDebitoEntrada` → `SubContas.CodInterno`
- `ReqAlmoxCreditoBaixa` → `SubContas.CodInterno`
- `ReqAlmoxDebitoBaixa` → `SubContas.CodInterno`
- `LocaçãoTipoServiço` → `TipoServiços.Código`
- `LocaçãoTipoISS` → `DadosEntidades.Codigo DadosEntidades.CodEntidade=221`
- `EmpresaContasReceber` → `Empresas.CodEmpresa`
- `CentroResultadosClienteVendido` → `SubContas.CodInterno`
- `CentroResultadosClienteLocado` → `SubContas.CodInterno`
- `CentroResultadosClienteRastreamento` → `SubContas.CodInterno`
- `OSFechamentoTemplate` → `TemplateFortics.CodInterno`
- `TemplateOSAgendamento` → `TemplateFortics.CodInterno`
- `TemplateOSSemAgendamento` → `TemplateFortics.CodInterno`
- `TemplateSegundaViaFortics` → `TemplateFortics.CodInterno`
- `TemplateDeslocamento` → `TemplateFortics.CodInterno`
- `TemplateBoletoNaoEncontrado` → `TemplateFortics.CodInterno`
- **TipoISS:**
- `C`: Isenta da ISS
- `F`: Imune de ISS
- `N`: Não Tributável
- `T`: Tributável
- `G`: ISS Fixo
- `H`: ISS Simples Nacional
- **NFETpEmiss:**
- `1`: Normal
- `2`: Contingência FS
- `3`: Contingência SCAN
- `6`: Contingência SVC-AN
- `7`: Contingência SVC-RS
- **CRT:**
- `1`: Simples Nacional
- `2`: Simples Nacional - Excesso da Receita Bruta
- `3`: Regime Normal
- `4`: MEI
- **SerasaTipoConsulta:**
- `N`: Consulta Completa
- `NS`: Consulta Completa+SPC
- `E`: Consulta Estadual
- `ES`: Consulta Estadual+SPC
- `VG`: Personalizada Vigzul
- `C`: Crednet
- **EmpresaConsultaCrédito:**
- `0`: Serasa
- `1`: SPC
- `2`: Innove
- **CritérioApuraçãoPisCofins:**
- `1`: Regime de Caixa – Escrituração consolidada
- `2`: Regime de Competência - Escrituração consolidada
- `9`: Regime de Competência - Escrituração detalhada
- **TipoArredondamentoISS:**
- `0`: Padrão Service (ABNT)
- `1`: Considerar terceira casa de 0 a 4 para baixo, de 5 a 9 para cima
- `2`: Considerar os dois primeiros decimais, ignorando os demais
- `3`: Norma ABNT NBR 5891
- `4`: Round_Half_Down (Arredonda para baixo quando a terceira casa é menor ou igual a 5)
- `5`: SMF nº 005/GS/SMF/2018 (Arredonda para cima quando a terceira casa é maior que 5)
- **Campos:**
- `CodEmpresa`: codigo da empresa PK
- `RazãoSocial`
- `Fantasia`
- `CGC`: CNPJ da empresa
- `InscriçãoEstadual`
- `Endereço`: endereço com o numero
- `Bairro`
- `Município`
- `Uf`
- `Telefone`
- `CEP`
- `ISS`: percentual padrão de ISS para a empresa em geral
- `Simples`: empresa optante pelo simples
- `SimplesFederal`: empresa optante pelo simples federal (hoje o Simples e Simples Nacional é unificado, em geral marca-se os dois campos)
- `Conciliadora`: empresa que vai conciliar o estoque (a soma dos estoques de todas as empresas concilidas é que vai constar para o usuário)
- `Gerente`: nome do representante legal
- `Atividade`: depreciado
- `TextoNF1...TextoNF10`: texto padrão para notas de serviços no faturamento em lote
- `FormaPagamentoPadrão`: quando não há forma de pagamento específica no cliente, usa esta configuração para as duplicatas de faturamento em lote
- `ComissãoPrimeiroFaturamento`: quando não há campanha de vendas, utiliza este percentual para comissionar mensalidade
- `MargemLucro`: percentual de margem de lucro de produtos esperado pela empresa, é utilizado para calcular a proporcionalidade em comissões de produtos
- `ComissãoPrimeiroFaturamentoLocação`: quando não há campanha de vendas, utiliza este percentual para comissionar mensalidade de cliente de locação
- `Unidade`: unidade para a qual a empresa está vinculada
- `MargemLucroServiços`: percentual de margem de lucro de serviços esperado pela empresa, é utilizado para calcular a proporcionalidade em comissões de serviços
- `InscriçãoMunicipal`
- `CNAE`: CNAE principal da empresa
- `TipoISS`: Situação do ISS - campo depreciado, apesar de estar no cadastro não é usado na aplicação
- `ConciliaNota`: Empresa conciliadora da numeração de nota fiscal, caso duas ou mais empresas precisem manter o mesmo contador de notas
- `ContadorExporta`: Contador de remessa de exportação - campo depreciado, apesar de estar no cadastro não é usado na aplicação
- `SérieECF`: Número de série da ECF - usada para gerar Sped com os dados do OPaf
- `NFEProdução`: Identifica se a NFe está em homologação ou produção
- `NFETpEmiss`: Forma de emissão da NFe
- `NFEWS`: WebService utilizado para emissão de NFe: "AM";"BA";"BA3";"CE";"DF";"GO";"MG";"MS";"MT";"PE";"PR";"PR3";"RS";"RO";"SP";"SP3";"SCAN";"SVAN";"SVRS";"SVC-AN";"SVC-RS"
- `NFECertificado`: Caminho/Identificação do Certificado Digital para emissão da NFe
- `Proxy`: Endereço do proxy quando houver
- `UsuárioProxy`: Usuário do proxy
- `SenhaProxy`: Senha do proxy
- `NFELicença`: Licença do CNPJ para o componente da FlexDocs responsável pela comunicação geral da NFe
- `CCF`: depreciado
- `Contador`: contador reponsável (os dados são usados para gerar Sped)
- `ContadorCPF`
- `ContadorInscrição`
- `ContadorCNPJ`
- `ContadorEndereço`
- `ContadorCEP`
- `ContadorBairro`
- `ContadorFone`
- `ContadorFax`
- `ContadorEmail`
- `ContadorMunicípio`
- `ContadorUF`
- `NFSENatureza`: validar se é usado no NFSe
- `NFSERegime`: validar se é usado no NFSe
- `NFSEIncentivador`: validar se é usado no NFSe
- `NFSETipoRPS`: validar se é usado no NFSe
- `NFSEServiço`: validar se é usado no NFSe
- `NFSECodTributação`: validar se é usado no NFSe
- `NFSEAbrasf`: validar se é usado no NFSe
- `NFSEProdução`: validar se é usado no NFSe
- `NFSECertificado`: validar se é usado no NFSe
- `NFSEProxy`: validar se é usado no NFSe
- `NFSEUsuárioProxy`: validar se é usado no NFSe
- `NFSESenhaProxy`: validar se é usado no NFSe
- `NFSELicença`: validar se é usado no NFSe
- `NFSELote`: validar se é usado no NFSe
- `NFELogo`: caminho do arquivo da logomarca da empresa para o Danfe da NFe
- `NFECréditoICMS`: Percentual de crédito de ICMS para constar em mensagem no Danfe de empresas Simples
- `NFEPercentualICMS`: percentual padrão de ICMS para a empresa
- `Logo`: campo bitmap com a logo da empresa
- `LogoBoletos`: campo bitmap com a logo da empresa para boletos
- `LogoOrçamentos`: campo bitmap com a logo da empresa para fundo de orçamentos
- `LogoPublicidade`: campo bitmap com a logo da empresa para fundo do boleto de publicidade
- `Email`: email da empresa
- `LogoCarta`: campo bitmap com a logo da empresa para cartas de cobrança
- `ContaSerasa`: contador de remessas geradas para o Serasa
- `NFePasta`: pasta onde serão gerados os arquivos XML da NFe
- `NFeVersão`: versão do XML da NFe: 1.10;2.00;3.10;4.00
- `CNAEServiços`: validar se é usado no NFSe
- `OcultaDPF`: depreciado
- `ContadorOPaf`: depreciado
- `CritérioCSOSN`: identifica se usa como critério o CST do Produto/Enquadramento do Cliente (Simples ou Real) para gerar CSOSN do produto na Nota (em empresas simples)
- `OcultarMensagemSimples`: identifica se oculta a mensagem de crédito de ICMS para empresas do Simples
- `RateiaDespesas`: não está na interface, mas identifica se a empresa rateia valores de despesas com outras empresas (em percentual)
- `ContaExportacao`: conta contábil usada para gerar exportações
- `NumECF`: número do equipamento ECF - usado somente para gerar o Sintegra
- `CidadeForo`: cidade foro dos contratos
- `AlíquotaPIS`: alíquota padrão do PIS
- `CSTPis`: CST padrão do PIS
- `AlíquotaCofins`: alíquota padrão do COFINS
- `CSTCofins`: CST padrão do COFINS
- `CRT`: CRT da NFe
- `RTextoNF1...RTextoNF10`: texto padrão para notas de serviços no faturamento em lote de veículos
- `ExibeNFBoleto`: booleano que está inverso, se ExibeNFBoleto então oculta os dados da NF no boleto, o padrão é sempre constar
- `ForçarPisCofins`: identifica que para gerar o Sped Contribuições, deve-se forçar os CSTs e percentais do PIS e COFINS para os padrões da empresa
- `CPFRespEmpresa`: CPF do representante legal
- `LucroReal`: identifica se a empresa está enquadrada no lucro real - afeta geração do Sped
- `RetemImpostosAuto`: identifica se a empresa retem automaticamente IRRF, PIS, COFINS e CSLL
- `LucroRealCumulativo`: identifica se a empresa está enquadrada no lucro real cumulativo - afeta geração do Sped
- `NFeCancelaEvento`: identifica se cancela a NFe por evento
- `TributaICMS`: em empresas simples, identifica se mesmo assim deve tributar icms (excesso de sublimite)
- `EstabelecimentoFortes`: identificação do estabelecimento usado para exportação contábil do Fortes
- `BrasPagProducao`: integração Braspag processamento de cartão - identifica se está em produção
- `BrasPagIdLoja`: integração Braspag processamento de cartão - id do estabelecimento
- `BraspagHistórico`: integração Braspag processamento de cartão - histórico de caixa para baixa de duplicatas
- `BrasPagContrapartida`: integração Braspag processamento de cartão - contrapartida de caixa para baixa de duplicatas
- `CodReceitaICMS`: código da receita do ICMS para geração do Sped Fiscal
- `EnviaEmailNovoCliente`: identifica se usa email de boas vindas para novos clientes
- `EmailNovoClienteAssunto`: assunto do email de boas vindas
- `EmailNovoClienteCorpo`: arquivo html com o corpo do email de boas vindas
- `EmailNovoClienteAnexos`: arquivos anexos do email de boas vindas
- `EmailNovoClienteRemetente`: remetente do email de boas vindas
- `SPCProducao`: integração SPC, define se está em produção
- `SPCUsuário`: integração SPC
- `SPCSenha`: integração SPC
- `SPCOperaPF`: código da operação de pessoa física
- `SPCOperaPJ`: código da operação de pessoa jurídica
- `SerasaProducao`: integração Serasa, define se está em produção
- `SerasaUsuário`: integração Serasa
- `SerasaSenha`: integração Serasa
- `SerasaScore`: depreciado
- `SerasaTipoConsulta`: tipo de consulta no Serasa
- `UsaNFCe`: indica se usa NFCe
- `idToken`: id do token NFCe
- `token`: CSC NFCe
- `SerieNFCe`: Série da NFCe
- `ContadorNFCe`: Contador de nota NFCe
- `FustDiferenciado`: identifica se emite nota de produtos para cobrança do FUST (Fundo de Universalização dos Sistemas de Telecomunicações)
- `FustCodServiço`: serviço adicional que representa o FUST
- `FustCOI`: COI utilizado para faturar a nota do FUST
- `FustCodProduto`: Código do produto para faturamento do FUST
- `PIcmsSimples`: Percentual padrão para ICMS na empresa Simples
- `PIssSimples`: Percentual padrão para ISS na empresa Simples
- `NFCeLaser`: Identifica se a NFCe vai ser impresso na impressora Laser (desmarcado vai gerar TXT para não fiscal)
- `PortalExibeMensagem`: Identifica se no Portal será exibida mensagem ao abrir OS
- `PortalMensagem`: Mensagem a ser exibida quando PortalExibeMensagem=1
- `TipoFaturamentoPadrão`: Tipo de faturamento padrão para novos clientes
- `PagSeguroHistórico`: depreciado
- `PagSeguroContrapartida`: depreciado
- `ExibirMensagemQuitação`: identifica se nos boletos deve constar a mensagem de quitação
- `ZeradoPreços`: depreciado
- `ZeradoEstoque`: depreciado
- `NFCEProdução`: identifica se a NFCe está em produção
- `NFCEWS`: WS de comunicação da NFCe: "AM";"BA";"BA3";"CE";"DF";"GO";"MG";"MS";"MT";"PE";"PR";"PR3";"RS";"RO";"SP";"SP3";"SCAN";"SVAN";"SVRS";"SVC-AN";"SVC-RS"
- `LimiteRetençãoAutomática`: quando RetemImpostosAuto=1, determina o valor de notas onde acima disso deve reter automaticamente
- `CentroResultadosFaturamentoOSM`: centro de resultados para duplicatas de OSs de manutenção
- `CentroResultadosFaturamentoOSV`: centro de resultados para duplicatas de OSs de ampliação
- `CentroResultadosFaturamentoOSP`: centro de resultados para duplicatas de OSs preventidas
- `CentroResultadosFaturamentoOSA`: centro de resultados para duplicatas de OSs de ampliação
- `CentroResultadosFaturamentoOSR`: centro de resultados para duplicatas de OSs de retirada/cancelamento
- `CentroResultadosFaturamentoOSI`: centro de resultados para duplicatas de OSs internas
- `CentroResultadosFaturamentoOSMServ`: centro de resultados para duplicatas de serviços de OSs de manutenção
- `CentroResultadosFaturamentoOSVServ`: centro de resultados para duplicatas de serviços de OSs de ampliação
- `CentroResultadosFaturamentoOSPServ`: centro de resultados para duplicatas de serviços de OSs preventidas
- `CentroResultadosFaturamentoOSAServ`: centro de resultados para duplicatas de serviços de OSs de ampliação
- `CentroResultadosFaturamentoOSRServ`: centro de resultados para duplicatas de serviços de OSs de retirada/cancelamento
- `CentroResultadosFaturamentoOSIServ`: centro de resultados para duplicatas de serviços de OSs internas
- `EmpresaConsultaCrédito`: tipo de integração para consulta de crédito
- `OSsISSPadrão`: ISS padrão para OSs
- `BrotherLayoutProdutos`: Layout da Brother para etiquetas de produtos
- `DiferencialRemessa`: Diferencial de remessa para Serasa
- `NaoGeraDifal`: Não gera Difal em Comodato/Garantia/Brindes
- `EnviaEmailNovoClienteTipo`: Quando envia o email de boas vindas: 0 - Ao liberar o orçamento; 1 - Ao entregar o cliente
- `MinimoFaturamentoProporcional`: Caso o valor mensal seja abaixo deste, não gera cobrança
- `NaoCalcularDifal`: Identifica que a empresa não gera Difal
- `LogoCríticaOS`: Logo para imprimir nas OSs
- `RetemPISCOFINSCSLLAuto`: Se retem PIS/COFINS/CSLL automaticamente
- `AlíquotaPISCumulativo`: Aliquota PIS padrão quando cumulativo
- `AlíquotaCofinsCumulativo`: Aliquota COFINS padrão quando cumulativo
- `MinimoFaturamentoProporcionalGeral`: Se soma a mensalidade como um todo para não cobrar
- `NãoAtualizaCustoGeral`: Em empresas que atualizam o custo em todas, deixa a empresa fora da regra
- `SerasaPasta`: Pasta de geração dos arquivos de remessa do Serasa
- `IgnoraDesativaçãoMesmoDia`: Se ignora desativação e ativação no mesmo dia do alarme para calculo do valor mensal
- `UsaMarkup`: Se usa markup para calcular o preço de venda de produtos
- `TipoLucro`: 0 - Lucro Presumido; 1 - Lucro Real
- `NFCEEnvia`: Se envia email da NFCe ao confirmar
- `PercentualISSNFComodato`: Percentual de ISS na NF de Comodato
- `FatLoteAdicionaDias`: Se adiciona dias a data de faturamento para a geração da duplicata no faturamento em lote
- `FatLoteValorOndemand`: Valor de deslocamento OnDemand
- `FatLoteContaOndemand`: Serviço adicional referente ao Ondemand
- `ContadorReciboLocação`: Contador de recibos de locação
- `ContadorCRBoleto`: Contador de ID de boletos para o PJBank
- `ContrapartidaCobrança`: Código de contrapartida para baixa de cobrança
- `LimiteRetençãoIR`: Valor mínimo para retenção automática do IRRF
- `PercentualRetençãoIR`: percentual padrão do IRRF
- `NãoAgruparComodato`: não agrupar a duplicata de locação ao faturar em lote
- `HabilitaComodatoAvulso`: se permite informar o valor de locação nas notas avulsas
- `EmpresaEntregaVenda`: empresa para baixa da entrega de equipamento de Venda
- `EmpresaEntregaEmprestimo`: empresa para baixa da entrega de equipamento de Emprestimo
- `EmpresaEntregaGarantia`: empresa para baixa da entrega de equipamento de Garantia
- `EmpresaEntregaGratifica`: empresa para baixa da entrega de equipamento de Brinde
- `EmpresaEntregaInterno`: empresa para baixa da entrega de equipamento interno
- `EmpresaEntregaLocado`: empresa para baixa da entrega de equipamento locado
- `ReqAlmoxCreditoSaida`: subconta para gerar movimento do almoxarifado
- `ReqAlmoxDebitoSaida`: subconta para gerar movimento do almoxarifado
- `ReqAlmoxCreditoEntrada`: subconta para gerar movimento do almoxarifado
- `ReqAlmoxDebitoEntrada`: subconta para gerar movimento do almoxarifado
- `ReqAlmoxCreditoBaixa`: subconta para gerar movimento do almoxarifado
- `ReqAlmoxDebitoBaixa`: subconta para gerar movimento do almoxarifado
- `linkConsultaNotaPortal`: validar se é utilizado no IntegraService
- `CritérioApuraçãoPisCofins`: critério a ser utilizado para apuração do PIS/COFINS (utilizado no Sped Contribuições)
- `GeraF600Baixa`: se gera registro F600 no Sped Contribuições
- `NãoDescontaDesativação`: não desconta dias de desativação do sistema de monitoramento
- `EnviaSMSFechamentoOS`: se envia SMS ao cliente ao fechar a OS
- `LogoDeclara`: logo da empresa na declaração de quitação de débitos
- `EnviaSMSAgendamentoOS`: se envia SMS ao agendar a execução de uma OS
- `TextoSMSFechamento`: texto do SMS de fechamento
- `TipoArredondamentoISS`: forma como a prefeitura arredonda o calculo de ISS
- `EntidadeSPC`: código da entidade para remessa SPC
- `AssociadoSPC`: código do associado para remessa SPC
- `UsaTextoDecimoTerceiro`: se fatura uma 13 mensalidade
- `TextoDecimo1...TextoDecimo10`: texto padrão das notas fiscais geradas para o decimo terceiro
- `PINSS`: percentual padrão de INSS para a empresa
- `IsentoDifalEmissor`: se o valor da Difal para o estado emissor deve ser 0 (depreciado)
- `LocaçãoSeparaNota`: se fatura o valor de locação separadamente (recibo ou nota de locação)
- `LocaçãoEmiteNota`: se o valor de locação deve gerar uma nota própria
- `LocaçãoTexto`: texto da nota/recibo de locação
- `LocaçãoObservações`: observações do recibo de locação
- `LocaçãoTipoServiço`: tipo do serviço prestado para locação
- `LocaçãoTipoISS`: tipo do iss para locação 
- `LocaçãoSérieEspecial`: se usa outra série para a numeração de nota
- `LocaçãoSérie`: série específica para locação
- `LocaçãoFaturaPercentual`: se gera a locação com um percentual para todos os clientes onde o tipo seja de locação
- `LocaçãoPercentual`: percentual a ser aplicado
- `LocaçãoUsaContador`: se usa um contador especial para o recibo
- `LocaçãoEfetuarRetenção`: se retem PIS/COFINS/CSLL, IRRF e INSS no recibo
- `LocaçãoPercentualISS`: percentual do ISS na locação
- `PrazoCancelamentoRPS`: prazo para cancelamento do RPS em dias (avisa o usuário ao cancelar a NF)
- `PastaExportaçãoManifesto`: pasta para exportação dos XMLs das NFEs emitidas contra a empresa
- `NãoEnviarDanfeAutomática`: não enviar email do Danfe automaticamente ao confirmar a NFe
- `EnviaSMSSemAgendamentoOS`: se envia SMS ao cancelar um agendamento de OS
- `TextoSMSOSSemAgendamento`: texto ao ser enviado no SMS ao cancelar um agendamento de OS
- `EmpresaContasReceber`: empresa onde deve ser gerados os contas a receber da empresa (caso deva ser em empresa diferente)
- `NãoSomarDespesasOS`: se soma despesas geradas por OSs ao faturar os clientes em lote
- `MínimoRetençãoISS`: se o valor de ISS não chega a esse valor, não deve ser retido
- `AditivoV`: path do arquivo de modelo de aditivo de valor mensal
- `AditivoS`: path do arquivo de modelo de aditivo de alteração de serviços
- `AditivoR`: path do arquivo de modelo de aditivo de razão social
- `AditivoE`: path do arquivo de modelo de aditivo de endereço
- `AditivoA`: path do arquivo de modelo de aditivo de acréscimo de equipamentos
- `AditivoT`: path do arquivo de modelo de aditivo de troca de equipamentos
- `AditivoX`: path do arquivo de modelo de aditivo de alteração de veículos
- `AditivoY`: path do arquivo de modelo de aditivo de inclusão de veículos
- `AditivoC`: path do arquivo de modelo de aditivo de alteração de valores de veículos
- `AditivoL`: path do arquivo de modelo de aditivo de alteração de clausula
- `ForticsChannel`: canal da empresa na integração Fortics
- `ForticsAgent`: agente na integração Fortics
- `ForticsChannelReturn`: canal de retorno integração Fortics
- `CréditoInventário`: depreciado
- `NFeEnviaNCMVazio`: se verdadeiro quando o produto não tem NCM envia 00000000 na NFe
- `PTextoNF1...PTextoNF10`: texto padrão das notas fiscais geradas para faturamento de postos de serviços
- `OSBaixaSemNFProd`: se a empresa permite baixa OSs sem emitir a nota de produtos
- `OSBaixaSemNFServ`: se a empresa permite baixa OSs sem emitir a nota de serviços
- `PastaSintegra`: pasta padrão de geração do Sintegra
- `PastaSpedFiscal`: pasta padrão de geração do Sped Fiscal
- `PastaSpedContribuições`: pasta padrão de geração do Sped Contribuições
- `OptanteROTSTRS`: depreciado
- `DébitoInventárioROT`: depreciado
- `ListarF6`: se a empresa deve listar no F6 (troca de empresas)
- `EmailNotCancelamento`: endereço de email para o qual deve ser disparado aviso ao acontecer algum cancelamento
- `NFCeTipoEnvio`: forma de envio da NFCe: 0 - Integração FlexDocs; 1 - TecnoSpeed
- `NFCeTipoDanfe`: forma de geração do Danfe da NFCe: 0 - Padrão (Laser ou Não Fiscal); 1 - TecnoSpeed
- `TextoSMSOSAgendamento`: texto a ser enviado para o cliente na OS agendada
- `FatOSRatearServiços`: se nas OSs o valor dos serviços devem ser faturados rateados nos produtos (não emite nota de serviço)
- `WakeUpToken`: token da integração WakeUp (assessoria de cobrança)
- `WakeUpEnvioAuto`: se envia as duplicatas automaticamente para a WakeUp
- `WakeUpDiasEnvioAuto`: quantidade de dias após o vencimento para envio automático
- `WakeUpUltimoEnvio`: ultimo dia com envio automatico, controle do sistema se deve gerar ou não
- `EstoquePadraoVisualiza`: estoque padrão para mostrar a quantidade de produtos no F5
- `EmailNovoClienteTexto`: texto do email de boas vindas quando não utiliza arquivo html para o corpo
- `NFEGeraCobr`: se gera as tags da cobrança no XML da NFe
- `CFOPsServiços`: configuração de CFOPs para serviços (dentro e fora do estado, contribuinte e não contribuinte)
- `ManterValoresAdicionais`: se em notas proporcionais, mantém o valor fixo dos serviços adicionais rateados na tabela ContasReceberServiçosAdicionais
- `FaturaNFSeServiço`: se fatura a NFCe para serviços
- `NFeJustificativaContingência`: texto de justificativa para contigenciamento de envio de NFe
- `TokenOlhoImposto`: token de integração com o Olho no Imposto que traz os percentuais aproximados de impostos por NCM
- `ExcluiICMSBasePISCOFINS`: se desconta o valor do ICMS para a base de calculo do PIS e COFINS
- `ExcluiISSBasePISCOFINS`: se desconta o valor do ICMS para a base de calculo do PIS e COFINS
- `GerarDEPEC`: se gera a NFCe em contigência DEPEC (Offline)
- `ChaveBearerSecreNaty`: token de integração secretária Naty
- `ChaveConSecreNaty`: chave de integração secretária Naty
- `NãoEnviarDanfeAutomáticaLocado`: não fazer o envio do Danfe ao confirmar a NFe de locação
- `NaoCalcularDifalNaoContribuinte`: não fazer o calculo do Difal para cliente não contribuinte
- `FaturaLotePorServAD`: se separa o faturamento em lote por serviços adicionais
- `CentroResultadosClienteVendido`: subconta de resultados padrão para clientes vendidos na empresa
- `CentroResultadosClienteLocado`: subconta de resultados padrão para locados na empresa
- `CentroResultadosClienteRastreamento`: subconta de resultados padrão para clientes de rastreamento na empresa
- `SCReduzirICMSContribuinte`: determina que quando a venda for para contribuinte dentro do estado o ICMS será de 12%
- `URLNaty`: URL da integração com a API da Naty
- `BraspagChaveLoja`: id da loja na Braspag
- `BraspagAPI`: se processa via API Rest ao invés do WS Soap
- `BraspagProvider`: atributo paymentProvider da API da Braspag
- `BraspagNomeComprovante`: nome da empresa a constar no comprovante
- `OSLiberaEmpresaDiferente`: identifica se deve solicitar liberação gerencial para abrir a OS para o cliente em uma empresa diferente da de faturamento mensal
- `NFeCertificadoVcto`: vencimento do certificado da NFe
- `NFeCertificadoEmissor`: emissor do certificado da NFe
- `SerasaEntidade`: número da entidade na integração com o Serasa
- `OSBaixaSemNFProdLimite`: valor máximo permitido para uma baixa avulsa de OS sem gerar faturamento de produtos
- `OSBaixaSemNFServLimite`: valor máximo permitido para uma baixa avulsa de OS sem gerar faturamento de	serviços
- `NFeProxy`: se deve usar Proxy para comunicação da NFe
- `FilaSecreNaty`: fila da Naty em que deve ser colocadas as mensagens
- `LogoRecibo`: bitmap do log para o Recibo Avulso/Caixa
- `NaoGeraTagDeson`: identifica que não deve ser gerada a tag do ICMS desonerado na NFe
- `ChaveParceiroInvoicy`: chave de parceiro na integração Invocy (Busca notas emitidas contra o CNPJ)
- `ChaveAcessoInvoicy`: chave de acesso 
- `ContadorInvoicy`: contador de lotes chamado
- `QtdLoteInvoicy`: quantidade de notas no lote
- `InvoicyAtivo`: se a integração está ativa
- `NFEManifestoCancelamento`: se gera manifestação de cancelamento da nota automaticamente
- `NaoRetemTributos`: identifica que a empresa não deve ser somada para buscar os valores de retenções automáticas
- `InnoveProducao`: define se a consulta de CPF/CNPJ pela Innove está ativa
- `InnoveUsuário`: usuário da integração
- `InnoveSenha`: senha da integração
- `InnoveAPIKey`: chave da API
- `EmailNovoCliente`: identifica um email para o qual deve ser disparado uma mensagem automática em todos os novos clientes
- `OSFechamentoTemplate`: template da mensagem Whats no fechamento da OS (integração Fortics)
- `TemplateOSAgendamento`: template da mensagem Whats no agendamento da OS (integração Fortics)
- `TemplateOSSemAgendamento`: template da mensagem Whats nas OSs sem agendamento (integração Fortics)
- `NatyCloseSession`: determina o estado da seção após enviar mensagem na Naty: 0 - Manter sessão aberta; 1 - Encerrar sessão
- `TemplateSegundaViaFortics`: template da mensagem Whats para segunda via de boleto (integração Fortics)
- `TemplateDeslocamento`: template da mensagem Whats de início do deslocamento do técnico (integração Fortics)
- `BoletoNaoExibeDadosNF`: identifica se oculta os dados da NF no boleto
- `TemplateBoletoNaoEncontrado`: template da mensagem Whats para quando não encontra segunda via de boleto (integração Fortics)
- `UsaCanalSecreNaty`: se envia a mensagem através de canais na integração com a Naty
- `BraspagQtDiasRepasse`: dias que devem ser somados a data atual para a data da baixa do boleto na Braspag
- `CliAgrupaServicoAuto`: se ao gerar um novo cadastro o campo AgrupaServiço do cliente já vir como true

---

### EmailConfigMessageHub
- **Descrição:** Configurações do MessageHub

---

### EmpresasRestritas
- **Descrição:** Empresas que o usuário não deve ter acesso
- **Relacionamento:** 
- `Usuário` → `Senhas.Usuário`
- `Empresa` → `Empresas.CodEmpresa`
- `Unidade` → `Unidades.CodUnidade`
- **Campos:**
- `CodInterno`: código interno PK
- `Usuário`
- `Empresa`
- `Unidade`

---

### Entidades
- **Descrição:** Cadastro das entidades (cadastros gerais)
- **Campos:**
- `CodInterno`: código interno PK
- `Descreve`: nome da entidade

---

### EntidadesSigma
- **Descrição:** Cadastro das entidades do monitoramento (cadastros necessários trazidos do monitoramento)
- **Relacionamento:** 
- `Unidade` → `Unidades.CodUnidade`
- `IDEmpresa` → `ConexãoSigma.IDSigma`
- **Entidade:**
- `O`: Colaboradores
- `D`: Defeitos
- `B`: Bairros
- `C`: Centrais (modelos de central)
- `R`: Rotas
- `M`: Ramo de atividade
- `I`: Cidades
- `V`: Vendedores
- `T`: Técnicos
- `F`: Funções
- `U`: Usuários
- `E`: Eventos de alarme
- `P`: Produtos
- `N`: Painéis de Alarme
- `A`: Causas de OS
- `S`: Soluções
- `X`: Empresas 
- `G`: Grupos de Clientes
- **Campos:**
- `CodInterno`: código interno PK
- `Entidade`: identificação da entidade
- `CodSigma`: codigo da entidade no sistema de monitoramento
- `DescricaoSigma`: descrição
- `Unidade`: unidade vinculada
- `Ativo`: se está ativo
- `IDEmpresa`: identificação da integração
- `DataAtualiza`: quando foi atualizado
- `GrupoDefeito`: grupo do defeito
- `GuidItem`: id da entidade por Guid (integração Solutio)
- `GrupoDefeitoVetor`: grupos de defeito que o defeito está incluído

---

### EnviosLoteRPS
- **Descrição:** Lotes de RPS - Manipulado pelo NFSe

---

### EstoqueMovimento
- **Descrição:** Movimentações de estoque e listagem dos produtos de notas fiscais de entrada e saída. 
- **Relacionamento:** 
- `Empresa` → `Empresas.CodEmpresa`
- `CodProduto` → `Produtos.CodProduto`
- `CodClienteFornece` → `Clientes.CodCliente`
- `TipoEstoque` → `TiposEstoque.CodEstoque`
- `EstoqueTransfere` → `TiposEstoque.CodEstoque`
- `CodReqAlmox` → `RequisiçãoAlmoxarifado.CodInterno`
- `CodProvisão` → `ProvisãoEstoque.CodInterno`
- `PlaProvisão` → `ProvisãoEstoque.Planílha`
- `CodRegraNCM` → `RegrasTributosVenda.CodInterno`
**Saldo:**
- Some Entrada-Saída onde o campo EntSai tenha o primeiro digito como 'X' do produto com `DataMovimento <= data consultada`
- Caso seja uma entrada, o campo Entrada será diferente de 0 e o campo Saída será 0
- Caso seja uma saída, o campo Entrada será 0 e o campo Saída será diferente de 0
- **Campos:**
- `CodInterno`: código interno PK
- `Empresa`: empresa do movimento
- `Operação`: COI ou operação do movimento do estoque
- `CodProduto`: código do produto
- `NotaFiscal`: número da nota vinculada ao movimento
- `Serie`: série da nota vinculada ao movimento
- `Planílha`: planílha do movimento
- `Entrada`: quantidade de entrada
- `Saída`: quantidade de saida
- `Venda`: valor unitário de venda
- `DataMovimento`: data da movimentação
- `CodClienteFornece`: código do cliente/fornecedor
- `Vendedor`: código do vendedor
- `Compra`: valor unitário de compra
- `EntSai`: define a movimentação, se o primeiro dígito for 'X', significa que ele deve ser somado para saber o saldo
- `IPI`: valor do IPI do item
- `ICMS`: valor do ICMS do item
- `DescreveProduto`: descrição do item (em produtos modelo são diferentes do cadastro)
- `Devolvido`: quantidade do produto que foi devolvida (notas de devolução)
- `AliqICMS`: alíquota do ICMS aplicada
- `BaseICMS`: valor base de calculo do ICMS
- `BaseICMSSubstituido`: valor base de calculo do ICMS Substituido
- `ICMSSubstituido`: valor do ICMS Substituido
- `ValorDigitado`: valor do produto informado pelo cliente (sem calculos de juros e descontos)
- `PlanílhaOrigem`: caso o registro tenha tido a planílha alterada por um cancelamento, mantém aqui a planílha que gerou o registro
- `EntSai`: string que determina o comportamento do registro por posições da string
- `ContaEntrega`: depreciado
- `ObsMovAvulso`: observações informadas 
- `TipoEstoque`: tipo de estoque movimentado
- `EstoqueTransfere`: tipo de estoque que recebeu/enviou a transferência
- `SubTotal`: subtotal do item (entrada X compra ou saída X venda)
- `Usuário`: usuário vinculado ao movimento
- `CFOPProduto`: em caso de NF, caso em branco vale a informação da tabela NotasFiscaisSaída/NotasFiscaisEntrada
- `CSTProduto`: CST do item
- `CSOSNProduto`: CSOSN do item
- `BasePIS`: base de calulo do PIS
- `AlíquotaPIS`: aliquota do PIS
- `ValorPISProduto`: valor do pis 
- `CSTPis`: CST do PIS
- `BaseCofins`: base de calulo da COFINS
- `AlíquotaCofins`: aliquota da COFINS
- `ValorCofinsProduto`: valor da COFINS
- `CSTCofins`: CST da COFINS
- `PercentualImposto`: percentual aproximado de impostos para constar nas observações da nota
- `BaseII`: base de calculo do Imposto de Importação
- `ValorII`: valor do Imposto de Importação
- `PedidoFornecedor`: número do pedido do fornecedor
- `PedidoItem`: número do item no pedido do fornecedor
- `DescontoProduto`: desconto aplicado ao item
- `ProdutoCusto`: qual era o custo na gravação
- `ProdutoCustoReposição`: qual era o custo de reposição na gravação
- `ProdutoCustoGerencial`: qual era o custo gerencial na gravação
- `ProdutoCustoMédio`: qual era o custo médio na gravação
- `ProdutoPreço`: qual era o preço na gravação
- `vBCUFDest`: base de calculo do Difal
- `pFCPUFDest`: percentual de FCP do Difal
- `pICMSUFDest`: percentual de ICMS para o Destino
- `pICMSInter`: percentual de ICMS interestadual
- `pICMSInterPart`: percentual de participação do valor do ICMS Difal para o destino (atualmente sempre 100%)
- `vFCPUFDest`: valor de FCP para o destino
- `vICMSUFDest`: valor de ICMS Difal para o destino
- `vICMSUFRemet`: valor de ICMS Difal para o estado emissor
- `ContaProtal`: depreciado
- `CustoBruto`: preço de custo bruto da NF
- `CodReqAlmox`: código de requisição de almoxarifado vinculado
- `AliqIPI`: alíquota do IPI
- `BaseIPI`: base de calculo do IPI
- `NCMProduto`: NCM do produto
- `CESTProduto`: código CEST do produto
- `UnidadeProduto`: tipo de unidade do item
- `IPIDevolução`: valor do IPI Devolvido
- `AliqICMSSub`: aliquota do ICMS Substituido
- `vBCSTRet`: valor da base do ICMS retido anteriormente
- `vICMSSTRet`: valor do ICMS retido anteriormente
- `pRedBCEfet`: percentual de redução da base do ICMS Efetivo
- `vBCEfet`: valor da base do ICMS Efetivo
- `pICMSEfet`: percentual do ICMS Efetivo
- `vICMSEfet`: valor do ICMS Efetivo
- `FreteProduto`: valor do frete do produto
- `CodFatLote`: faturamento em lote vinculado - depreciado
- `pST`: percentual de ICMS Sub
- `CodProvisão`: código da provisão de estoque movimentada
- `PlaProvisão`: planílha da provisão de estoque movimentada
- `CodBeneficioFiscal`: código do benefício fiscal do item
- `vOutros`: valor de outros impostos
- `UnTrib`: unidade de tributação
- `MotivoEntrega`: nas entregas de OS determina o motivo (venda, locado, emprestimo etc)
- `ScTTD212`: se calculou o ScTTD212 em SC
- `modBCST`: modo de calculo da base do ICMS ST
- `pMVAST`: percentual do MVA no ICMS ST
- `vBCFCPST`: valor de base de calculo do FCP no ICMS ST
- `pBCFCPST`: percentual de base de calculo do FCP no ICMS ST
- `vFCPST`: valor do FCP no ICMS ST
- `pReducaoBaseICMS`: percentual de redução da base do ICMS
- `PercDAE`: percentual da substituição DAE
- `ValorDAE`: valor da substituição DAE
- `CodigoANP`: código ANP (notas de combustiveis)
- `descANP`: descrição ANP (notas de combustiveis)
- `UFConsANP`: estado consulta ANP (notas de combustiveis)
- `CodRegraNCM`: regra por NCM que gerou o calculo tributário do item
- `ValorUnitOriginal`: valor unitário original

---

### EstoqueMovimentoRastreio
- **Descrição:** Vincula os movimentos de estoque com os produtos de rastreio (identidade unica de um produto)
- **Relacionamento:** 
- `Planílha` → `EstoqueMovimento.Planílha`
- `CodProduto` → `Produtos.CodProduto`
- `IDProduto` → `ProdutosRastreio.CodRastreio`
- **Campos:**
- `CodInterno`: código interno PK
- `Planílha`: planílha da movimentação
- `CodProduto`: produto vinculado
- `IDProduto`: id do rastreio do item

---

### EstoqueReservado
- **Descrição:** Depreciado

---

### EtapasOrçamento
- **Descrição:** Etapas do Orçamento para o Kanban de orçamentos
- **Relacionamento:** 
- `Unidade` → `Unidades.CodUnidade`
- **Campos:**
- `CodInterno`: código interno PK
- `Usuário`: caso esteja específico para um usuário
- `Unidade`: unidade vinculada
- `Etapa`: nome da etapa
- `Ordem`: ordem na tela
- `CorEtapa`: cor de identificação
- `DescrEtapa`: descrição da etapa

---

### Etiquetas
- **Descrição:** Tabela temporária que apóia a emissão de etiquetas

---

### EtiquetasBase
- **Descrição:** Tabela temporária que apóia a emissão de etiquetas

---

### EtiquetasCfg
- **Descrição:** Etiquetas configuradas
- **Campos:**
- `CodLayout`: código interno PK
- `NomeLayout`: nome da etiqueta
- `Tabela`: o tipo de dado que será impresso na etiqueta: Clientes;NFSaída;Prospects;Produtos
- `Fonte`: para matricial N - Normal; C - Comprimido
- `EntreLinhas`: para matricial -  salto entre linhas
- `EntreEtiquetas`: para matricial - salto entre etiquetas
- `Impressora`: para matricial - modelo de impressora
- `LarguraEtiqueta`: para matricial - quantidade de caracteres largura
- `LinhasEtiqueta`: para matricial - quantidade de linhas
- `Colunas`: para matricial - quantidade de colunas de etiquetas
- `EntreColunas`: para matricial - salto entre colunas
- `BrotherLayout`: path do layout modelo de impressão na Brother

---

### EtiquetasCfgCampos
- **Descrição:** Campos das etiquetas configuradas (quando matricial)
- **Relacionamento:** 
- `CodLayout` → `EtiquetasCfg.CodLayout`
- **Campos:**
- `CodInterno`: código interno PK
- `CodLayout`: código do layout
- `Descrição`: descrição
- `Campor`: campo da tabela
- `Linha`: linha de impressão
- `Coluna`: coluna inicial
- `Tamanho`: para matricial - salto entre etiquetas
- `Formato`: mascara a ser aplicada ao dado

---

### EventoDeslocamento
- **Descrição:** Provavelmente utilizado pelo IntegraService - OSMobile

---

### EventosSigmaOcultaPortal
- **Descrição:** Provavelmente utilizado pelo IntegraService - OSMobile

---

### EventosService
- **Descrição:** Provavelmente utilizado pelo IntegraService

---

### FaturamentoDesativação
- **Descrição:** Desativações do cliente no sistema de monitoramento por inadimplência ou outros motivos (desconta os dias do valor do faturamento)
- **Relacionamento:** 
- `Cliente` → `Clientes.CodCliente`
- `CodPosto` → `ClientesPostos.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `Cliente`: código do cliente
- `Desativação`: data em que foi desativado
- `Reativação`: data em que foi reativado - caso nulo ainda está inativo
- `Usuário`: quem bloqueou
- `MotivoBloqueio`: motivo do bloqueio informado pelo usuário
- `UsuárioReativação`: quem reativou
- `ReativaçãoAgendada`: data onde deve voltar a estar ativo o alarme (reativação programada)
- `DesativouSigma`: identifica se realmente desativou no sistema de monitoramento
- `ReativouSigma`: identifica se realmente reativou no sistema de monitoramento
- `CodPosto`: código do posto de serviço, no caso de faturamento de postos

---

### FaturamentosNaoRealizados
- **Descrição:** Ao gerar o faturamento em lote mensal, grava os clientes que não tiveram faturamento e o motivo
- **Relacionamento:** 
- `CodCliente` → `Clientes.CodCliente`
- `Empresa` → `Empresas.CodEmpresa`
- `CodTipoFaturamento` → `TiposFaturamento.CodTipoFaturamento`
- **Campos:**
- `CodInterno`: código interno PK
- `Empresa`: empresa de faturamento
- `DataHora`: momento do faturamento
- `Usuário`: quem faturou
- `CodCliente`: código do cliente
- `Nome`: nome do cliente
- `CodTipoFaturamento`: tipo de faturamento
- `DataVencimento`: data para o qual estava gerando o vencimento
- `DiaVencimento`: dia do vencimento do faturamento do cliente
- `PrimeiroFaturamento`: início do monitoramento/ativação
- `ValorMensal`: valor mensal do cliente
- `ValorDuplicata`: valor calculado para o mês
- `MotivoNãoFaturamento`: motivo pelo qual o cliente não foi faturado

---

### FaturamentosRealizados
- **Descrição:** Faturamentos em lote gerados
- **Relacionamento:** 
- `Empresa` → `Empresas.CodEmpresa`
- `TipoFaturamento` → `TiposFaturamento.CodTipoFaturamento`
- **Campos:**
- `CodInterno`: código interno PK
- `Empresa`: empresa de faturamento
- `DataFaturamento`: momento do faturamento
- `Usuário`: quem faturou
- `DiaInicial`: dia inicial de faturamento
- `DiaFinal`: dia final de faturamento
- `Mês`: mês do faturamento
- `Ano`: ano do faturamento
- `NotaInicial`: número inicial de nota
- `NotaFinal`: número final de nota
- `TipoFaturamento`: tipo de faturamento
- `PlaIni`: planílha inicial do range de notas faturadas
- `PlaFim`: planílha final do range de notas faturadas
- `Cancelado`: identifica se foi cancelado
- `CentroResultados`: caso tenha sido filtrado por subconta de resultados
- `GR`: identifica se é faturamento do rastreamento veicular
- `MêsFinal`: para faturamentos de meses, o mês final
- `AnoFinal`: para faturamentos de meses, o ano final
- `Postos`: identifica se é faturamento de postos de serviços

---

### Feriados
- **Descrição:** Cadastros dos feriados
- **Abrangência:**
- `0`: Nacional
- `1`: Estadual
- `2`: Municipal
- **Campos:**
- `CodInterno`: código interno PK
- `Data`: data do feriado
- `Descrição`: nome do feriado
- `Abrangência`: abrangência do feriado
- `Cidade`: cidade em caso de abrangência = 2
- `Estado`: estado em caso de abrangência = 1 ou 2
- `Tipo`: 0 - Fixo (mesmo dia/mês em todo ano); 1 - Móvel muda o dia/mês ano a ano

---

### FormasPagto
- **Descrição:** Formas de pagamento de duplicatas de contas a pagar e contas a receber
- **Relacionamento:** 
- `ContaCaixa` → `ContasCaixa.CodCaixa`
- `ContraPartida` → `HistóricosCaixaContrapartida.CodContrapartida`
- `BrasPagMeioPagamento` → `DadosEntidades.Codigo onde DadosEntidades.CodEntidade=234`
- **BraspagPlano:**
- `0`: A Vista
- `1`: Parcelado pelo Estabelecimento
- `2`: Parcelado pelo emissor do cartão
- `5`: A Vista, com IATA
- **tPag:**
- `01`: Dinheiro
- `02`: Cheque
- `03`: Cartão de Crédito
- `04`: Cartão de Débito
- `05`: Cartão da Loja
- `10`: Vale Alimentação
- `11`: Vale Refeição
- `12`: Vale Presente
- `13`: Vale Combustível
- `14`: Duplicata Mercantil
- `15`: Boleto Bancário
- `16`: Depósito Bancário
- `17`: Pagamento Instantâneo (PIX Dinâmico)
- `18`: Transferência bancária
- `19`: Programa de fidelidade
- `20`: Pagamento Instantâneo (PIX Estático)
- `21`: Crédito em Loja
- `22`: Pagamento Eletrônico não Informado
- `90`: Sem Pagamento
- `99`: Outros
- **tpIntegra:**
- `0`: Não Informado
- `1`: Pagamento Integrado
- `2`: Pagamento Não Integrado
- **Campos:**
- `CodFormaPagto`: código da forma de pagamento
- `FormaPagto`: descrição da forma de pagamento
- `Bloqueto`: identifica o banco em que foi emitido o bloqueto, exemplo: 237 - BANCO BRADESCO S.A.
- `Consumidor`: identifica se essa forma pode ser usado para consumidor (cliente não cadastrado)
- `Baixa`: identifica se as duplicatas devem ser baixadas automaticamente
- `ContaCaixa`: conta de caixa em caso de baixa automática
- `ContraPartida`: contrapartida de caixa em caso de baixa automática
- `Orçamento`: identifica se a forma pode ser usada para gerar orçamento
- `Fechamento`: identifica se a forma pode ser usada para fechamento de orçamento
- `DébitoAutomático`: identifica se a forma é de débito automático
- `BrasPagMeioPagamento`: meio de pagamento da Braspag (API)
- `BraspagPlano`: plano de pagamento da Braspag (API)
- `Inativa`: identifica se a forma de pagamento foi inativada
- `EmpresasLiberadas`: lista as empresas que podem usar a forma, caso nulo todas
- `LimiteDesconto`: limite de desconto para produtos
- `LimiteDescontoServ`: limite de desconto para serviços
- `MínimoEntrada`: valor mínimo para entrada
- `indPag`: dados da NFe Indicador de pagamento: 0 - Pagto a Vista; 1 - Pagto a Prazo
- `tPag`: dados da NFe Meio de pagamento
- `tpIntegra`: dados da NFe Tipo de integração
- `CNPJAdquirente`: dados da NFe CNPJ do adquirente
- `idTermPag`: dados da NFe ID do Terminal

---

### Formulários
- **Descrição:** Cadastro dos formulários do sistema (telas)
- **Campos:**
- `Formulário`: nome do formulário
- `Descrição`: descrição/título

---

### FormuláriosRestritos
- **Descrição:** Cadastro de formulários aos quais o usuário não tem acesso
- **Campos:**
- `CodInterno`: código interno PK
- `Usuário`: usuário
- `Formulário`: nome do formulário

---

### FormuláriosTemp
- **Descrição:** depreciada

---

### FornecedoresContratos
- **Descrição:** Contratos feitos com fornecedores
- **Relacionamento:** 
- `CodFornecedor` → `Clientes.CodCliente`
- **Campos:**
- `CodInterno`: código interno PK
- `CodFornecedor`: fornecedor
- `Descrição`: descrição do contrato
- `Início`: data de início
- `Encerramento`: final do contrato
- `Responsável`: nome do responsável no fornecedor
- `Telefone`: telefone do responsável
- `Email`: email do responsável
- `Observações`: observações do contrato
- `Ativo`: indica se o contrato está ativo

---

### FornecedorMarca
- **Descrição:** Cria a relação de fornecedor/marca para auxiliar nas compras
- **Relacionamento:** 
- `CodFornecedor` → `Clientes.CodCliente`
- `CodMarca` → `DadosEntidades.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `CodFornecedor`: fornecedor
- `CodMarca`: marca

---

### FornecedorPrazoGarantia
- **Descrição:** Identifica o prazo de garantia do fornecedor para um produto
- **Relacionamento:** 
- `CodFornecedor` → `Clientes.CodCliente`
- `CodProduto` → `Produtos.CodProduto`
- **Campos:**
- `CodInterno`: código interno PK
- `CodFornecedor`: fornecedor
- `CodProduto`: produto
- `DiasGarantia`: número de dias de garantia

---

### GeoLocalização
- **Descrição:** Utilizado pelo mobile para alimentar o Horus

---

### GetrakVersaoEquipamentos
- **Descrição:** Dados temporários de versões de hardware para integração com a Getrak

---

### Goodcard
- **Descrição:** Importação de Goodcard e outros cartões de abastecimentos
- **Campos:**
- `CodInterno`: código interno PK
- `Planílha`: planílha de importação
- `Data`: data do evento
- `ValorEvento`: valor do evento
- `Cartão`: número do cartão
- `Quantidade`: quantidade de produto
- `TipoMaterial`: produto
- `Serviço`: serviço executado
- `Placa`: placa do carro
- `Estabelecimento`: CNPJ ou nome do posto
- `Importado`: se gerou a despesa para o veículo

---

### GoToRamais
- **Descrição:** Dados temporários dos ramais telefônicos na integração com a GoTo para geração de chamadas

---

### GRAutotrack
- **Descrição:** Depreciada - guardava os valores importados da Autotrack

---

### GRChip
- **Descrição:** Cadastro de CHIPs GPRS
- **Relacionamento:** 
- `Unidade` → `Unidades.CodUnidade`
- `Operadora` → `DadosEntidades.CodInterno`
- `TipoChip` → `DadosEntidades.CodInterno`
- `CodRastreador` → `GRRastreador.CodInterno`
- `Técnico` → `Clientes.CodCliente`
- `GRIntegração` → `GRIntegrações.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `DDD`: DDD
- `Linha`: número do telefone
- `Operadora`: operadora do chip
- `Serial`: número de série
- `Unidade`: unidade vinculada
- `DataCadastro`: data do cadastro
- `Inativo`: identifica se o chip está inativo
- `LogChip`: log de eventos do chip
- `Removido`: se foi removido de cliente/veículo
- `Remoção`: data da remoção
- `Pin`: código Pin
- `Puk`: código Puk
- `TipoChip`: tipo de chip
- `VencimentoContrato`: data do vencimento do contrato com a operadora
- `Cancelamento`: data de cancelamento
- `ProtocoloCancelamento`: protocolo de cancelamento com a opera
- `CodRastreador`: código do rastreador vinculado no cadastro
- `Técnico`: técnico vinculado no cadastro
- `VendaDireta`: indica se foi para venda direta (não foi possível remover e será cobrado)
- `DDI`: numero do pais no DDI
- `Observações`: Observações do chip
- `Descrição`: Descrição do chip
- `Saldo`: saldo em MB quando existe integração
- `ConsumoMB`: consumo em MB quando existe integração
- `PlanoMensal`: nome do plano quando existe integração
- `PrecoPlanoMensal`: preço do plano quando existe integração
- `UltimaConexao`: data da última conexão quando existe integração
- `IPSimCard`: IP do SIM
- `IMEI`: Código IMEI
- `IMSI`: Código IMSI
- `ConsumoPercentual`: percentual de consumo quando existe integração
- `ExcedenteContratado`: se excedeu o contratado
- `ExcedenteUtiliza`: excedente utilizado
- `ExcedenteContratadoMB`: excedente utilizado 
- `SituaçãoVEye`: status no VEye
- `SMSAtivo`: se envia SMS
- `DiasUtilizado`: quantidade de dias de uso
- `CodVEyes`: código na integração VEye
- `ÚltimaSincronização`: data da última sincronização
- `Latitude`: coordenada da última sincronização
- `Longitude`: coordenada da última sincronização
- `DataAtivação`: data de ativação na operadora
- `Grupo`: grupo
- `Exceção`: depreciado
- `DistanciaCliente`: distancia em metros do cliente
- `FulltrackCode`: código de integração no rastreamento
- `GRIntegração`: código da integração no rastreamento
- `PrimeiraConexão`: data da primeira conexão
- `APNDomain`: Domínio da APN
- `DiaRenovacao`: dia em que encerra o ciclo do mês
- `Preço`: preço pago por mês
- `MB`: quantidade de dados do plano

---

### GRDesativação
- **Descrição:** Desativações de veículos no sistema de rastreamento por inadimplência ou outros motivos (desconta os dias do valor do faturamento)
- **Relacionamento:** 
- `CodVeículo` → `GRVeículos.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `CodVeículo`: veículo
- `Desativação`: data em que foi desativado
- `DesativouRastreamento`: identifica se realmente desativou no sistema de rastreamento
- `UsuárioDesativação`: quem bloqueou
- `ReativaçãoAgendada`: data onde deve voltar a estar ativo o veículo (reativação programada)
- `Reativação`: data em que foi reativado - caso nulo ainda está inativo
- `ReativouRastreamento`: identifica se realmente reativou no sistema de rastreamento
- `UsuárioReativação`: quem reativou
- `MotivoDesativação`: motivo do bloqueio informado pelo usuário

---

### GRDiárias
- **Descrição:** Diáras de viagem na GR - ainda está no sistema, mas creio que em desuso
- **Relacionamento:** 
- `Cliente` → `Clientes.CodCliente`
- **Campos:**
- `CodInterno`: código interno PK
- `MCT`: mct do veículo na Autotrak
- `Placa`: placa do veículo
- `Cliente`: cliente
- `Início`: início da viagem
- `Término`: fim da viagem
- `AbertoPor`: quem abriu
- `FechadoPor`: quem fechou
- `Sistema`: sistema de rastreamento
- `DataAbertura`: data em que foi cadastrado
- `DataFechamento`: data em que foi informado o fechamento
- `Solicitante`: quem solicitou
- `Observações`
- `CodViagem`
- `LogDiária`

---

### GRFaturamento
- **Descrição:** Registra os valores faturados no rastreamento, muitos campos estão sem uso
- **Relacionamento:** 
- `Cliente` → `Clientes.CodCliente`
- `Empresa` → `Empresas.CodEmpresa`
- `CodFatLote` → `FaturamentosRealizados.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `Cliente`: cliente
- `Planílha`: planílha da nota gerada
- `Mês`: mês de referência
- `Empresa`: empresa do faturamento
- `QtFixos`: quantidade de veículos fixos cobrados
- `UnitFixo`: valor unitário dos fixos
- `TTFixos`: valor total de fixos
- `QTAirTime`: quantidade de veículos cobrados (particulares)
- `AirTime`: valor total do airtime (particulares)
- `TotalDiárias`: quantidade de diárias
- `GRDiária`: valor de diárias
- `ValorMês`: valor cobrado no mês
- `GRMensal`: valor de contrato mensal
- `GRFranquia`: valor de franquia
- `Comunicação`: valor gasto com comunicação Autotrack
- `Pesquisa`: valor gasto com pesquisas
- `PCusto`: custo das pesquisas
- `PMínimo`: valor mínimo das pesquisas
- `Analista`: valor analista
- `PConsulta`: valor por consulta
- `PCadAtualiza`: valor por atualização
- `PostoAvançado`: valor do posto avançado
- `SoftwareLogístico`: valor do software de logistica
- `Reciclagem`: valor de reciclagem
- `TreinamentoMotoristas`: valor de treinamento de motoristas
- `TreinamentoDireçãoDefensiva`: valor de treinamento de direção defensiva
- `ServiçosAdicionais`: valor dos serviços adicionais faturados
- `CodFatLote`: código do faturamento em lote

---

### GRFaturamentoParticulares
- **Descrição:** Registra os veículos particulares cobrados no faturamento do rastreamento
- **Relacionamento:** 
- `CodVeículo` → `GRVeículos.CodInterno`
- `Planílha` → `GRFaturamento.Planílha`
- `CodFatLote` → `FaturamentosRealizados.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `Planílha`: planílha
- `CodVeículo`: veículo
- `ValorVeículo`: valor base mensal do veículo
- `ValorFaturado`: valor cobrado
- `CodFatLote`: código do faturamento em lote
- `DiasFaturados`: dias cobrados
- `ValorDia`: valor por dia

---

### GRFaturamentoParticularesServiçosAdicionais
- **Descrição:** Registra os serviços adicionais de veículos particulares cobrados no faturamento do rastreamento
- **Relacionamento:** 
- `CodCliente` → `Clientes.CodCliente`
- `Planílha` → `GRFaturamento.Planílha`
- `CodServiço` → `ServiçosAdicionais.CodInterno`
- `CodFatLote` → `FaturamentosRealizados.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `Planílha`: planílha
- `CodCliente`: cliente
- `CodServiço`: serviço adicional
- `ValorFaturado`: valor cobrado
- `CodFatLote`: código do faturamento em lote

---

### GRIntegrações
- **Descrição:** Integrações com sistemas de rastreamento
- **Relacionamento:** 
- `Unidade` → `Unidades.CodUnidade`
- **TipoIntegração:**
- `0`: Global Search
- `1`: Fulltrack
- `2`: Getrack
- `3`: STC
- `4`: SSX
- `5`: Sem Integração
- `6`: Vanguarda
- `7`: Sirius
- `8`: Raio GPS
- `9`: Protrack
- **Campos:**
- `CodInterno`: código interno PK
- `Unidade`: unidade
- `Apelido`: apelido da integração
- `TipoIntegração`: tipo da integração
- `Login`: login da integração
- `Senha`: senha da integração
- `Empresa`: código da empresa
- `Ativa`: identifica se a integração está ativa
- `Franquia`: id da franquia
- `Portal`: id do portal
- `Localiza`: id da localização
- `ClientTemplateIntegrationCode`: template de cliente
- `UserProfileTemplateIntegrationCode`: template de usuário
- `TrackerTemplateIntegrationCode`: template de rastreador
- `Padrão`: se é a integração padrão da unidade
- `OcultarNovos`: depre 
- `URLEndereço`: endereço da API 
- `GRIntegraSenhaPadrão`: senha padrão de cadastro novo
- `GRIntegraSenhaReset`: senha resetada
- `GRIntegraUserIDLivre`: id do usuário quando o rastreador está livre
- `GRIntegraUserIDCancelado`: id do usuário quando o rastreador está cancelado
- `GRIntegraUserIDBloqueado`: id do usuário quando o rastreador está bloqueado
- `ProtrackToken`: token da Protrack
- `ProtrackTokenExpiração`: expiração do token da Protrack
- `EmailPadrão`: email padrão de cadastro
- `OrganizationalUnitIntegrationCode`: unidade organizacional

---

### GRPesquisa
- **Descrição:** depreciado

---

### GRPesquisaDetalhes
- **Descrição:** depreciado

---

### GRRastreador
- **Descrição:** Rastreadores cadastrados
- **Relacionamento:** 
- `Unidade` → `Unidades.CodUnidade`
- `CodMotivoDesativa` → `DadosEntidades.CodInterno`
- `FornecedorManutenção` → `Clientes.CodCliente`
- `CodFornecedorRast` → `Clientes.CodCliente`
- `GRIntegração` → `GRIntegrações.CodInterno`
- **Status:**
- `0`: Ativo
- `1`: Inativo
- `2`: Em Manutenção
- **Campos:**
- `CodInterno`: código interno PK
- `IDChip`: serial do rastreador
- `Modelo`: modelo
- `Unidade`: unidade cadastrada
- `SystemsatProtocolo`: protocolo no SSX
- `SystemsatModelo`: modelo no SSX
- `DataCadastro`: data de cadastro
- `FulltrackCode`: código de integração rastreamento
- `IDVersão`: id da versão
- `IDModelo`: id do modelo
- `Status`: status do rastreador
- `CodMotivoDesativa`: codigo motivo desativação
- `MotivoDesativa`: motivo da desativação
- `DataEnvioManutenção`
- `FornecedorManutenção`
- `DataRetornoManutenção`
- `LogRastreador`
- `DataInativação`
- `CodFornecedorRast`: fornecedor do rastreador
- `GRIntegração`: código da integração
- `TemplateSSX`: template do SSX para o rastreador
- `MacAddress`: id do Mac
- `IMEI`: IMEI do rastreador

---

### GrupoRelatorios
- **Descrição:** Não manipulado pelo Service

---

### GRVeículos
- **Descrição:** Veículos rastreados cobrados mensalmente do cliente
- **Relacionamento:** 
- `Cliente` → `Clientes.CodCliente`
- `TipoVeículo` → `DadosEntidades.CodInterno`
- `SistemaRastreamento` → `DadosEntidades.CodInterno`
- `Bloqueio` → `DadosEntidades.CodInterno`
- `TécnicoVeículo` → `Clientes.CodCliente`
- `CodMotCancelamento` → `DadosEntidades.CodInterno`
- `TitularLegado` → `Clientes.CodCliente`
- `OrcTrocaTitularidade` → `Orçamentos.Planílha`
- `NovoTitular` → `Clientes.CodCliente`
- `PlaOrcSubstituição` → `Orçamentos.Planílha`
- `PlaOSSubstituição` → `OSs.Planílha`
- `PlaOSSubstituído` → `OSs.Planílha`
- **Combustível:**
- `G`: Gasolina
- `A`: Etanol
- `B`: BiCombustível
- `D`: Diesel
- `N`: GNV
- `E`: Elétrico
- `H`: Híbrido
- **Campos:**
- `CodInterno`: código do veículo PK
- `Cliente`: código do cliente
- `Tipo`: P - Particular; F - Fixo
- `Sistema`: depreciado
- `MCT`: depreciado
- `Placa`: placa do veículo
- `Ativo`: se está ativo sendo cobrado ou não
- `Observações`
- `ID`: ID do veículo
- `ValorVeículo`: valor mensal do veículo
- `Inclusão`: data da ativação do rastreamento e cobrança do veículo
- `Exclusão`: data de cancelamento do rastreamento e cobrança do veículo
- `Modelo`: modelo do veículo
- `Combustível`: tipo de combustível
- `Ano`: ano do veículo
- `Cor`: cor do veículo
- `Renavam`: número do Renavam
- `Chassis`: número do Chassis
- `LocalizaçãoMódulo`: local do módulo
- `Bloqueio`: tipo de bloqueio
- `Panico`: possui botão de panico
- `ChipGPRS`: depreciado
- `Rastreador`: depreciado
- `TécnicoVeículo`: técnico vinculado
- `ValorRepasse`: valor de repasse
- `ControlaPreventiva`: se deve gerar OSs preventivas
- `TempoPreventiva`: quantidade de dias para preventiva
- `DadosPreventiva`: texto da OS preventiva
- `CustoRastreamento`: valor de custo do rastreamento
- `CodMotCancelamento`: código do motivo de cancelamento
- `Substituido`: indica se foi substituído
- `Substituto`: indica se entrou como Substituto
- `DataVencimentoContrato`: quando encerra o contrato
- `ValorSeguro`: valor do seguro
- `ValorAssistência`: valor da assistência
- `Seguro`: se usa seguro
- `Assistência`: se usa assistência
- `UsaBloqueio`: se usa bloqueio
- `ValorBloqueio`: valor do bloqueio
- `ReleInvertido`: se tem rele invertido
- `LocalSirene`: local da instalação da sirene
- `LocalBotão`: local da instalação do botão de panico
- `ValorLocação`: valor da locação de equipamentos
- `Voltagem`: voltagem do veículo 12/24v
- `FulltrackCode`: código de integração com o rastreamento
- `TipoVeículo`: tipo de veículo
- `ObsVeículo`
- `SistemaRastreamento`: sistema de rastreamento
- `MêsReajuste`: mês em que ocorre o reajuste do veículo
- `CobraProporcional`: se está aguardando a cobrança proporcional do primeiro mês
- `PlanilhaProporcional`: planílha da nota que gerou a proporcionalidade
- `TitularLegado`: cliente que tinha o veículo anteriormente
- `OrcTrocaTitularidade`: orçamento de troca de titularidade
- `NovoTitular`: novo titular do veículo
- `EmSubstituição`: identifica que o veículo está em substituição (aguardando retirada ou instalação)
- `PlaOrcSubstituição`: orçamento de substituição
- `PlaOSSubstituição`: planílha da OS da instalação
- `PlaOSSubstituído`: planílha da OS da retirada
- `Apelido`: apelido do veículo

---

### GRVeículosChip
- **Descrição:** Chips GPRS vinculados a veículos
- **Relacionamento:** 
- `CodVeículo` → `GRVeículos.CodInterno`
- `CodChip` → `GRChip.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `CodVeículo`: veículo
- `CodChip`: chip

---

### GRVeículosRastreador
- **Descrição:** Rastreadores vinculados a veículos
- **Relacionamento:** 
- `CodVeículo` → `GRVeículos.CodInterno`
- `CodRastreador` → `GRRastreador.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `CodVeículo`: veículo
- `CodRastreador`: rastreador
- `FulltrackCode`: id do elo veículo/rastreador na integração com rastreamento

---

### GRVeículosSeguros
- **Descrição:** Seguros vinculados a veículos
- **Relacionamento:** 
- `CodVeículo` → `GRVeículos.CodInterno`
- **Status:**
- `A`: Ativo
- `C`: Cancelado
- `P`: Pendente
- **Campos:**
- `CodInterno`: código interno PK
- `CodOperaçãoInterna`: id unico dado a apolice
- `CodVeículo`: veículo
- `CodPlano`: plano de seguro
- `NomeSegurado`: nome do cliente
- `CPFSegurado`: CPF do cliente
- `NascimentoSegurado`: Data de nascimento do cliente
- `SeguroInícioVigência`: Início da vigência
- `SeguroFimVigência`: Fim da vigência
- `NumeroOperação`: Numero da operação na seguradora
- `ValorPrêmio`: valor do prêmio
- `Apólice`: número da apólice
- `NúmeroSorteio`: número do sorteio
- `NúmeroCertificado`: número do certificado
- `Status`: status do seguro
- `AtivaçãoData`: data de ativação
- `AtivaçãoUsuário`: quem ativou
- `AtivaçãoXML`: retorno da seguradora
- `CancelamentoData`: data de cancelamento
- `CancelamentoUsuário`: quem cancelou
- `CancelamentoXML`: retorno do cancelamento da seguradora
- `CancelamentoMotivo`: motivo do cancelamento

---

### GRVeículosSeguros
- **Descrição:** Serviços adicionais de veículos
- **Relacionamento:** 
- `CodVeículo` → `GRVeículos.CodInterno`
- `CodServiço` → `ServiçosAdicionais.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `CodVeículo`: veículo
- `CodServiço`: serviço
- `ValorServiço`: valor mensal do serviço

---

### GRVeículosValorMínimo
- **Descrição:** Valor mínimo por tipo de veículo
- **Relacionamento:** 
- `TipoVeículo` → `DadosEntidades.CodInterno`
- `Unidade` → `Unidades.CodUnidade`
- **Campos:**
- `CodInterno`: código interno PK
- `TipoVeículo`
- `ValorMínimo`: valor mínimo a ser cobrado
- `Unidade`: unidade da configuração
- `ExigePlaca`: se exige placa para este tipo de veículo
- `ValorPadrão`: valor padrão para o tipo de veículo

---

### Hashtags
- **Descrição:** Cadastro do etiquetas
- **Relacionamento:** 
- `Unidade` → `Unidades.CodUnidade`
- **Campos:**
- `CodInterno`: código interno PK
- `Unidade`: unidade da configuração
- `Recurso`: onde a etiqueta vai ser usada: OS; Orçamento; Cliente
- `Hashtag`: texto da hashtag
- `Cor`: cor do texto 
- `Fundo`: cor do fundo 

---

### HistóricoCustos
- **Descrição:** Histórico de custos de produtos
- **Relacionamento:** 
- `CodProduto` → `Produtos.CodProduto`
- `Conciliadora` → `Empresas.CodEmpresa`
- **Campos:**
- `CodInterno`: código interno PK
- `Planílha`: planílha da movimentação
- `CodProduto`: produto
- `Atualização`: data da atualização
- `Custo`: valor do custo
- `CustoReposição`: valor de reposição
- `CustoMédio`: custo médio
- `CustoGerencial`: custo gerencial
- `PreçoVenda`: preço de venda
- `Usuário`: quem atualizou
- `Entrada`: data da entrada da mercadoria
- `Quantidade`: quantidade de compra
- `Conciliadora`: empresa conciliadora de estoque
- `Operação`: operação feita que gravou o custo
- `DescriçãoProduto`: nome do produto
- `TextoAlteração`: outros dados da alteração

---

### HistoricoEmailNFSe
- **Descrição:** Manipulado pela NFSe

---

### HistóricosCaixa
- **Descrição:** Históricos de Caixa, descreve o tipo de movimento de caixa, se é um pagamento ou recebimento, se é uma transferência entre contas de caixa, etc.
- **Relacionamento:** 
- `CentroResultados` → `SubContas.CodInterno`
- **Campos:**
- `CodHistórico`: código do histórico de caixa
- `Histórico`: descrição do histórico de caixa, como 'Recebimento de Duplicatas', 'Pagamento de Duplicatas', 'Transferência entre Contas de Caixa', etc
- `EntSai`: E - entrada de caixa; S - saída de caixa
- `Recibo`: se emite recibo
- `Duplicata`: se baixa duplicatas
- `Comissão`: se baixa comissões
- `CentroResultados`: subconta de resultados do movimento
- `Adiantamento`: se é adiantamento ou reembolso: A - Adiantamento; R - Reembolso; em branco não
- `Cheque`: se movimenta cheque: D - Depósito; V - Devolução; em branco não
- `DescontoDuplicata`: se identifica as duplicatas como descontadas
- `EmiteBorderô`: se emite borderô
- `MovimentaAplicação`: se movimenta aplicação financeira
- `Inativo`: se está inativo
- `GeraCompetência`: se gera lançamento de competência
- `ContaExportação`: conta contábil para exportação
- `TransferenciaCaixa`: se é transferência entre caixas
- `Gera1601`: se gera o 1601 no Sped

---

### HistóricosCaixaContrapartida
- **Descrição:** Contrapartidas de caixa, são as contas de caixa que recebem os lançamentos de movimento de caixa, exemplo: CEF, Bradesco, Caixa Físico, etc
- **Relacionamento:** 
- `Caixa` → `ContasCaixa.CodCaixa`
- **Campos:**
- `CodContrapartida`: código da contrapartida de caixa
- `Descreve`: descrição da contrapartida de caixa, como 'Crédito Banco do Brasil', 'Débito Banco do Brasil', 'Crédito Caixa', 'Débito Caixa', etc
- `EntSai`: E - entrada de caixa; S - saída de caixa
- `Cheque`: se movimenta cheque
- `Caixa`: código do caixa vinculado

---

### ICMSEstados
- **Descrição:** Percentuais padrão de ICMS por unidade
- **Relacionamento:** 
- `Unidade` → `Unidades.CodUnidade`
- **Campos:**
- `CodInterno`: código interno PK
- `UF`: estado
- `ICMSEntrada`: ICMS padrão de entrada
- `ICMSSaída`: ICMS padrão de saída
- `pFCP`: percentual de FCP
- `ICMSInterno`: ICMS interno do estado
- `Unidade`

---

### IGPM
- **Descrição:** Cadastro dos índices mensais de reajustes de contratos
- **Relacionamento:** 
- `Tipo` → `DadosEntidades.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `Data`: mês do índice
- `Índice`: índice do mês
- `Tipo`: tipo de índice (IGMP, IPCA, etc)

---

### Impressoras
- **Descrição:** Para impressoras matriciais, define os códigos para configurar a impressão (depreciado)

---

### ImpressorasEstação
- **Descrição:** Define as impressoras padrão para a estação de trabalho 

---

### InBoletoCredenciamento
- **Descrição:** Não manipulado pelo Service

---

### IndicadoresBI
- **Descrição:** Não manipulado pelo Service

---

### IntegraDocsArquivos
- **Descrição:** Não manipulado pelo Service

---

### IterDeviceTypes
- **Descrição:** Tipos de devices da Iter, tabela temporária

---

### LembretesMessageHub
- **Descrição:** não manipulado pelo Service

---

### Levantamento
- **Descrição:** Balanço de estoque
- **Relacionamento:** 
- `Empresa` → `Empresas.CodEmpresa`
- `CodProduto` → `Produtos.CodProduto`
- `TipoEstoque` → `TiposEstoque.CodEstoque`
- **Status:**
- ` `: Pendente
- `>`: Contado
- `C`: Cancelado
- `X`: Encerrado
- **Campos:**
- `CodInterno`: código interno PK
- `Empresa`
- `CodProduto`
- `Status`: status da contagem
- `QtAtual`: quantidade em estoque na abertura
- `CustoAtual`: custo na abertura
- `CustoInformado`: custo informado no produto
- `QtInformada`: quantidade informada
- `Abertura`: data de abertura
- `TipoEstoque`: tipo de estoque
- `Usuário`: quem abriu
- `UsuárioAlteração`: quem informou contagem
- `DataAlteração`: data informada contagem
- `UsuárioEncerramento`: quem encerrou
- `DataEncerramento`: data do encerramento
- `UsuárioCancelamento`: quem cancelou
- `DataCancelamento`: data do cancelamento
- `Planílha`: planílha dos movimentos de estoque lançados para ajuste

---

### Liberações
- **Descrição:** Liberações gerenciais 
- **Relacionamento:** 
- `Unidade` → `Unidades.CodUnidade`
- **Nível:**
- `0`: Limite orçamentário (fluxo de caixa) - liberação específica
- `1`: Administrativo (mais alto)
- `2`: Financeiro
- `3`: Vendas
- `4`: Operacional
- **Campos:**
- `CodInterno`: código interno PK
- `Usuário`: quem gerou a liberação
- `Data`: quando foi gerada
- `Mensagem`: mensagem da liberação
- `Nível`: nível de liberação
- `Ok`: se a liberação foi tratada ou está pendente
- `LiberadoPor`: quem liberou, se nulo não houve liberação, foi cancelada
- `MensagemL`: depreciado
- `Unidade`: unidade da liberação
- `DataLiberação`: data em que foi tratada
- `BloqueadoPor`: quem não liberou a ação
- `TipoItem`: onde foi gerada a liberação, em geral apenas OS e Orc
- `CodItem`: orçamento/os que gerou a liberação

---

### LigaçõesPABX
- **Descrição:** Ligações geradas para o PABX através da integração
- **Relacionamento:** 
- `CodCliente` → `Clientes.CodCliente`
- **Campos:**
- `IDChamada`: código interno PK
- `Usuário`: quem gerou a ligação
- `CodCliente`: cliente que foi contatado
- `DataHora`: quando foi gerada a ligação
- `Origem`: tela onde foi gerada a chamada
- `UserField`: código da chamada
- `Ramal`: ramal acionado
- `Destino`: numero de destino

---

### LocalizaProdutos
- **Descrição:** Grava localização de produtos, mínimo e máximo de estoque, custos e estoque atual de produtos
- **Relacionamento:** 
- `CodEmpresa` → `Empresas.CodEmpresa`
- `CodProduto` → `Produtos.CodProduto`
- `TipoEstoque` → `TiposEstoque.CodEstoque`
- **Campos:**
- `CodEmpresa`: código da empresa
- `CodProduto`: código do produto
- `Estoque`: saldo de estoque para o tipo na empresa
- `Localiza1`: primeira localização
- `Localiza2`: segunda localização
- `Localiza3`: terceira localização
- `Minimo`: mínimo de estoque
- `Maximo`: máximo de estoque
- `Classe`: classe ABC do produto
- `CodInterno`: codigo interno PK
- `Preço`: preço de venda atual
- `Custo`: custo atual
- `CustoReposição`: custo reposição atual
- `CustoGerencial`: custo gerencial atual
- `CustoMédio`: custo médio atual
- `TipoEstoque`: tipo de estoque 
- `Controle`: depreciado
- `EventosProduto`: eventos do produto
- `ICMSSTCalculado`: valor de ICMSST calculado - para composição do custo

---

### LogAcessoCadastroCliente
- **Descrição:** Registra os acessos aos dados do cliente
- **Relacionamento:** 
- `CodCliente` → `Clientes.CodCliente`
- **Campos:**
- `CodInterno`: codigo interno PK
- `CodCliente`: cliente
- `Usuário`: quem acessou
- `DataEvento`: quando
- `Tela`: em que tela

---

### LogAcessoPortal
- **Descrição:** Manipulado pelo IntegraService

---

### LogAcessoCadastroCliente
- **Descrição:** Registra os acessos aos dados do cliente
- **Relacionamento:** 
- `CodCliente` → `Clientes.CodCliente`
- **Campos:**
- `CodInterno`: codigo interno PK
- `CodCliente`: cliente
- `Usuário`: quem acessou
- `DataEvento`: quando
- `Tela`: em que tela

---

### LogAlteraçãoAcesso
- **Descrição:** Alterações de acesso de usuários, recursos liberados ou bloqueados
- **Campos:**
- `CodInterno`: codigo interno PK
- `Usuário`: quem alterou
- `DataEvento`: quando alterou
- `UsuárioAlterado`: usuário que teve o acesso alterado
- `Recurso`: tela ou item do menu
- `RecursoDescrição`: descrição
- `Ação`: ação que ocorreu: Liberado/Bloqueado

---

### LogCadastroClientes
- **Descrição:** Evento de gravação do cadastro do cliente
- **Relacionamento:** 
- `CodCliente` → `Clientes.CodCliente`
- **Campos:**
- `CodInterno`: codigo interno PK
- `CodCliente`
- `DataHora`: quando alterou
- `Usuário`: usuário que gravou

---

### LogCadastroClientes
- **Descrição:** Evento de gravação do cadastro do cliente
- **Relacionamento:** 
- `CodCliente` → `Clientes.CodCliente`
- **Campos:**
- `CodInterno`: codigo interno PK
- `CodCliente`
- `DataHora`: quando alterou
- `Usuário`: usuário que gravou

---

### LogCartaoCreditoPortal
- **Descrição:** Manipulado pelo IntegraService

---

### LogChamadasAPIs
- **Descrição:** Chamadas de APIs das Integrações 
- **Campos:**
- `CodInterno`: codigo interno PK
- `Usuário`
- `DataEvento`: quando comunicou
- `Integrador`: qual API está sendo chamada
- `Método`: método da chamada Rest
- `URL`: endpoint chamado
- `Body`: body da requisição
- `Response`: resposta do WS
- `Headers`: Headers da requisição
- `Erro`: depreciado
- `RetornoStatus`: status e string de status de retorno

---

### LogErro
- **Descrição:** Depreciada

---

### LogGeral
- **Descrição:** Grava o estado dos componentes ao abrir e gravar configuradores
- **Campos:**
- `CodInterno`: codigo interno PK
- `Tela`: formulário
- `Usuário`
- `DataHora`
- `Evento`: Acesso/Gravação
- `Campos`: campos for form nome nome e valor separados por ;

---

### LogInOutUsuário
- **Descrição:** Registra o acesso e logout de usuários nas ferramentas
- **Campos:**
- `CodInterno`: codigo interno PK
- `Ação`: Login/Logout
- `Ocorrência`: data de ocorrência
- `Versão`: versão do Service/APP
- `Plataforma`: Recurso acessado
- `LocalIP`: IP do aparelho/PC
- `MacAddress`: Mac do aparelho/PC
- `PCName`: Nome da estação/dispositivo

---

### LogOSProdutos
- **Descrição:** Registra um log de alterações de produtos na OS
- **Relacionamento:** 
- `Planílha` → `OSs.Planílha`
- **Campos:**
- `CodInterno`: codigo interno PK
- `Planílha`: Planílha da OS
- `Evento`: texto do evento de alteração
- `Usuário`: responsável
- `DataHora`: data e hora do evento

---

### LogRPS
- **Descrição:** Manipulado pelo NFSe

---

### LogsMessageHub
- **Descrição:** Manipulado pelo MessageHub

---

### LoteGNRE
- **Descrição:** Lotes de GNRE Difal
- **Relacionamento:** 
- `Empresa` → `Empresas.CodEmpresa`
- **Campos:**
- `CodInterno`: codigo interno PK
- `Empresa`
- `Data`: data do envio
- `Usuário`: quem enviou
- `XMLEnvio`: XML das notas enviadas
- `XMLRespostaEnvio`: XML de resposta do envio das notas do WS
- `Recibo`: Recibo gerado no envio
- `DataRecibo`: Data e hora do recibo
- `XMLPedidoRetorno`: XML gerado para pedido do retorno
- `XMLRetorno`: XML retornardo do WS
- `Resultado`: Resultado do processamento: 402 - Processado OK; 403 - Processado com exceções; 400 e 401 - Em processamento; outros resultados são erros
- `msgResultado`: descrição do resultado do processamento
- `TipoGNRE`: depreciado

---

### LoteGNREGuias
- **Descrição:** Quando os lotes de GNRE são processados, armazenam nesta tabela as guias geradas
- **Relacionamento:** 
- `Planílha` → `NotasFiscaisSaída.Planílha`
- `CodLote` → `LoteGNRE.CodInterno`
- **Campos:**
- `CodInterno`: codigo interno PK
- `Planílha`: planílha da nota vinculada a guia
- `CodLote`: lote de envio
- `Receita`: tipo de receita
- `Controle`: número de controle
- `Vencimento`: data de vencimento da guia
- `ValorPrincipal`: valor da guia
- `CodigoBarras`: representação numerica do código de barras
- `RepresentacaoNumerica`: linha digitavel do guia

---

### MailServerContas
- **Descrição:** Manipulado pelo MessageHub

---

### MailServerContasEmpresa
- **Descrição:** Manipulado pelo MessageHub

---

### MalaDireta
- **Descrição:** Dados temporários usados no apoio a tela de MalaDireta

---

### ManifestoConsulta
- **Descrição:** Consultas feitas no WS Nacional da Receita para buscar as NFEs emitidas contra o CNPJ
- **Relacionamento:** 
- `Empresa` → `Empresas.CodEmpresa`
- **Campos:**
- `CodInterno`: codigo interno PK
- `Empresa`
- `CNPJ`: CNPJ da empresa (concentra as consulta no CNPJ)
- `DataHora`: data do evento de consulta
- `IndCont`: no WS da receita 0 - sem mais dados; 1 - mais dados, na Invocy grava o número do lote enviado
- `UltimoNSUConsultado`: grava o último NSU recebido, usa ele para a próxima consulta para evitar uso indevido
- `XMLRetorno`: XML dos documentos recebidos na consulta (na invocy XML recebido ao gerar a requisição)
- `TXTRetorno`: TXT dos documentos recebidos na consulta (na invocy XML recebido ao consultar o protocolo)
- `Usuário`: quem gerou a consulta
- `ProtocoloInvocy`: protocolo da consulta para busca do retorno
- `ProcessadoInvocy`: se já buscou o resultado da consulta pelo protocolo recebido

---

### ManifestoDocumentos
- **Descrição:** Documentos recebidos da consulta de manifestação
- **Relacionamento:** 
- `CodConsulta` → `ManifestoConsulta.CodInterno`
- **SituaçãoNFe:**
- `1`: Autorizada
- `2`: Denegada
- `3`: Cancelada
- `4`: Inutilizada
- **SituaçãoManifesto:**
- `0`: Confirmação da Operação
- `2`: Desconhecimento da Operação
- `3`: Registro de Operação não realizada
- **Campos:**
- `CodInterno`: codigo interno PK
- `CodConsulta`: código da consulta feita
- `TipoDocumento`: sempre NFe
- `ChaveNFe`: chave de acesso da nota
- `CPFCNPJ`: CPF ou CNPJ do emissor da nota
- `Nome`: nome do emissor
- `IE`: inscrição do emissor
- `DataEmissão`: data de emissão da NFe
- `Movimento`: tag tpNF da NFe: 0 - Entrada; 1 - Saída
- `ValorNFe`: valor da NFe
- `DigVal`: Digest Value da assinatura da NFe
- `DataRecebimento`: campo dhRecbto da NFe
- `SituaçãoNFe`: campo cSitNFe da NFe (situação atual do documento)
- `SituaçãoManifesto`: manifestação da nota
- `CCeTipoEvento`: não utilizado
- `CCeSequencia`: não utilizado
- `CCeDescEvento`: não utilizado
- `CCeCorreção`: não utilizado
- `XMLNota`: XML do ProcNFe da nota
- `NSU`: número serial único do documento
- `JustificativaNãoRealizado`: motivo pelo qual a operação não foi realizada no manifesto tipo 3

---

### ManifestoEventos
- **Descrição:** Eventos de manifestações feitas nas NFes recebibas
- **TipoEvento:**
- `0`: Confirmação da Operação
- `2`: Desconhecimento da Operação
- `3`: Registro de Operação não realizada
- **Campos:**
- `CodInterno`: codigo interno PK
- `ChaveNFe`: chave da nota manifestada
- `DataEvento`: data e hora da manifestação
- `TipoEvento`: manifestação feita
- `Justificativa`: motivo pelo qual a operação não foi realizada no manifesto TipoEvento 3
- `Protocolo`: protocolo recebido da manifestação
- `DataProtocolo`: data e hora do protocolo
- `Usuário`: quem gerou a manifestação

---

### Mensagens
- **Descrição:** São as mensagens que aparecem na tela de login
- **Campos:**
- `Mensagem`: mensagem a ser exibida
- `Status`: `*` se já foi exibida, caso todas tenham sido limpa o campo e começa novamente
- `CodInterno`: codigo interno PK

---

### MensagensEnviadas
- **Descrição:** São as mensagens enviadas pelo usuário através do gerenciador de mensagens
- **Relacionamento:** 
- `CodCliente` → `Clientes.CodCliente`
- **Campos:**
- `CodInterno`: codigo interno PK
- `Usuário`: quem enviou
- `Envio`: data/hora envio
- `Mensagem`: texto da mensagem
- `EnviadoPara`: usuário para quem foi enviado
- `Assunto`: assunto da mensagem
- `UsuárioOriginal`: se mesmo usuário ou em branco é um envio, caso contrário uma resposta
- `CodCliente`: código do cliente ao qual se refere a mensagem
- `Excluída`: se a mensagem foi excluída
- `MensagemTXT`: texto da mensagem sem as tags html

---

### MensagensEnviadas
- **Descrição:** São as mensagens enviadas pelo usuário através do gerenciador de mensagens
- **Relacionamento:** 
- `CodCliente` → `Clientes.CodCliente`
- **Campos:**
- `CodInterno`: codigo interno PK
- `Usuário`: quem enviou
- `Envio`: data/hora envio
- `Mensagem`: texto da mensagem
- `EnviadoPara`: usuário para quem foi enviado
- `Assunto`: assunto da mensagem
- `UsuárioOriginal`: se mesmo usuário ou em branco é um envio, caso contrário uma resposta
- `CodCliente`: código do cliente ao qual se refere a mensagem
- `Excluída`: se a mensagem foi excluída
- `MensagemTXT`: texto da mensagem sem as tags html

---

### MensagensInstantâneas
- **Descrição:** depreciado

---

### MensagensInstantâneas
- **Descrição:** São as mensagens recebidas pelo usuário através do gerenciador de mensagens
- **Relacionamento:** 
- `CodCliente` → `Clientes.CodCliente`
- `IDMensagemEnviada` → `MensagensEnviadas.CodInterno`
- **Campos:**
- `CodInterno`: codigo interno PK
- `Usuário`: quem recebeu
- `Recebido`: data/hora recebimento
- `Assunto`: assunto da mensagem
- `Mensagem`: texto da mensagem
- `Lido`: identifica se foi lida pelo receptor
- `Remetente`: quem enviou
- `UsuárioOriginal`: se mesmo usuário ou em branco é um envio, caso contrário uma resposta
- `CodCliente`: código do cliente ao qual se refere a mensagem
- `Excluída`: se a mensagem foi excluída
- `MensagemTXT`: texto da mensagem sem as tags html
- `IDMensagemEnviada`: id da mensagem originária
- `LidaEm`: data/hora que a mensagem foi lida

---

### Menus
- **Descrição:** Monta os menus do sistema
- **Tipo:**
- `1`: Menu principal
- `2`: Item do menu principal
- `3`: SubMenu
- `4`: Item do submenu
- **Campos:**
- `CodInterno`: codigo interno PK
- `Tipo`: tipo de item
- `IniciarGrupo`: se inicia uma quebra de grupo
- `Texto`: texto a ser exibido no item de menu
- `Ação`: procedure do programa que vai ser executada ao cliente (normalmente se refere ao nome do formulário que é acionado, salvo exceções)
- `Face`: id de ícone que será exibido
- `Especial`: depreciado
- `Módulo`: identificação do módulo que compõe o item quando o tipo de Liberação é Small, Pro ou Premium
- `LinkWiki`: link da wiki que descreve o item
- `ModuloNovo`: módulo que compõe o item quando o tipo de liberação é Service

---

### Menus
- **Descrição:** Monta os menus do sistema
- **Tipo:**
- `1`: Menu principal
- `2`: Item do menu principal
- `3`: SubMenu
- `4`: Item do submenu
- **Campos:**
- `CodInterno`: codigo interno PK
- `Tipo`: tipo de item
- `IniciarGrupo`: se inicia uma quebra de grupo
- `Texto`: texto a ser exibido no item de menu
- `Ação`: procedure do programa que vai ser executada ao cliente (normalmente se refere ao nome do formulário que é acionado, salvo exceções)
- `Face`: id de ícone que será exibido
- `Especial`: depreciado
- `Módulo`: identificação do módulo que compõe o item quando o tipo de Liberação é Small, Pro ou Premium
- `LinkWiki`: link da wiki que descreve o item
- `ModuloNovo`: módulo que compõe o item quando o tipo de liberação é Service

---

### MenusUsuarioGestor 
- **Descrição:** Não utilizada no service

---

### Mesas 
- **Descrição:** Não utilizada no service

---

### MesasConsumo 
- **Descrição:** Não utilizada no service

---

### ModeloEmailNFSe 
- **Descrição:** Manipulado pelo NFSe

---

### modelos_dashboard 
- **Descrição:** Não utilizada no service

---

### modelos_dashboard_usuarios 
- **Descrição:** Não utilizada no service

---

### ModelosContratos 
- **Descrição:** Não utilizada no service

---

### MovimentoCaixa
- **Descrição:** Movimentações de caixa, tem os dados dos pagamentos e recebimentos feitos pela empresa, onde se apura os saldos das contas de caixa.
- **Relacionamento:** 
- `CentroResultados` → `SubContas.CodInterno`
- `Caixa` → `ContasCaixa.CodCaixa`
- `Empresa` → `Empresas.CodEmpresa`
- `Histórico` → `HistóricosCaixa.CodHistórico`
- `Contrapartida` → `HistóricosCaixaContrapartida.CodContrapartida`
- `CodRetorno` → `Retornos.CodInterno`
- `CodFatLote` → `FaturamentosRealizados.CodInterno`
- `PlaVinculoOFX` → `ContasTransações.PlaVinculo`
- `IDTransPJ` → `BraspagProcessamento.idTransBraspag`
- **Regras:**
- Ignorar registros com `Eliminado = 1`
- Saldo = **soma de (`Entrada - Saída`) onde `Eliminado=0` e `Movimento <= data consultada`**
- **Campos:**
- `Planílha`: planílha da movimentação
- `Movimento`: data da movimentação
- `Usuário`: quem fez o lançamento
- `Entrada`: valor recebido
- `Saída`: valor pago
- `Histórico`: código do histórico de caixa
- `Contrapartida`: código da contrapartida de caixa
- `Complemento`: traz a descrição da movimentação
- `Eliminado`: se verdadeiro, a movimentação foi eliminada, não deve ser considerada
- `EliminadoPor`: quem excluiu o movimento
- `Motivo`: motivo da eliminação
- `Empresa`: empresa do lançamento
- `Caixa`: código da conta de caixa
- `CodInterno`: código interno PK
- `Compensado`: em lançamentos de cheques, identifica se o cheque já foi compensado e a operação concluída, também em transação da PJBank se já está processada e ok
- `CentroResultados`: código da conta contábil ou centro de resultados da receita ou despesa, permite verificar sobre o que é a receita ou despesa: energia eletrica, combustivel, estoque, etc
- `Origem`: sempre CX
- `DRE`: sempre 1
- `Competência`: data da competência do lançamento
- `Borderô`: se feito em borderô identifica qual
- `DataEliminação`: data em que foi eliminado o registro
- `DataApresentaçãoCheque`: data da apresentação do cheque ao fornecedor
- `ChequeEmitido`: número do cheque emitido
- `CodRetorno`: código de processamento do retorno bancário que gerou o lançamento
- `DataHoraServer`: data/hora do servidor no momento da gravação
- `DataCompensação`: data da compensação do cheque
- `LogAlterações`: alterações feitas no movimento
- `Conciliado`: identifica se o lançamento já foi encerrado por conciliação
- `CodFatLote`: código do faturamento em lote que gerou o lançamento
- `PlaVinculoOFX`: planílha de vínculo com importação do OFX do banco
- `IDTransPJ`: identificação da transação feita com a integração do PJBank para pagamentos
- `TransPJStatus`: status da transação

---

### MovimentoCaixaCentro
- **Descrição:** Vínculo dos movimentos de caixa com os centros de custos
- **Relacionamento:** 
- `Planílha` → `MovimentoCaixa.Planílha`
- `CodCentro` → `Centros.CodInterno`
- `Empresa` → `Empresas.CodEmpresa`
- `ContaResultados` → `SubContas.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `Planílha`: planílha da movimentação de caixa
- `CodCentro`: centro de custo vinculado
- `CentroResultados`: sem uso atualmente
- `Percentual`: percentual do lançamento referente ao centro de custo
- `Empresa`: empresa do lançamento
- `ContaResultados`: subconta de resultados vinculada, se em branco busca da tabela MovimentoCaixa

---

### MovimentoEnviosMailGun
- **Descrição:** Manipulado pelo MessageHub

---

### MunicípiosIBGE
- **Descrição:** Importação dos dados do IBGE com o código dos municípios
- **Campos:**
- `CodInterno`: código interno PK
- `UF`: código da UF no IBGE
- `NomeUF`: nome da UF
- `Meso`: código a área do estado
- `NomeMeso`: nome da área do estado
- `Micro`: código da microregião
- `NomeMicro`: nome da microregião
- `Munic`: código do município
- `NomeMunic`: nome do município
- `Distr`: código do distrito
- `NomeDistr`: nome do distrito
- **Regras:**
- Usamos o código da UF, exemplo 41 paraná, concatenado com o do munícipio, exemplo 27700 Toledo. Código da cidade então seria 4127700

---

### NotasFiscaisEntrada
- **Descrição:** Notas fiscais de entrada emitidas por terceiros contra o CNPJ da empresa
- **Relacionamento:** 
- `CodFornecedor` → `Clientes.CodCliente`
- `Empresa` → `Empresas.CodEmpresa`
- `Planilha` → `EstoqueMovimento.Planilha`
- `CodVendedor` → `Clientes.CodCliente`
- `PlaNFDev` → `NotasFiscaisSaída.Planílha`
- **TipoDocumento:**
- `00`: NFSe/RPS Serviços
- `01`: Nota Fiscal Formulário
- `06`: Nota/Conta de Energia Elétrica
- `21`: Nota de Telecomunicação
- `22`: Nota de Telecomunicação
- `55`: NFe - Nota Fiscal Eletrônica
- `59`: Cupom SAT
- `65`: NFCe - Nota Fiscal a Consumidor Eletrônica
- `57`: CTe - Conhecimento de Transporte Eletrônico
- `58`: MDFe - Manifesto de Documentos Fiscais Eletrônico
- `66`: NFe3 - Energia Elétrica
- `99`: Outros Documentos
- **SituacaoDocumento:**
- `00`: Documento regular
- `01`: Escrituração extemporânea de documento regular
- `02`: Documento cancelado
- `03`: Escrituração extemporânea de documento cancelado
- `04`: NF-e ou CT-e – denegado
- `05`: NF-e ou CT-e - Numeração inutilizada
- `06`: Documento Fiscal Complementar
- `07`: NFCe - Nota Fiscal a Consumidor Eletrônica
- `57`: Escrituração extemporânea de documento complementa
- `08`: Documento Fiscal emitido com base em Regime Especial ou Norma Específica
- **Campos:**
- `CodFornecedor`: cliente vinculado
- `NotaFiscal`: número da nota
- `Serie`: série da nota
- `Planilha`: código da planilha
- `DataEmissão`: data da compra 
- `ValorNota`: valor da compra
- `ValorProdutos`: valor dos produtos comprados, quando não houver produtos, o valor será 0 ou nulo
- `Cod`: código interno PK
- `DataMovimento`: data da entrada dos produtos na empresa
- `Empresa`: código da empresa
- `Usuário`: quem lançou a nota
- `Frete`: valor de frete pago
- `CFOP`: Código Fiscal de Operações e Prestações da Nota Fiscal ex 1102, 2202, etc
- `Pedido`: código do pedido vinculado - depreciado
- `EntSai`: conjunto de caracteres que determina caracteristicas da nota
- `Operação`: operação/COI que foi utilizado no lançamento
- `Observações`
- `Observações2`
- `Favorecido`: quem é o favorecido do contas a pagar
- `ICMSSubstituição`: valor do ICMS de substituição da nota
- `NFe`: identifica se é NFe
- `ChaveNFe`: chave da NFe
- `AcréscimoFin`: acréscimos financeiros da nota
- `BaseISS`: valor base de calculo do ISS
- `PercentualISS`: percentual do ISS 
- `ValorISS`: valor do ISS
- `ValorISSRetido`: valor do ISS Retido
- `BasePIS`
- `PercentualPIS`
- `ValorPIS`
- `ValorPISRetido`
- `BaseCOFINS`
- `PercentualCOFINS`
- `ValorCOFINS`
- `ValorCOFINSRetido`
- `BaseCSLL`
- `PercentualCSLL`
- `ValorCSLL`
- `ValorCSLLRetido`
- `BaseINSS`
- `PercentualINSS`
- `ValorINSS`
- `ValorINSSRetido`
- `BaseIRRF`
- `PercentualIRRF`
- `ValorIRRF`
- `ValorIRRFRetido`
- `XMLNota`: XML da NFe gerado pelo fornecedor
- `XMLConsulta`: XML da consulta da NFe
- `LogNota`: log de alterações
- `CodVendedor`: vendedor vinculado
- `CodServiçoPrestado`: código do serviço prestado na nota
- `ClassificaçãoServiços`: classificação do serviço
- `JustificaOutras`: justificativa do uso de outras entradas
- `TipoDocumento`: tipo de documento
- `FreteCTE`: valor do frete em CTE
- `TomadoBPIS`: base do PIS tomado (crédito)
- `TomadoPPIS`: percentual do PIS tomado (crédito)
- `TomadoVPIS`: valor do PIS tomado (crédito)
- `TomadoBCOFINS`: base do COFINS tomado (crédito)
- `TomadoPCOFINS`: percentual do COFINS tomado (crédito)
- `TomadoVCOFINS`: valor do COFINS tomado (crédito)
- `SituacaoDocumento`: status do documento NFe
- `ChaveNFeTratada`: chave da NFe sem espaços
- `PlaNFDev`: planílha da NF de devolução vinculada
- **Regras:**
- Os produtos da nota fiscal são listados na tabela `EstoqueMovimento`

---

### NFETeresina
- **Descrição:** Manipulado pelo MessageHub?

---

### NotasFiscaisEntradaCentroCustos
- **Descrição:** Centros de custos vincuados a uma nota de entrada
- **Relacionamento:** 
- `Planílha` → `NotasFiscaisEntrada.Planilha`
- `CentroResultado` → `SubContas.CodInterno`
- `CentroCusto` → `Centros.CodInterno`
- `Empresa` → `Empresas.CodEmpresa`
- **Campos:**
- `CodInterno`: código interno PK
- `Planílha`: código da planilha da nota de entrada
- `CentroResultado`: subconta de resultados vinculada
- `CentroCusto`: centro de custo vinculado
- `Valor`: valor atribuido ao centro de custo
- `Percentual`: percentual atribuido ao centro de custo
- `Empresa`: empresa de lançamento

---

### NotasFiscaisEntradaCentrosResultados
- **Descrição:** Rateio do valor da nota de entrada por subcontas de resultados
- **Relacionamento:** 
- `Planílha` → `NotasFiscaisEntrada.Planilha`
- `CentroResultado` → `SubContas.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `Planílha`: código da planilha da nota de entrada
- `CentroResultado`: subconta de resultados vinculada
- `Valor`: valor atribuido a subconta
- `Percentual`: percentual atribuido a subconta

---

### NotasFiscaisEntradaContagem
- **Descrição:** Grava notas de entrada para conferência (feito contagem antes do lançamento formal da NF)
- **Relacionamento:** 
- `Unidade` → `Unidades.CodUnidade`
- `CodFornecedor` → `Clientes.CodCliente`
- **StatusContagem:**
- `A`: Aguardando contagem
- `C`: Cancelada
- `X`: Contagem realizada
- **Campos:**
- `CodInterno`: código interno PK
- `Unidade`
- `CodFornecedor`
- `DataAbertura`: data em que foi gravado o processo
- `NúmeroNota`: número da nota
- `Série`: série da nota
- `XMLNFe`: ProcXML da NFe
- `Observações`
- `ChaveNFe`: chave de acesso da NFe
- `StatusContagem`: status do processo
- `UsuárioAbertura`: quem gravou
- `DataFechamento`: data da contagem
- `UsuárioFechamento`: quem fechou
- `LogAlterações`
- `Planílha`: planílha do 

---

### NotasFiscaisEntradaContagemProdutos
- **Descrição:** Produtos das notas de entrada em conferência
- **Relacionamento:** 
- `CodNota` → `NotasFiscaisEntradaContagem.CodInterno`
- `CodProduto` → `Produtos.CodProduto`
- **Campos:**
- `CodInterno`: código interno PK
- `CodNota`: processo de contagem vinculado
- `CodProduto`: produto vinculado
- `Descreve`: descrição do produto na NF
- `Quantidade`: quantidade de unidades na NF
- `QuantidadeContada`: quantidade contada
- `ObservaçõesDivergência`: explicações sobre a divergência

---

### NotasFiscaisEntradaEmpresas
- **Descrição:** Rateio do valor da nota de entrada por empresas
- **Relacionamento:** 
- `Planílha` → `NotasFiscaisEntrada.Planilha`
- `Empresa` → `Empresas.CodEmpresa`
- `CentroResultado` → `SubContas.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `Planílha`: código da planilha da nota de entrada
- `Empresa`: código da empresa vinculada
- `Valor`: valor atribuido a empresa
- `Percentual`: percentual atribuido a empresa
- `CentroResultado`: subconta de resultados vinculada

---

### NotasFiscaisEntradaExcluídas
- **Descrição:** Notas fiscais de entrada que tiveram o lançamento cancelado
- **Relacionamento:** 
- `CodFornecedor` → `Clientes.CodCliente`
- `Empresa` → `Empresas.CodEmpresa`
- `CentroResultados` → `SubContas.CodInterno`
- **Campos:**
- `Cod`: código interno PK
- `Planilha`: código da planilha
- `Empresa`: código da empresa
- `CodFornecedor`: cliente vinculado
- `Nome`: nome do cliente
- `NotaFiscal`: número da nota
- `Serie`: série da nota
- `DataEmissão`: data da compra 
- `DataMovimento`: data da entrada dos produtos na empresa
- `ValorNota`: valor da compra
- `CFOP`: Código Fiscal de Operações e Prestações da Nota Fiscal ex 1102, 2202, etc
- `CentroResultados`: subconta de resultados atribuida a nota
- `LogNota`
- `Usuário`: quem lançou excluiu a nota
- `Operação`: operação/COI que foi utilizado no lançamento

---

### NotasFiscaisEntradaPedidos
- **Descrição:** Baixa de itens em pedidos de compra feitos pela nota de entrada
- **Relacionamento:** 
- `PlanílhaNota` → `NotasFiscaisEntrada.Planilha`
- `CodPedido` → `Pedidos.CodPedido`
- `CodProduto` → `Produtos.CodProduto`
- `CodItemPedido` → `DadosPedidos.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `PlanílhaNota`: planílha da nota de entrada
- `CodPedido`: código do pedido
- `CodProduto`: código do produto
- `Quantidade`: quantidade de itens baixados pela nota
- `Unitário`: valor unitário do item na nota
- `CodItemPedido`: código do item no pedido

---

### NotasFiscaisEntradaRateioClientes
- **Descrição:** Rateia os custos da NF de entrada entre clientes
- **Relacionamento:** 
- `Planílha` → `NotasFiscaisEntrada.Planilha`
- `CodCliente` → `Clientes.CodCliente`
- **Campos:**
- `CodInterno`: código interno PK
- `Planílha`: planílha da nota de entrada
- `CodCliente`: código do cliente
- `Percentual`: percentual de rateio
- `Especifico`: se foi lançado para clientes específicos 
- `ValorProporcional`: valor proporcional atribuido ao cliente

---

### NotasFiscaisSaída
- **Descrição:** Notas fiscais de produtos e serviços emitidas para os clientes.
- **Relacionamento:** 
- `Cliente` → `Clientes.CodCliente`
- `Empresa` → `Empresas.CodEmpresa`
- `Planilha` → `EstoqueMovimento.Planílha`
- `Vendedor` → `Clientes.CodCliente`
- `FormaPgto` → `FormasPagto.CodFormaPagto`
- `Transportador` → `Clientes.CodCliente`
- `PlaKits` → `EstoqueMovimento.Planílha`
- `PlaOrcAntecipa` → `Orçamentos.Planílha`
- `PlaSubstituta` → `NotasFiscaisSaída.Planílha`
- `PlaSubstituída` → `NotasFiscaisSaída.Planílha`
- `PlaCumpomFiscal` → `NotasFiscaisSaída.Planílha`
- `LoteGNREDifal` → `LoteGNRE.CodInterno`
- `LoteGNREFCP` → `LoteGNRE.CodInterno`
- `PlaOSVendaDireta` → `OSs.Planílha`
- `CodFatLote` → `FaturamentosRealizados.CodInterno`
- `CodPosto` → `ClientesPostos.CodInterno`
- `OrcVendaDireta` → `Orçamentos.Planílha`
- `PlaRPSVinculada` → `NotasFiscaisSaída.Planílha`
- `PlaOSEmpreitada` → `OSs.Planílha`
- `PlaOSEntrega` → `OsEntregas.PlanílhaEntrega`
- `CondPagto` → `CondiçõesPagto.CodCondição`
- **TipoFrete:**
- `1`: 0 - por conta do emitente
- `2`: 1 - por conta do destinatário
- `3`: 2 - por conta de terceiros
- `4`: 3 - transporte próprio por conta do emitente
- `5`: 4 - transporte próprio por conta do destinatário
- `9`: 9 - sem frete
- **DIViaTransporte:**
- `1`: Marítima
- `2`: Fluvial
- `3`: Lacustre
- `4`: Aérea
- `5`: Postal
- `6`: Ferroviária
- `7`: Rodoviária
- `8`: Conduto / Rede Transmissão
- `9`: Meios Próprios
- `10`: Entrada / Saída ficta
- `11`: Courier
- `12`: Em mãos
- `13`: Por Reboque
- **DIIntermediario:**
- `1`: Importação por conta própria
- `2`: Importação por conta e ordem
- `3`: Importação por encomenda
- **Campos:**
- `Empresa`: código da empresa
- `Planílha`: planílha da nota
- `Cliente`: cliente ao qual foi emitida a nota
- `NúmeroNota`: número da nota fiscal
- `Série`: série da nota fiscal
- `DataEmissão`: data de emissão danota
- `Operação`: Operação ou COI usado para emitir a nota
- `ValorNota`: valor da nota fiscal sem acréscimos
- `IsentoICM`: total de isento de ICMS
- `OutrosICM`: total de outros de ICMS
- `ValorDesconto`: valor aplicado de desconto
- `DataMovimento`: data da movimentação
- `Estado`: estado destino da NF
- `ValorFrete`: valor do frete
- `TipoFrete`: tipo de frete
- `Vendedor`: vendedor atrelado a nota
- `Status`: 'A' ativa, 'C' cancelada
- `Usuário`: usuário responsável pela gravação
- `NomeCliente`: nome do cliente
- `CodInterno`: código interno PK
- `FormaPgto`: forma de pagamento vinculada
- `MotivoCancelamento`: motivo do cancelamento da nota
- `Desconto`: valor do desconto na nota
- `CFOP`: Código Fiscal de Operações e Prestações da Nota Fiscal ex 6101, 5101, 6102, 5102, etc
- `CGCCPF`: trata-se do CPF ou CNPJ do cliente, quando a quantidade de caracteres for acima de 14, é CNPJ (pessoa jurídica), se for menor, é CPF (pessoa física)
- `Inscrição`: inscrição estadual do destinatário
- `Endereço`: endereço do cliente para o qual foi emitida a nota fiscal
- `Número`: número do endereço do cliente para o qual foi emitida a nota fiscal
- `Bairro`: bairro do cliente para o qual foi emitida a nota fiscal
- `Cidade`: cidade do cliente para o qual foi emitida a nota fiscal
- `CEP`: CEP do cliente para o qual foi emitida a nota fiscal
- `Fone`: telefone do cliente para o qual foi emitida a nota fiscal
- `Fax`: telefone auxiliar do cliente para o qual foi emitida a nota fiscal
- `Transportador`: código do transportador atrelado
- `Placa`: placa do veículo de transporte
- `CidadeMot`: cidade do veículo
- `UfMot`: estado do veículo
- `Motorista`: nome do transportador/motorista
- `CPFMot`: CPF ou CNPJ do transportador
- `Marca`: marca do item no transporte
- `NúmeroVolume`: número do volume
- `Quantidade`: quantidade de volumes
- `Espécie`: espécie do volume
- `Bruto`: peso bruto
- `Líquido`: peso liquido
- `AliquotaICMS`: aliquota base de ICMS (detalha nos itens)
- `BaseICMS`: soma da base de ICMS
- `ICMS`: soma do valor de ICMS
- `RetiradoPor`: informa quem fez a retirada
- `Observ1...Observ5`: observações da nota fiscal
- `TotalAcrescimo`: valor final da nota fiscal
- `PlaKits`: planílha baixa de kits de produtos
- `TextoNF1...TextoNF10`: texto da nota de serviço
- `BaseCálculo`: não usado hoje
- `ISS`: percentual do ISS
- `VISS`: valor do ISS
- `DISS`: se tem retenção de ISS
- `IRPF`: percentual do IRRF
- `VIRPF`: valor do IRRF
- `DIRPF`: se tem retenção de IRRF
- `INSS`: percentual do INSS
- `VINSS`: valor do INSS
- `DINSS`: se tem retenção de INSS
- `PIS`: percentual do PIS
- `VPIS`: valor do PIS
- `DPIS`: se tem retenção de PIS
- `COFINS`: percentual do COFINS
- `VCOFINS`: valor do COFINS
- `DCOFINS`: se tem retenção de COFINS
- `CSLL`: percentual do CSLL
- `VCSLL`: valor do CSLL
- `DCSLL`: se tem retenção de CSLL
- `EntSai`: conjunto de caracteres que determina o comportamento da nota
- `ValorNF`: valor da nota antes da retenção de impostos
- `EmissãoFaturamento`: sem função hoje no sistema, sempre 0
- `BaseISS`: base de cálculo do ISS
- `CFOPServiços`: Código Fiscal de Operações e Prestações dos serviços em notas conjugadas
- `BIRPF`: base de cálculo do IRRF
- `BINSS`: base de cálculo do INSS
- `BPIS`: base de cálculo do PIS
- `BCOFINS`: base de cálculo do COFINS
- `BCSLL`: base de cálculo do CSLL
- `VChip`: atualmente sem uso, sempre 0
- `Dinheiro`: atualmente sem uso
- `Cheque`: atualmente sem uso
- `Cartão`: atualmente sem uso
- `Vale`: atualmente sem uso
- `Convênio`: atualmente sem uso
- `Hora`: atualmente sem uso
- `Mesa`: atualmente sem uso
- `Entregue`: atualmente sem uso
- `Turno`: atualmente sem uso
- `VencimentoNota`: data de vencimento da nota
- `VRadio`: atualmente sem uso
- `IsentoICMS`: se a nota é isenta de ICMS
- `RT`: atualmente sem uso
- `EmissãoRT`: atualmente sem uso
- `SérieRT`: atualmente sem uso
- `NotaDigital`: identifica se a nota é NFe
- `ReciboEntrega`: identificação do recido de entrega na NFe/NFCe
- `XMLNota`: XML base da NFe enviado para a Sefaz
- `EmailEnviado`: se foi enviado email do Danfe/XML na consulta da NFe
- `ErroDigital`: se ocorreu erro ao processar a nota na receita
- `VRonda`: atualmente sem uso
- `VFone`: atualmente sem uso
- `VExtras`: atualmente sem uso
- `Locação`: valor da locação de equipamentos gerado na nota fiscal (tratado como recibo)
- `CupomFiscal`: número do cupom fiscal vinculado a nota
- `DataEmissãoCupom`: data de emissão do cupom
- `ProtocoloUso`: protocolo de uso recebido da Sefaz
- `CCF`: CCF da impressora fiscal OPAF
- `GNF`: GNF da impressora fiscal OPAF
- `NumUsuarioECF`: código do usuário da impressora fiscal OPAF
- `ProcNFe`: XML da NFe com os dados de processamento da Sefaz
- `DataAutorização`: data e hora da autorização de uso da NFe
- `PercentualCréditoICMS`: percentual de crédito de ICMS gerado pela nota (empresas Simples)
- `CDC`: CDC da impressora fiscal OPAF
- `DataHoraFinalCupom`: encerramento cupom
- `CancelamentoData`: data do cancelamento da nota
- `CancelamentoProtocolo`: protocolo de cancelamento na Sefaz
- `NFLoca`: se é uma nota de cobrança mensal de locação de equipamento
- `NFESefaz`: se é uma NFe
- `ProcCancNFE`: XML do cancelamento da NFe
- `VersãoNFE`: versão gerada do XML da NFe
- `ChaveNFE`: chave de acesso da NFe
- `ObsCancelamento`: observações do cancelamento
- `CodTipoServiço`: código do tipo de serviço na NFSe
- `PréVendaOPAF`: validar se usado no OPAF
- `DataSaída`: data/hora da saída das mercadorias
- `ValorPIS`: valor do PIS
- `ValorCOFINS`: valor da PIS
- `NFReferenciada`: chave da NFe referenciada na emissão desta
- `NaturezaOperação`: natureza da operação da nota
- `NumeroDI`: documento de importação
- `DataDI`: data do documento de importação
- `LocDesembaraço`: local do desenbaraço aduaneiro
- `UFDesembaraço`: estado do desenbaraço aduaneiro
- `DataDesembaraço`: data do desenbaraço aduaneiro
- `CódigoExportador`: código do exportador
- `PlaOrcAntecipa`: planílha de antecipação do orçamento
- `BaixaAntecipa`: valor da baixa de antecipação gerada pela nota
- `PlacasFaturadas`: lista de placas faturadas na nota
- `OutrasDespesasImportação`
- `PlacasFaturadas`: lista de placas faturadas na nota
- `DadosAlteração`: usuário e data de quem alterou a nota
- `TextoErroDigital`: mensagem de erro do processamento da NFe
- `DIViaTransporte`: via de transporte do DI
- `DIAFRMM`: valor da AFRMM
- `DIIntermediario`: tipo de intermediário
- `DICNPJEnc`: CNPJ do adquirente/encomenta
- `DIUFEnc`: UF do adquirente/encomenta
- `TextoReciboLocação`: texto do recibo de locação
- `TipoISS`: tipo de ISS da nota
- `PlaSubstituta`: planílha da nota substituta
- `PlaSubstituída`: planílha da nota substituida
- `PlaCumpomFiscal`: planílha do cupom fiscal faturado
- `URLNFCe`: URL da NFCe
- `ImportadoIntegralizador`: não usado no Service
- `LoteGNREDifal`: lote de GNRE da Difal
- `LoteGNREFCP`: lote de GNRE da Difal
- `PlaNFReferenciada`: planílhas de notas referenciadas
- `EntregaCPFCNPJ`: CNPJ para o endereço de entrega da nota
- `EntregaEndereço`: endereço de entrega da nota
- `EntregaNúmero`
- `EntregaComplemento`
- `EntregaBairro`
- `EntregaCidade`
- `EntregaEstado`
- `CSAPISCOFINS`: CSA do Pis e Cofins: '01' - Não Cumulativo; '51' - Cumulativo
- `ValorSeguro`: valor do seguro na nota
- `Denegada`: indica se a NFe foi denegada
- `NúmeroReciboLocação`: número do recibo de locação
- `PlaOSVendaDireta`: planílha da OS que gerou a venda direta
- `EmailEnvio`: email de envio da NFe
- `MunicípioIncidênciaISS`
- `EstadoIncidênciaISS`
- `RetençãoComodato`: se a locação deve reter impostos federais
- `RetComPIS`: valor retido de locação com PIS
- `RetComCOFINS`: valor retido de locação com COFINS
- `RetComCSLL`: valor retido de locação com CSLL
- `RetComIR`: valor retido de locação com IRRF
- `RetComINSS`: valor retido de locação com INSS
- `BOutros`: valor base de outros impostos na nota de serviços
- `Outros`: percentual de outros impostos na nota de serviços
- `VOutros`: valor de outros impostos na nota de serviços
- `IPIDevolução`: valor do IPI de devolução 
- `IndFinal`: grava o indicador de finalidade da NFe (mesmo do XML)
- `CodFatLote`: código do faturamento em lote que gerou a NF
- `NívelPrioridade`: especificidade criada a AutoDefesa, tem a função apenas de mudar o nome do arquivo XML/Danfe
- `JustificaOutras`: justificativa para uso de CFOP de outras movimentações
- `CodPosto`: posto de serviço vinculado 
- `MunicípioPrestação`: município de prestação de serviços
- `EstadoPrestação`: estado de prestação de serviços
- `InfoFisco`: informações para o Fisco na NFe
- `OutrasDespesas`: valor de outras despesas
- `OrcVendaDireta`: orçamento faturado em venda direta (venda balcão)
- `EntregaNome`: nome no endereço de entrega da nota
- `EntregaFone`
- `EntregaCEP`
- `EntregaEmail`
- `XMLDPEC`: não utilizado
- `NFCeEnvioOff`: identifica que a NFCe foi gerada OFFLine em contingênica
- `DataContingência`: data da contingência
- `CodigoCEI`: código CEI da OS geradora
- `DestinoNota`: R - Revenda; F - Consumo final
- `Origem`: Origem do faturamento da nota
- `UsuárioCancelamentoNF`: usuário responsável pelo cancelamento da nota
- `PlaRPSVinculada`: planílha da nota vinculada nas notas de locação
- `VendaPresencial`: se a venda foi presencial
- `pISSRetido`: grava a retenção quando o caso
- `vISSRetido`: grava a retenção quando o caso
- `cAut`: código de autorização de pagamento
- `DataColeta`: data em que foram coletados os produtos da nota
- `PrevisãoEntrega`: data prevista da entrega
- `DataEntrega`: data da entrega
- `AWB`: AWB do transporte
- `LinkRastreio`: link para rastreio da entrega
- `RecebidoPor`: quem recebeu
- `UltUsuárioAlteração`: quem alterou os dados de coleta/entrega 
- `DataUltAlteração`: data da última alteração dos dados de coleta/entrega 
- `NFeWhatsEnviado`: se foi enviado Danfe e XML da NFe por Whats
- `PlaOSEmpreitada`: planílha da OS de empreitada global
- `ValorEmpreitada`: valor baixado da empreitada global
- `PlaOSEntrega`: planílha da entrega que gerou a nota na empreitada global
- `CondPagto`: condição de pagamento vinculada a nota
- **Regras:**
- Os produtos da nota fiscal são listados na tabela `EstoqueMovimento`

---

### NotasFiscaisSaídaHoras
- **Descrição:** Horas trabalhadas faturadas na Nota
- **Relacionamento:** 
- `Planílha` → `NotasFiscaisSaída.Planílha`
- `CodCliente` → `Clientes.CodCliente`
- `CodServiço` → `Serviços.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `Planílha`: planílha da nota de entrada
- `CodCliente`: código do cliente
- `CodServiço`: serviço executado
- `ValorHora`: valor da hora
- `TotalHoras`: quantidade de horas
- `TotalServiço`: valor total do serviço

---

### NotasFiscaisSaídaInutilização
- **Descrição:** Inutilizações de faixas de números de NFe
- **Relacionamento:** 
- `Empresa` → `Empresas.CodEmpresa`
- **Campos:**
- `CodInterno`: código interno PK
- `Empresa`
- `Série`: série da inutilização
- `NumInicial`: inicio da inutilização
- `NumFinal`: final da inutilização
- `Motivo`: motivo pelo qual foi inutilizado
- `DataRecibo`: data e hora do recibo gerado
- `Protocolo`: protocolo recebido pela Sefaz da inutilização
- `ProcInut`: XML do Proc da inutilização

--

### NotasFiscaisSaídaOSs
- **Descrição:** OSs vinculadas a notas de saída faturadas na retaguarda
- **Relacionamento:** 
- `PlaNF` → `NotasFiscaisSaída.Planílha`
- `PlaOS` → `OSs.Planílha`
- **Campos:**
- `CodInterno`: código interno PK
- `PlaNF`
- `PlaOS`

---

### NotasFiscaisSaídaRetornoComodato
- **Descrição:** Retornos de produtos de comodato/locação 
- **Relacionamento:** 
- `Planílha` → `NotasFiscaisSaída.Planílha`
- `PlanílhaOrigem` → `NotasFiscaisSaída.Planílha`
- **Campos:**
- `CodInterno`: código interno PK
- `Planílha`: planílha do movimento
- `PlanílhaOrigem`: planílha de origem
- `CodProduto`: código do produto
- `Quantidade`: quantidade
- `ValorFaturado`: valor total

---

### NotasFiscaisSaídaTemp
- **Descrição:** São faturamentos com prénotas, ao efetivar são geradas na NotasFiscaisSaída, os campos são os mesmos da NotasFiscaisSaída

---

### NotasServiçosAdicionais
- **Descrição:** Serviços adicionais vinculados a nota de saída
- **Relacionamento:** 
- `Planílha` → `NotasFiscaisSaída.Planílha`
- `CodServiço` → `ServiçosAdicionais.CodInterno`
- `CodFatLote` → `FaturamentosRealizados.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `Planílha`: planílha da nota
- `CodServiço`: código do serviço
- `ValorServiço`: valor do serviço
- `CodFatLote`: faturamento que gerou o registro

---

### NotasServiçosAdicionaisTemp
- **Descrição:** Serviços adicionais da prénota, mesmos campos da NotasServiçosAdicionais

---

### NSU
- **Descrição:** Não é mais utilizada

---

### OpensLigações
- **Descrição:** Ligações automáticas geradas para a OPENS (projeto encerrado)

---

### OpensRules
- **Descrição:** Ligações automáticas geradas para a OPENS (projeto encerrado)

---

### OpensRulesCodes
- **Descrição:** Ligações automáticas geradas para a OPENS (projeto encerrado)

---

### Orçamentos
- **Descrição:** Orçamentos emitidos para os clientes/prospects
- **Relacionamento:** 
- `Vendedor` → `Clientes.CodCliente`
- `Cliente` → `Clientes.CodCliente`
- `Gecom` → `Clientes.CodCliente`
- `Empresa` → `Empresas.CodEmpresa`
- `Prospect` → `Prospects.CodProspect`
- `FormaPagto` → `FormasPagto.CodFormaPagto`
- `PréOrçamento` → `PréOrçamento.CodInterno`
- `CondiçãoPagto` → `CondiçõesPagto.CodCondição`
- `Prospect` → `Prospects.CodProspect`
- `CodContato` → `ProspectsContatos.CodContato`
- `CodCampanha` → `CampanhasVenda.CodCampanha`
- `CodTabela` → `ProdutosTabelas.CodInterno`
- `MotivoCancelamento` → `DadosEntidades.CodInterno`
- `PlaCPAntecipação` → `ContasPagar.Planílha`
- `CodVeículoTrocaTitularidade` → `GRVeículos.CodInterno`
- `CodClienteOrigemTrocaTitularidade` → `Clientes.CodCliente`
- `CodVeículoGeradoTroca` → `GRVeículos.CodInterno`
- `CodCarteiraCobrança` → `DadosEntidades.CodInterno`
- `Carteira` → `DadosEntidades.CodInterno`
- `GrupoEconomico` → `DadosEntidades.CodInterno`
- `TipoÍndice` → `DadosEntidades.CodInterno`
- `CodProjeto` → `Projetos.CodProjeto`
**Status:**
- `A`: Aberto
- `P`: Aguardando aprovação/liberação do financeiro (fechado)
- `L`: Liberado aguardando abertura da OS
- `E`: Em instalação, com OSs pendentes
- `C`: Cancelado
**Modalidade:**
- `V`: Venda de equipamento
- `L`: Locação ou comodato de equipamento
- `R`: Rastreamento veicular
**EstadoCivil:**
- `A`: AMAZIADO
- `C`: CASADO
- `Q`: DESQUITADO
- `D`: DIVORCIADO
- `N`: NÃO DECLARADO
- `S`: SOLTEIRO
- `V`: VIÚVO
**EnvioBoleto:**
- `0`: Ambos
- `1`: Email
- `2`: Correio
- `3`: DDA
- **Campos:**
- `CodInterno`: código do orçamento 
- `NumOrçamento`: número do orçamento
- `Cliente`: código do cliente
- `Empresa`: empresa do orçamento
- `Emissão`: data de emissão do orçamento
- `ClienteNome`: nome do cliente ou prospect
- `CGCCPF`: CPF ou CNPJ do cliente
- `Inscrição`: Inscrição estadual do cliente ou ISENTO
- `Endereço`: endereço do cliente
- `Número`: número do endereço
- `Bairro`
- `Cidade`
- `CEP`
- `Fone`
- `Fax`
- `UF`: estado
- `Email`
- `Vendedor`: vendedor que emitiu o orçamento
- `Usuário`: usuário que emitiu o orçamento
- `Validade`: data de validade do orçamento
- `FormaPagto`: forma de pagamento vinculada
- `PréOrçamento`: préorçamento utilizado para gerar
- `Pontos`: quantidade de pontos de alarme somados dos produtos
- `Observações`: observações do fechamento do orçamento
- `Status`: status do orçamento
- `PDesconto`: percentual de desconto de produtos
- `Desconto`: valor de desconto de produtos
- `Comissão`: valor calculado de comissão
- `ValorMonitoramento`: valor da recorrência mensal proposto ao cliente (deve somar os serviços da OrçamentosServiçosAdicionais e o valor de locação)
- `TotalProdutos`: soma dos produtos do orçamento
- `TotalServiços`: soma dos serviços do orçamento
- `Planílha`: planílha do orçamento
- `Modalidade`: modalidade do orçamento
- `EmiteVenda`: flag de apoio ao financeiro
- `EmiteMonitoramento`: flag de apoio ao financeiro
- `CondiçãoPagto`: condição de pagamento escolhida no fechamento
- `Fechamento`: data de fechamento do orçamento venda/data do fechamento da venda, se estiver preenchida o orçamento foi fechado (aceito pelo cliente)
- `Liberação`: data de liberação do orçamento pelo financeiro
- `Encerramento`: data de encerramento da instalação do orçamento (todas as OSs emitidas do orçamento estão fechadas)
- `Observ`: observação do orçamento pelo vendedor
- `Fantasia`: fantasia do cliente
- `DiaVencimento`: dia de vencimento do faturamento mensal
- `Chave`: número da central designada pelo vendedor
- `PrimeiroVencimento`: data em que inicia o monitoramento informado pelo vendedor
- `ValorCREA`: valor embutido do CREA
- `ComplEndereço`: complemento do endereço do cliente
- `Celular`: celular do cliente
- `ContatoJurídica1`: nome do contato
- `Prospect`: código do prospect do orçamento
- `CodContato`: contato do prospect
- `Representante`: representante legal do cliente
- `RGCliente`: RG do cliente
- `EndereçoRepresentante`: endereço do representante
- `NumRepresentante`: número do endereço do representante
- `CidadeRepresentante`
- `RGRepresentante`
- `CPFRepresentante`
- `EstadoRepresentante`
- `BairroRepresentante`
- `HoraTeste`: hora do teste do alarme
- `Area`: área de proteção
- `FPgto`: forma de pagamento (descritivo para o contrato)
- `Telefone`: se monitora via linha telefonica
- `Radio`: se monitora via radio
- `GPRS`: se monitora via GPRS
- `TesteRadio`: tempo para o teste do Via Radio
- `Internet`: se monitora via internet/IP
- `TipoInternet`: tipo de internet (descritivo)
- `ValorGPRS`: depreciado
- `ValorRádio`: depreciado
- `HoraEmissão`: hora da emissão do orçamento
- `ValorRonda`: depreciado
- `ValorFone`: depreciado
- `ValorExtras`: depreciado
- `ValorComodato`: valor mensal da locação de equipamentos
- `ClienteNovo`: indica se o orçamento é de um cliente novo ou não
- `ServiçoEntregue`: indica se a instalação foi finalizada e o cliente está entregue e ativo
- `DataServiçoEntregue`: data em que o serviço foi entregue
- `ObsAbertura`: texto a ser impresso no orçamento
- `Gecom`: gerente comercial
- `DiaVcto`: dia de vencimento informado para novos clientes
- `PDescontoServiços`: percentual de descontos em serviços
- `DescontoServiços`: descontos em serviços
- `CEPRepresentante`: CEP do representante legal
- `Partição`: partição da central informada
- `EndereçoCobrança`: endereço de cobrança
- `NumCasaCobrança`: número do endereço de cobrança
- `BairroCobrança`
- `CidadeCobrança`
- `EstadoCobrança`
- `CEPCObrança`
- `EmailCobrança`
- `TelefoneCobrança`
- `Financiado`: indica que o equipamento foi financiado e será cobrado junto na mensalidade
- `FinanciadoMeses`: quantidade de meses do financiamento
- `FinanciadoValor`: valor mensal do financiamento
- `VeiculosQuantidade`: quantidade de veículos do orçamento
- `VeiculosMensal`: valor mensal dos veículos
- `EventosOrçamento`: log de eventos do orçamento
- `VeículosComodato`: valor mensal de locação dos equipamentos dos veículos
- `InscriçãoMunicipal`: inscrição municipal do cliente
- `CodCampanha`: campanha de comissão
- `EndereçoNF`: endereço de nota fiscal do cliente
- `NumCasaNF`: número do endereço de nota fiscal do cliente
- `BairroNF`
- `CepNF`
- `CidadeNF`
- `EstadoNF`
- `EmailNotaDigital`: endereço de email para recebimento de notas fiscais
- `VendaDireta`: identifica se o orçamento veio criado por venda direta de uma OS
- `CodTabela`: tabela de preços do orçamento
- `PlanílhaAntecipa`: planílha da nota/contas a receber da antecipação do orçamento
- `BrasPagNomeCartão`: nome do cartão do cliente para recebimento por cartão
- `BrasPagNúmeroCartão`: número do cartão
- `BrasPagCCV`: CCV
- `BrasPagExpiracao`: expiração
- `Titulo`: título do orçamento
- `TotalMensalModelo`: depreciado
- `TotalInstalaçãoModelo`: depreciado
- `MensalModelo`: depreciado
- `DataCancelamento`: data de cancelamento do orçamento
- `MotivoCancelamento`: motivo do cancelamento
- `UsuárioCancelamento`: usuário que cancelou
- `TipoServiço`: tipo de serviço
- `Favorito`: se destaca o orçamento no Kanban
- `ComplementoNF`: complemento do endereço de nota
- `VeículosSeguro`: valor de seguros dos veículos
- `VeículosAssistência`: valor de assistência dos veículos
- `ComplementoEndCobrança`: complemento do endereço de cobrança
- `EmailRepresentante`: email do representante
- `UsuárioLiberação`: quem liberou o orçamento
- `OrgãoEmissorRG`
- `DataEmissãoRG`
- `Pai`: nome do pai PF
- `Mãe`: nome da mãe PF
- `Naturalidade`: naturalidade PF
- `EstadoNaturalidade`: estado naturalidade PF
- `Nascimento`: data de nascimento PF
- `Gênero`: gênere PF
- `ObsCancelamentos`: observação cancelamento
- `UsaSigmaOndemand`: se usa ondemand
- `NãoAntecipa`: se foi liberado sem antecipação
- `ObservFat3...ObservFat5`: observações para a nota de faturamento
- `EstadoCivil`: estado civil PF
- `PlaCPAntecipação`: planílha de contas a pagar com a diferença entre o valor antecipado e faturado
- `MesesRetornoLocação`: quantidade de meses para o retorno da locação
- `ComissãoMensal`: valor calculado da comissão mensal
- `TrocaTitularidade`: se é um orçamento de troca de titularidade
- `PrazoContrato`: prazo de contrato do cliente
- `ProbabilidadeOrçamento`: percentual de probabilidade de fechamento
- `Representante2`: nome do segundo representante legal PJ
- `RGRepresentante2`
- `CPFRepresentante2`
- `EndereçoRepresentante2`
- `NumRepresentante2`
- `BairroRepresentante2`
- `CidadeRepresentante2`
- `EstadoRepresentante2`
- `CEPRepresentante2`
- `EmailRepresentante2`
- `idAceite`: id do aceite digital
- `UsuárioAbertura`: usuário que abriu o orçamento
- `DataAbertura`: data de abertura
- `HomePage`: home page da empresa
- `Profissão`: profissão do cliente
- `GsFamily`: se usa GsFamily
- `ValorEntrada`: valor combinado de entrada
- `EnvioBoleto`: forma de envio do boleto
- `Fone2`
- `ObservacoesInternas`
- `Satelital`: se monitora via satélite
- `EntregaCPFCNPJ`: CPF/CNPJ de entrada dos dados fiscais
- `EntregaEndereço`
- `EntregaNúmero`
- `EntregaComplemento`
- `EntregaBairro`
- `EntregaCidade`
- `EntregaEstado`
- `CodVeículoTrocaTitularidade`: código do veículo da troca
- `CodClienteOrigemTrocaTitularidade`: código do cliente da troca
- `CodVeículoGeradoTroca`: código do veículo novo da troca
- `FaturarVendaDireta`: identifica que o orçamento deve ser faturado em venda direta (balcão)
- `Etapa`: etapa do orçamento
- `HashTag`: hashtag vinculada ao orçamento
- `ValorFrete`: valor de frete 
- `IncardTokenInside`: token do cartão de crédito
- `IndicadoPor`: cliente quem indicou a venda
- `CodCarteiraCobrança`: carteira de cobrança
- `Carteira`: carteira do cliente
- `GrupoEconomico`: grupo economico do cliente
- `RepresentanteProfissao`: profissão do representante
- `RepresentanteEstadoCivil`
- `RepresentanteProfissao2`: profissão do segundo representante
- `RepresentanteEstadoCivil2`
- `ADBVendaProjeto`: campo personalizado para a ADB, sem função no sistema
- `ADBCustoProjeto`: campo personalizado para a ADB, sem função no sistema
- `ADBEBTIDAVendaPerc`: campo personalizado para a ADB, sem função no sistema
- `ADBEBTIDAVenda`: campo personalizado para a ADB, sem função no sistema
- `ADBEBTIDALocaPerc`: campo personalizado para a ADB, sem função no sistema
- `ADBEBTIDALoca`: campo personalizado para a ADB, sem função no sistema
- `ADBValorManutencao`: campo personalizado para a ADB, sem função no sistema
- `ADBValorLoca`: campo personalizado para a ADB, sem função no sistema
- `VencimentoPor`: 1 - por condições; 2 - fixado
- `NParcelas`: parcelas quando fixado
- `VencInt`: 1 - por dias; 2 - por mês quando fixado
- `VencDias`: a cada quantos dias quando VencInt=1
- `TipoÍndice`: tipo de índice de reajuste
- `SeguroCodAtividade`: código de atividade para o seguro
- `OptanteSimplesNacional`: se o cliente é simples
- `EmpreitadaGlobal`: se vai tratar como empreitada global (ADB)
- `CodProjeto`: código do projeto vinculado
- `PropostaLocacao`: se o orçamento tem também proposta de locação
- `OpcoesLocacao`: lista de opções de meses de parcelamento da locação

---

### OrçamentosCondições
- **Descrição:** Condições de pagamento vinculadas ao orçamento
- **Relacionamento:** 
- `Planílha` → `Orçamentos.Planílha`
- `Condição` → `CondiçõesPagto.CodCondição`
- **Campos:**
- `CodInterno`: código interno PK
- `Planílha`
- `Condição`

---

### OrçamentoServiços
- **Descrição:** Serviços do Orçamento
- **Relacionamento:** 
- `Planílha` → `Orçamentos.Planilha`
- `CodServiço` → `Serviços.CodServiço`
- **Campos:**
- `CodInterno`: código interno PK
- `CodServiço`: código do serviço
- `Quantidade`: quantidade do serviço
- `Unitário`: valor unitário do serviço
- `Total`: valor total do serviço
- `CobraLocado`: indica se o serviço é cobrado ao cliente
- `Planílha`:planílha do orçamento
- `Descrição`: nome do serviço
- `ContaPontos`: se a quantidade será a de pontos do orçamento
- `Custo`: custo unitário do serviço
- `CustoTotal`: custo total do serviço
- `Bruto`: valor unitário sem desconto
- `TotalBruto`: valor total sem desconto
- `GrupoOrçamento`: nome do grupo do orçamento
- `PreçoReal`: preço de venda atual

---

### OrçamentosHashtags
- **Descrição:** Etiquetas em orçamentos
- **Relacionamento:** 
- `Planílha` → `Orçamentos.Planilha`
- `CodHashTag` → `Hashtags.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `Planílha`
- `CodHashTag`

---

### OrçamentosHashtags
- **Descrição:** Etiquetas em orçamentos
- **Relacionamento:** 
- `Planílha` → `Orçamentos.Planilha`
- `CodHashTag` → `Hashtags.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `Planílha`
- `CodHashTag`

---

### OrçamentosProdutos
- **Descrição:** Produtos do Orçamento
- **Relacionamento:** 
- `Planílha` → `Orçamentos.Planilha`
- `CodProduto` → `Produtos.CodProduto`
- **Campos:**
- `CodInterno`: código interno PK
- `CodProduto`: código do produto
- `Quantidade`: quantidade do produto
- `Unitário`: valor unitário do produto sem desconto
- `Total`: valor total do produto sem desconto
- `Líquido`: valor unitário do produto com desconto
- `TotalLiquido`: valor total do produto com desconto
- `CobraLocado`: se cobra o produto nas locações
- `CustoGerencial`: custo gerencial do produto
- `Planílha`: planílha do orçamento
- `Descrição`: nome do produto
- `ContaPontos`: se soma os pontos do produto ao orçamento
- `QuantidadePontos`: quantidade de pontos do produto
- `QtdadeSugerida`: quantidade sugerida
- `VlrInstalação`: depreciado
- `VlrMensal`: depreciado
- `ImportadoPedido`: se foi importado para pedido de compras
- `PreçoReal`: preço ao gravar
- `GrupoOrçamento`: grupo do orçamento ao qual pertence
- `LocalInstalação`: local onde será instalado

---

### OrçamentosProdutosRetirar
- **Descrição:** Produtos a Retirar do Orçamento
- **Relacionamento:** 
- `Planílha` → `Orçamentos.Planilha`
- `CodProduto` → `Produtos.CodProduto`
- **Campos:**
- `CodInterno`: código interno PK
- `Planílha`: planílha do orçamento
- `CodProduto`: código do produto
- `Descrição`: nome do produto
- `Quantidade`: quantidade do produto
- `Unitário`: valor unitário do produto
- `Total`: valor total do produto
- `Motivo`: motivo da retirada (Locado)
- `ValorDescontoLic`: valor de desconto da licença (Porter)

---

### OrçamentosServiçosAdicionais
- **Descrição:** Serviços adicionais do Orçamento - Serviços adicionais SÃO cobrados mensalmente em recorrência propostos ao cliente
- **Relacionamento:** 
- `Planílha` → `Orçamentos.Planilha`
- `CodServiço` → `ServiçosAdicionais.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `Planílha`: planílha do orçamento
- `CodServiço`: código do serviço
- `ValorServiço`: valor mensal do serviço
- `Manutenção`: se terá manutenção
- `Observações`: observações
- `Quantidade`: quantidade do serviço
- `DescontoTotal`: desconto total
- `CustoServAD`: custo do serviço na gravação

---

### OrçamentosValores
- **Descrição:** Registros de gravação do orçamento com seu valor no momento (fornece um histórico de negociação com o cliente ao vendedor)
- **Relacionamento:** 
- `Orçamento` → `Orçamentos.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `Orçamento`: código do orçamento
- `Data`: momento da gravação
- `ValorMonitoramento`: valor mensal
- `TotalProdutos`: valor de produtos
- `TotalServiços`: valor de serviços
- `Comissão`: comissão calculada
- `PDesconto`: percentual de desconto
- `Desconto`: valor de desconto
- `Usuário`: usuário que gravou
- `ComissãoMensal`: valor da comissão da mensalidade

---

### OrçamentosVeículos
- **Descrição:** Veículos incluídos no orçamento
- **Relacionamento:** 
- `TipoVeículo` → `DadosEntidades.CodInterno`
- `Planílha` → `Orçamentos.Planílha`
- `SistemaRastreamento` → `DadosEntidades.CodInterno`
- `Bloqueio` → `DadosEntidades.CodInterno`
- `TécnicoVeículo` → `Clientes.CodCliente`
- `SeguroCodPlano` → `SeguradorasPlanos.CodInterno`
- `CodVeiculoAltera` → `GRVeículos.CodInterno`
- **Combustível:**
- `G`: Gasolina
- `A`: Etanol
- `B`: BiCombustível
- `D`: Diesel
- `N`: GNV
- `E`: Elétrico
- `H`: Híbrido
- **Campos:**
- `CodInterno`: código interno PK
- `Planílha`: planílha do orçamento
- `Placa`: placa do veículo
- `Observações`
- `Modelo`: modelo do veículo
- `Combustível`: tipo de combustível
- `Ano`: ano do veículo
- `Cor`: cor do veículo
- `Renavam`: número do Renavam
- `Chassis`: número do Chassis
- `LocalizaçãoMódulo`: local do módulo
- `Bloqueio`: tipo de bloqueio
- `Panico`: possui botão de panico
- `DataVencimentoContrato`: quando encerra o contrato
- `Seguro`: se usa seguro
- `ValorSeguro`: valor do seguro
- `Assistência`: se usa assistência
- `ValorAssistência`: valor da assistência
- `UsaBloqueio`: se usa bloqueio
- `ValorBloqueio`: valor do bloqueio
- `ReleInvertido`: se tem rele invertido
- `ValorRastreamento`: valor mensal do veículo
- `ValorLocação`: valor mensal de locação do veículo
- `Voltagem`: voltagem do veículo 12/24v
- `TipoVeículo`: tipo de veículo
- `SistemaRastreamento`: sistema de rastreamento
- `ObsVeículo`
- `SeguroCodPlano`: código do plano de seguro
- `SeguroNomeSegurado`
- `SeguroCPFSegurado`
- `SeguroNascimentoSegurado`
- `SeguroInícioVigência`
- `SeguroFimVigência`
- `CodVeiculoAltera`: código do veículo alterado
- `Apelido`: apelido do veículo

---

### OrçamentosVeículos
- **Descrição:** Veículos a retirar no orçamento
- **Relacionamento:** 
- `Planílha` → `Orçamentos.Planílha`
- `CodVeículo` → `GRVeículos.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `Planílha`: planílha do orçamento
- `CodVeículo`

---

### OrçamentosVeículosServiçosAdicionais
- **Descrição:** Serviços adicionais atribuídos a veículos no orçamento
- **Relacionamento:** 
- `Planílha` → `Orçamentos.Planílha`
- `CodVeículoOrc` → `GRVeículos.CodInterno`
- `CodServiço` → `ServiçosAdicionais.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `Planílha`: planílha do orçamento
- `CodVeículoOrc`
- `CodServiço`
- `ValorServiço`: valor do serviço adicional

---

### OrçamentosVeículosTemp
- **Descrição:** Tabela temporária que apenas apóia o funcionamento em algumas telas

---

### OrçamentosVeículosTempServiçosAdicionais
- **Descrição:** Tabela temporária que apenas apóia o funcionamento em algumas telas

---

### OrçamentosVendedoresAdicionais
- **Descrição:** Outros vendedores vinculados ao orçamento que dividem a comissão
- **Relacionamento:** 
- `Planílha` → `Orçamentos.Planílha`
- `Vendedor` → `Clientes.CodCliente`
- **Campos:**
- `CodInterno`: código interno PK
- `Planílha`: planílha do orçamento
- `Vendedor`
- `Percentual`: percentual da comissão atribuida ao vendedor

---

### OrçamentosVendedoresAuxiliares
- **Descrição:** Não usada no sistema

---

### OSAtendimentos
- **Descrição:** Atendimentos do técnico feitos em OSs
- **Relacionamento:** 
- `Planílha` → `OSs.Planílha`
- `Técnico` → `Clientes.CodCliente`
- **TipoAtendimento:**
- ` `: Técnico
- `A`: Avaliação Supervisor
- `C`: Acompanhamento Supervisor
- `D`: Diesel
- `E`: Enceramento Supervisor
- `D`: Deslocamento
- **Campos:**
- `CodInterno`: código interno PK
- `Planílha`: planílha da OS
- `Data`: data da visita
- `HoraInicial`: hora de chegada
- `HoraFinal`: hora de saída
- `Técnico`
- `Observações`: observações da visita
- `MobileResponsável`: responsável pela visita
- `TipoAtendimento`: responsável pela visita
- `CodParecer`: depreciado
- `Parecer`: depreciado
- `CodVeículo`: depreciado
- `UsuárioLcto`: quem lançou
- `DataHoraLcto`: quando lançou
- `UsuárioUltAltera`: quem alterou
- `DataHoraUltAltera`: quando alterou

---

### OSBaixaPlano
- **Descrição:** Baixas de uso de pacotes de serviço
- **Relacionamento:** 
- `Planílha` → `OSs.Planílha`
- `CodPlano` → `PacotesServiçosControle.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `Planílha`: planílha da OS
- `CodPlano`: código do controle
- `Quantidade`: quantidade a baixar

---

### OSCheckLists
- **Descrição:** CheckLists criados para OSs (Preenchidos no mobile)
- **Relacionamento:** 
- `Unidade` → `Unidades.CodUnidade`
**Operação:**
- `A`: Ampliação
- `I`: Interna
- `M`: Manutenção
- `P`: Preventiva
- `R`: Retirada de Equipamentos/Cancelamento de Contrato
- `V`: Vendas Instalação
- **Campos:**
- `CodInterno`: código interno PK
- `Operação`: operação da OS que usará o checklist
- `Título`: nome do checklist
- `Ativo`: se está ativo
- `Unidade`: unidade vinculada
- `LogAlterações`: alterações feitas
- `OSSupervisor`: se utiliza no OSSupervisor

---

### OSCheckListsPerguntas
- **Descrição:** Perguntas do checklist
- **Relacionamento:** 
- `CodCheckList` → `OSCheckLists.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `CodCheckList`: código do checklist
- `Pergunta`: pergunta a ser feita
- `ExigeFoto`: se exige foto
- `Descritiva`: se é descritiva
- `NaoExigeDescrNegativa`: se não exige descrição negativa

---

### OSCheckListsRespostas
- **Descrição:** Respostas do checklist
- **Relacionamento:** 
- `Planílha` → `OSs.Planílha`
- `CodPergunta` → `OSCheckListsPerguntas.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `Planílha`: planílha da OS
- `CodPergunta`: pergunta feita
- `Resposta`: se respondeu
- `Detalhes`: detalhes da resposta
- `Usuário`: quem respondeu
- `DataPreenchimento`: quando foi preenchido

---

### OsCheckListsVeiculosPerguntas
- **Descrição:** Checklists de veículos a serem verificados
- **Campos:**
- `CodPergunta`: código da pergunta
- `Descricao`: descrição

---

### OsCheckListsVeiculosRespostas
- **Descrição:** Respostas de checklist de veículos
- **Relacionamento:** 
- `CodOS` → `OSs.CodInterno`
- `CodTecnico` → `Clientes.CodCliente`
- `CodVeiculo` → `GRVeículos.CodInterno`
- `CodPergunta` → `OsCheckListsVeiculosPerguntas.CodPergunta`
- **Campos:**
- `CodInterno`: código interno PK
- `CodTecnico`
- `CodOS`
- `CodVeiculo`
- `CodPergunta`
- `AntesInstalacao`: se estava ok antes da instalação
- `DepoisInstalacao`: se ficou ok depois da instalação
- `NaoTem`: se não tem o item
- `Usuário`: quem preencheu o checklist
- `DataPreenchimento`: quando preencheu

---

### OSConfirmaçãoRetirada
- **Descrição:** depreciado

---

### OSContasReceber
- **Descrição:** Vencimentos de contas a receber combinados em OS
- **Relacionamento:** 
- `Planílha` → `OSs.Planílha`
- **Campos:**
- `CodInterno`: código interno PK
- `Planílha`
- `Vencimento`
- `Valor`

---

### OSControleAcesso
- **Descrição:** Controla o acesso concorrente da OS em telas ou computadores diferentes
- **Relacionamento:** 
- `Planílha` → `OSs.Planílha`
- **Campos:**
- `CodInterno`: código interno PK
- `Planílha`
- `Acesso`: data de acesso
- `Usuário`: quem acessou
- `Módulo`: tela
- `Liberação`: quando liberou
- `Liberado`: se liberado o acesso
- `UsuárioDesbloqueio`: usuário que excluiu o bloqueio

---

### OSDeduções
- **Descrição:** Deduções de ISS
- **Relacionamento:** 
- `PlanílhaOS` → `OSs.Planílha`
- `PlanílhaNota` → `NotasFiscaisSaída.Planílha`
- **Campos:**
- `CodInterno`: código interno PK
- `PlanílhaOS`
- `PlanílhaNota`
- `ValorDedução`: valor da dedução

---

### OsEntregas
- **Descrição:** Entregas/Retiradas/Devoluções de produtos na OS
- **Relacionamento:** 
- `PlanílhaOS` → `OSs.Planílha`
- `PlanílhaEntrega` → `EstoqueMovimento.Planílha/NotasFiscaisSaída.Planílha`
- `CodProduto` → `Produtos.CodProduto`
- `TipoEstoque` → `TiposEstoque.CodEstoque`
- `EstoqueOrigem` → `TiposEstoque.CodEstoque`
**Tipo:**
- `E`: Entrega
- `D`: Devolução
- `C`: Eliminação do produto a entregar
- `R`: Retirada
- `M`: Cancelamento de retirada
- `T`: Eliminação do produto a retirar
- **Campos:**
- `CodInterno`: código interno PK
- `PlanílhaOS`
- `PlanílhaEntrega`
- `CodProduto`
- `DescreveProduto`
- `Entregando`: valor sendo movimentado
- `DataEntrega`: data da ocorrência
- `Usuário`: quem fez o movimento
- `TipoEstoque`: tipo de estoque movimentado
- `Motivo`: motivo da entrega/retirada
- `QuantidadeOS`: quantidade total do item na OS
- `SaldoOS`: saldo do item na OS
- `EstoqueOrigem`: estoque de origem
- `AssinaMobile`: se assinado no mobile
- `AutorizadoAPP`: se autorizado no mobile
- `ObservEntrega`: observações
- `MotivoNãoAutoriza`: motivo de não autorização

---

### OSEntregaSelecionados
- **Descrição:** Dados temporários que apoiam algumas telas

---

### OSFinanciamentos
- **Descrição:** Valor de financiamentos de produtos em OSs
- **Relacionamento:** 
- `PlanílhaOS` → `OSs.Planílha`
- **Campos:**
- `CodInterno`: código interno PK
- `PlanílhaOS`
- `ValorParcela`: valor mensal do financiamento
- `Crédito`: valor total do financiamento
- `Débito`: valor recebido do financiamento
- `Saldo`: valor a receber do financiamento

---

### OSFinanciamentosMovimento
- **Descrição:** Notas geradas faturando a mensalidade do financiamento
- **Relacionamento:** 
- `PlanílhaOS` → `OSs.Planílha`
- `PlanílhaNota` → `NotasFiscaisSaída.Planílha`
- `CodFatLote` → `FaturamentosRealizados.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `PlanílhaOS`
- `PlanílhaNota`
- `ValorParcela`
- `CodFatLote`

---

### OSImportação
- **Descrição:** Registra as importações de orçamentos para OSs
- **Relacionamento:** 
- `PlanílhaOrçamento` → `Orçamentos.Planílha`
- `PlanílhaOS` → `OSs.Planílha`
**TipoItem:**
- `I`: Importação (apenas determina que foi importado)
- `P`: Produto
- `S`: Serviço
- `R`: Produtos a retirar
- `V`: Veículos a instalar
- `X`: Veículos a retirar
- **Campos:**
- `CodInterno`: código interno PK
- `PlanílhaOrçamento`
- `PlanílhaOS`
- `TipoItem`
- `CodItem`: código PK do item relacionado
- `QtdadeImportada`: quantidade do item importado
- `OrcProdCodInterno`: se refere ao CodInterno da tabela OrçamentosProdutos, OrçamentoServiços ou afins

---

### OSImportaçãoCompras
- **Descrição:** Registra a importação de itens da OS para processos de compras
- **Relacionamento:** 
- `PlanílhaOS` → `OSs.Planílha`
- `CodProduto` → `Produtos.CodProduto`
**Tipo:**
- `P`: Pedido
- `A`: Avulso
- `C`: Cotação
- **Campos:**
- `CodInterno`: código interno PK
- `PlanílhaOS`
- `PlanílhaImportação`: identifica o pedido/cotação
- `Tipo`: tipo de importação
- `CodProduto`: código do produto
- `Usuário`: quem importou
- `DataImportação`: data da importação

---

### OSLaudos
- **Descrição:** Laudos para troca de produtos
- **Relacionamento:** 
- `Planílha` → `OSs.Planílha`
- `Produto` → `Produtos.CodProduto`
**Status:**
- `A`: A Avaliar
- `X`: Aceito - Produto foi para troca
- `C`: Não Aceito
- **Campos:**
- `CodInterno`: código interno PK
- `Planílha`
- `DataLaudo`: data do laudo
- `UsuárioLaudo`: quem gerou o laudo
- `Laudo`: problema apontado
- `Produto`: produto com problema
- `Quantidade`: quantidade de itens
- `Status`: status do laudo
- `DataAvaliação`: data da avaliação
- `UsuárioAvaliação`: quem avaliou
- `Avaliação`: parecer
- `Motivo`: motivo da troca (Locado, Garantia...)

---

### OSNotificações
- **Descrição:** Manipulado pelo OSMobile

---

### OSObrigatoriedadeCheck
- **Descrição:** Configura a obrigação do checklist por tipo de OS e unidade
- **Relacionamento:** 
- `CodUnidade` → `Unidades.CodUnidade`
**Tipo:**
- `A`: Ampliação
- `I`: Interna
- `M`: Manutenção
- `P`: Preventiva
- `R`: Retirada de Equipamentos/Cancelamento de Contrato
- `V`: Vendas Instalação
**Obrigatoriedade:**
- ` `: Padrão
- `0`: Não Obrigatório
- `1`: Obrigatório
- **Campos:**
- `CodInterno`: código interno PK
- `CodUnidade`
- `TipoOS`: tipo de OS
- `Obrigatoriedade`: obrigatoriedade de preenchimento

---

### OSProblemas
- **Descrição:** Problemas relatados em OSs
- **Relacionamento:** 
- `PlanílhaOS` → `OSs.Planílha`
- `Problema` → `DadosEntidades.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `PlanílhaOS`
- `DataInicial`: quando ocorreu o problema
- `DataFinal`: quando ocorreu a solução
- `Problema`: tipo de problema
- `Pendência`: relato do problema
- `Origem`: C - Cliente; E - Empresa
- `Usuário`: quem registrou o problema
- `DataCadastro`: quando foi registrado

---

### OSProdutos
- **Descrição:** Produtos da OS
- **Relacionamento:** 
- `Planílha` → `OSs.Planilha`
- `CodProduto` → `Produtos.CodProduto`
- `OrcProdCodInterno` → `OrçamentosProdutos.CodInterno`
**Motivo:**
- `Direta`: Venda direta para cliente
- `Emprestimo`: Emprestimo de produto
- `Garantia`: Troca em garantia
- `Gratifica`: Brindes
- `Interno`: Produto de uso interno
- `Locado`: Locação
- **Campos:**
- `CodInterno`: código interno PK
- `Planílha`: planílha da OS
- `CodProduto`: código do produto
- `Descrição`: nome do produto
- `Quantidade`: quantidade do produto
- `Liquido`: valor unitário do produto
- `TotalLiquido`: valor total do produto
- `Custo`: custo unitário do produto 
- `CobraCliente`: indica se o produto é cobrado ao cliente
- `Unitário`: valor unitário do produto sem desconto
- `Total`: valor total do produto sem descontos
- `Entregue`: quantas unidades do produto já foram entregues ao cliente
- `Motivo`: motivo de não cobrança do produto quando CobraCliente=0
- `PedidoFornecedor`: numero do pedido no fornecedor
- `PedidoItem`: item do pedido do fornecedor
- `OrcProdCodInterno`: codigo interno do produto no orçamento 
- `MotivoInclusão`: motivo da inclusão do item 
- `UsuárioInclusão`: quem incluiu
- `DataInclusão`: quando incluiu
- `DataUltimaAlteração`: quando alterou
- `UsuárioAlteração`: quem alterou

---

### OSProdutosKit
- **Descrição:** Tabela temporária usada em algumas telas

---

### OSProdutosRetirar
- **Descrição:** Produtos a retirar da OS
- **Relacionamento:** 
- `Planílha` → `OSs.Planilha`
- `CodProduto` → `Produtos.CodProduto`
**Motivo:**
- `Vendido`: Venda 
- `Emprestimo`: Emprestimo de produto
- `Garantia`: Troca em garantia
- `Interno`: Produto de uso interno
- `Locado`: Locação
- `Manutencao`: Para conserto
- **Campos:**
- `CodInterno`: código interno PK
- `Planílha`: planílha da OS
- `CodProduto`: código do produto
- `Descrição`: nome do produto
- `Quantidade`: quantidade do produto
- `Unitário`: valor unitário do produto
- `Total`: valor total do produto
- `Entregue`: quantas unidades do produto já foram retiradas ao cliente
- `Motivo`: motivo da retirada
- `Efetivados`: depreciado
- `Integrados`: depreciado
- `Descartados`: depreciado

---

### OSRequisições
- **Descrição:** depreciado

---

### OSs (Ordens de Serviço)
- **Descrição:** Ordens de serviço.
- **Relacionamento:** 
- `Cliente` → `Clientes.CodCliente`
- `Técnico` → `Clientes.CodCliente`
- `Vendedor` → `Clientes.CodCliente`
- `Gecom` → `Clientes.CodCliente`
- `CodCausa` → `DadosEntidades.CodInterno`
- `CodSolução` → `DadosEntidades.CodInterno`
- `Planílha` → `NotasFiscaisSaída.Planílha`
- `PlaService` → `NotasFiscaisSaída.Planílha`
- `PlaComodato` → `NotasFiscaisSaída.Planílha`
- `PlaGarantia` → `NotasFiscaisSaída.Planílha`
- `PlaBrinde` → `NotasFiscaisSaída.Planílha`
- `PlaRetComodato` → `NotasFiscaisSaída.Planílha`
- `CodVeículo` → `GRVeículos.CodInterno`
- `CodCampanha` → `CampanhasVenda.CodCampanha`
- `CodTabela` → `ProdutosTabelas.CodInterno`
- `Getec` → `Clientes.CodCliente`
- `PlaOrcVendaDireta` → `Orçamentos.Planílha`
- `IDDefeitoSigma` → `EntidadesSigma.CodSigma` onde Entidade=D
- `MotivoExclusãoVeículo` → `DadosEntidades.CodInterno`
- `CodDDP` → `OSsDDPs.CodInterno`
- `EmpresaSigma` → `ConexãoSigma.CodInterno`
- `FechamentoFormaPagto` → `FormasPagto.CodFormaPagto`
- `FechamentoCondiçãoPagto` → `CondiçõesPagto.CodCondição`
- `CodSolução` → `DadosEntidades.CodInterno`
- `PlaEmprestimo` → `NotasFiscaisSaída.Planílha`
- `PlaRetEmprestimo` → `NotasFiscaisSaída.Planílha`
- `PlaRetGarantia` → `NotasFiscaisSaída.Planílha`
- `CentroCusto` → `DadosEntidades.CodInterno`
- `CodCheckList` → `OSCheckLists.CodInterno`
- `LiberaComissãoPlanílha` → `ContasPagar.Planílha`
- `Etapa` → `DadosEntidades.CodInterno`
- `CodEndereço` → `ClientesEndereços.CodInterno`
- `CodContaPortaria` → `ClientesPortaria.CodInterno`
- `SLACodigo` → `SLAOSs.CodRegra`
- `CodProjeto` → `Projetos.CodProjeto`
- **Status:**
- `A`: aberta
- `B`: fechada
- `F`: faturada
- `C`: cancelada
- **Prioridade:**
- `A`: alta
- `N`: normal
- `B`: baixa
**Tipo:**
- `A`: Ampliação
- `I`: Interna
- `M`: Manutenção
- `P`: Preventiva
- `R`: Retirada de Equipamentos/Cancelamento de Contrato
- `V`: Vendas Instalação
**Modalidade:**
- `V`: Venda
- `L`: Locação
- `R`: Rastreamento
**OrdemProdutos:**
- `0`: Ordem padrão, por inserção
- `1`: Alfabética do nome do produto
- `2`: Código do produto
- **Campos:**
- `CodInterno`: código interno PK
- `Empresa`: empresa da OS
- `Status`: status da OS
- `Tipo`: tipo da OS
- `Prioridade`: prioridade da OS
- `Ordem`: número da OS
- `Cliente`: código do cliente
- `DataAbertura`: data de abertura da OS
- `DataFechamento`: data de fechamento da OS
- `DataFaturamento`: data de faturamento da OS
- `NFProdutos`: número da nota de produtos do faturamento da OS
- `SérieProdutos`: série da nota de produtos
- `NFServiços`: número da nota de serviços do faturamento da OS
- `SérieServiços`: série da nota de produtos
- `Observações`: Descrição dos serviços a serem executados na OS
- `Orçamento`: número do orçamento vinculado
- `Usuário`: quem gravou a OS
- `MotivoCancelamento`: motivo de cancelamento da OS
- `TotalProdutos`: soma dos produtos da OS
- `TotalServiços`: soma dos serviços da OS
- `Planílha`: código da planilha
- `ObservaçõesFechamento`: Descrição dos serviços que foram executados na OS
- `Vendedor`: código do vendedor
- `Técnico`: código do técnico
- `Modalidade`: modalidade da OS
- `DataEntrega`: data limite para fechar a OS sem atraso
- `PDesconto`: percentual de desconto em produtos
- `Desconto`: valor de desconto em produtos
- `Comissão`: comissão calculada da OS
- `DataCancelamento`: data de cancelamento da OS
- `PlaKit`: planílha da decomposição de Kits
- `FaturadoPeças`: se gerou a nota de produtos
- `FaturadoServiços`: se gerou a nota de serviços
- `PlaService`: código da planílha da nota de serviços
- `OSSigma`: código PK da OS no monitoramento
- `Responsável`: responsável pela OS
- `CentralSIGMA`: id da central no monitoramento
- `ValorCREA`: valor do CREA a ser embutido na OS importado do orçamento
- `Garantia`: se garantia os serviços não geram valores a receber aos técnicos
- `UsuárioFechamento`: quem fechou a OS
- `PlaComodato`: planílha da nota de comodato/locação dos produtos
- `NFComodato`: número da nota de comodato/locação
- `SérieComodato`: série da nota de comodato/locação
- `DataComodato`: data de emissão da nota de comodato/locação
- `Agendada`: indica se a OS foi agendada com o cliente ou não
- `DataAgenda`: data do inicio da agenda
- `HoraAgenda`: hora do inicio da agenda
- `DuraçãoAgenda`: tempo que vai demorar para executar o serviço
- `FimAgenda`: HoraAgenda+DuraçãoAgenda (adiciona a DataAgenda para saber o término)
- `ProblemaCliente`: depreciado
- `PendênciaCliente`: depreciado
- `ProblemaEmpresa`: depreciado
- `PendênciaEmpresa`: depreciado
- `DataProblema`: depreciado
- `ImportadoDireta`: se foi importada de venda direta (permite só venda)
- `Gecom`: gerente comercial
- `CodCausa`: código da causa da OS
- `HoraFechamento`: hora do fechamento da OS
- `Impressa`: se a OS foi impressa
- `Solicitante`: quem foi o solicitante da OS
- `PDescontoServiços`: percentual de desconto em serviços
- `DescontoServiços`: valor de desconto em serviços
- `Partição`: partição da central do cliente
- `PlaFechamento`: planílha de fechamento (liga movimentos feitos no fechamento)
- `Frete`: valor do frete embutido (vem do orçamento)
- `DataProcessamento`: data do processamento da OS
- `CodVeículo`: veículo para o qual foi aberta a OS
- `PagoTécnico`: se foi liberado pagamento para o técnico
- `PagoTécnicoEm`: data de liberação do pagamento
- `PagoTécnicoPor`: quem liberou
- `PagoTécnicoObs`: observações da liberação
- `PagoTécnicoValor`: valor liberado para pagamento
- `PlaGarantia`: planílha da nota de garantia
- `NFGarantia`: número da nota de garantia
- `SérieGarantia`: série da nota de garantia
- `DataGarantia`: data de emissão da nota de garantia
- `PlaBrinde`: planílha da nota de brinde
- `NFBrinde`: número da nota de brinde
- `SérieBrinde`: série da nota de brinde
- `DataBrinde`: data de emissão da nota de brinde
- `FaturaCROS`: se permite faturar o contas a receber em qualquer tempo
- `CodCampanha`: campanha de vendas
- `PlanílhaAntecipação`: planílha da antecipação faturada
- `CodTabela`: tabela de preço da OS
- `EventosOS`: log de eventos da OS
- `LogosVlrServiços`: criado a pedido de cliente específico, sem função no sistema
- `LogosVlrOutros`: criado a pedido de cliente específico, sem função no sistema
- `LogosVlrLogosCidadeServiços`: criado a pedido de cliente específico, sem função no sistema
- `PlaRetComodato`: planílha da nota de retorno de comodato/locação
- `NFRetComodato`: número da nota de retorno de comodato/locação
- `SérieRetComodato`: série da nota de retorno de comodato/locação
- `DataRetComodato`: data de emissão de retorno de comodato/locação
- `Getec`: gerente técnico
- `PlaOrcVendaDireta`: planílha do orçamento de venda direta gerado pela OS (produtos não retirados)
- `MobileEncerrada`: identifica se OS foi fechada no OSMobile
- `MobileEncerramento`: data em que OS foi fechada no OSMobile
- `IDDefeitoSigma`: ID do defeito no Monitoramento
- `DefeitoSigma`: descrição do defeito encontrado na OS
- `MotivoExclusãoVeículo`: código do motivo de cancelamento do veículo
- `EncodeAssinatura`: encode do arquivo de assinatura, gravado pelo OSMobile
- `CodDDP`: código do DDP gerado
- `EmpresaSigma`: configuração da integração com o monitoramento
- `ART`: número da ART
- `ARTUsuário`: quem gravou a ART
- `ARTGeração`: quando gravou a ART
- `FaturadoCRProdutos`: se faturou contas a receber de produtos quando em qualquer tempo
- `FaturadoCRServiços`: se faturou contas a receber de serviços quando em qualquer tempo
- `FaturadoCR`: se tem os contas a receber faturados
- `FechamentoFormaPagto`: forma de pagamento incluída quando não vem de orçamento
- `FechamentoCondiçãoPagto`: condição de pagamento incluída quando não vem de orçamento
- `CodSolução`: solução encontrada para o defeito
- `PlaEmprestimo`: planílha da nota de empréstimo
- `NFEmprestimo`: número da nota de empréstimo
- `SérieEmprestimo`: série da nota de empréstimo
- `DataEmprestimo`: data de emissão de empréstimo
- `PlaRetEmprestimo`: planílha da nota de retorno de empréstimo
- `NFRetEmprestimo`: número da nota de retorno de empréstimo
- `SérieRetEmprestimo`: série da nota de retorno de empréstimo
- `DataRetEmprestimo`: data de emissão de retorno de empréstimo
- `CodigoObra`: código da Obra na ART
- `PlaRetGarantia`: planílha da nota de retorno de garantia
- `NFRetGarantia`: número da nota de retorno de garantia
- `SérieRetGarantia`: série da nota de retorno de garantia
- `DataRetGarantia`: data de emissão de retorno de garantia
- `UsuárioProcessamento`: quem processou a OS
- `PagoSeparado`: se a OS tem técnicos auxiliares e gerou pagamento para eles
- `TrocaTitularidade`: se a OS é de troca de titularidade
- `CentroCusto`: centro de custo da OS (informativo, não são os centros de custos financeiros)
- `CodCheckList`: código do checklist da OS
- `IdNotificacaoMobile`: não utilizado pelo Service
- `BaixaAvulsaRetEmprestimo`: data da baixa avulsa de retorno de empréstimo
- `BaixaAvulsaRetGarantia`: data da baixa avulsa de retorno de garantia
- `BaixaAvulsaRetComodato`: data da baixa avulsa de retorno de comodato/locação
- `BaixaAvulsaComodato`: data da baixa avulsa de comodato/locação
- `BaixaAvulsaGarantia`: data da baixa avulsa de garantia
- `BaixaAvulsaBrinde`: data da baixa avulsa de brinde
- `BaixaAvulsaEmprestimo`: data da baixa avulsa de empréstimo
- `LiberaComissãoPlanílha`: planílha da liberação do pagamento aos técnicos, controla contas a pagar etc
- `SigmaCloudID`: id da OS no monitoramento
- `Etapa`: etapa da OS
- `CodEndereço`: endereço da OS, se 0 é o mesmo do cliente
- `OrdemProdutos`: ordem dos produtos na OS
- `ObservacoesInternas`: observações internas da OS, não constam para o cliente
- `DataReabertura`: se a OS fechada foi reaberta, regsistra a data
- `UsuárioReabertura`: quem reabriu a OS
- `MotivoReabertura`: porque reabriu a OS
- `ReferenciaSigma`: referencia do endereço no monitoramento
- `EmailFechamentoEnvio`: se enviou email para o cliente no fechamento, a data/hora que o fez
- `SolucxCod`: código da Solucx de registro
- `CodContaPortaria`: código da portaria vinculada
- `ValorFrete`: valor do frete da OS
- `FechamentoVencimentoPor`: 1 - por condições; 2 - fixado (forma de vencimento quando não tem orçamento)
- `FechamentoVencimento1`: primeiro vencimento
- `FechamentoNParcelas`: parcelas quando fixado
- `FechamentoVencInt`: 1 - por dias; 2 - por mês quando fixado
- `FechamentoVencDias`: a cada quantos dias quando VencInt=1
- `CodigoCEI`: código CEI informado, não tem uma função específica, pedido de cliente
- `ObsNFPro1`: observações adicionais para nota de produto
- `ObsNFPro2`: observações adicionais para nota de produto
- `ObsNFSer1`: observações adicionais para nota de serviços
- `ObsNFSer2`: observações adicionais para nota de serviços
- `PlaFatAgrupada`: planílha do faturamento quando agrupadas OSs para faturar
- `OSsVinculadas`: campo usado para preenchimento do usuário, permite listar e buscar, sem função específica
- `SLACodigo`: código do SLA vinculado a OS
- `SLAAtendimento`: vencimento do SLA para primeiro atendimento
- `SLAFechamento`: vencimento do SLA para fechamento da OS
- `Nivel1Liberado`: quando utilizado determina se foi liberado pelo responsável técnico
- `Nivel1LiberadoPor`: quem liberou
- `Nivel1LiberadoEm`: quando liberou
- `Nivel2Liberado`: quando utilizado determina se foi liberado pelo gerente operacional
- `Nivel2LiberadoPor`: quem liberou
- `Nivel2LiberadoEm`: quando liberou
- `MotivoComiss`: motivo de alteração de valor da comissão do técnico
- `OrigemOS`: origem da OS
- `DataAtualizacao`: última gravação
- `Token`: GUID gerado para identificação única da OS
- `NaoAgendadaCliente`: informa que não foi agendado horário com o cliente
- `CodProjeto`: projeto vinculado
- `Equipamento`: equipamento da OS

---

### OSServiços
- **Descrição:** Serviços da OS
- **Relacionamento:** 
- `Planílha` → `OSs.Planilha`
- `CodServiço` → `Serviços.CodServiço`
- **Campos:**
- `CodInterno`: código interno PK
- `CodServiço`: código do serviço
- `Descrição`: nome do serviço
- `Quantidade`: quantidade do serviço
- `Unitário`: valor unitário
- `Total`: valor total do serviço
- `CobraCliente`: indica se o serviço é cobrado ao cliente
- `Custo`: custo unitário do serviço
- `CustoTotal`: custo total do serviço
- `Garantia`: se o serviço é em garantia (não paga ao técnico)
- `Bruto`: valor unitário sem desconto
- `TotalBruto`: valor total sem desconto
- `CustoTécnico`: valor unitário pago ao técnico
- `CustoTécnicoTotal`: valor pago ao técnico que fez a instalação

---

### OSsHashtags
- **Descrição:** Hashtags (etiquetas) vinculadas a OS
- **Relacionamento:** 
- `Planílha` → `OSs.Planilha`
- `CodHashTag` → `Hashtags.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `Planílha`
- `CodHashTag`

---

### OSsRotas
- **Descrição:** Manipulado pelo Horus

---

### OSsTécnicosAuxiliares
- **Descrição:** Técnicos auxiliares da OS que dividem os recebimentos
- **Relacionamento:** 
- `Planílha` → `OSs.Planilha`
- `Técnico` → `Clientes.CodCliente`
- `LiberaComissãoPlanílha` → `ContasPagar.Planílha`
- **Campos:**
- `CodInterno`: código interno PK
- `Planílha`: planílha da OS
- `Técnico`
- `Percentual`: percentual do valor total referente a este técnico
- `Liberado`: se a comissão foi liberada
- `Liberação`: quando comissão foi liberada
- `LiberadoPor`: quem liberou
- `LiberadoObs`: observações
- `LiberadoValor`: valor liberado
- `LiberaComissãoPlanílha`: planílha da liberação
- `Nivel1Liberado`: quando utilizado determina se foi liberado pelo responsável técnico
- `Nivel1LiberadoPor`: quem liberou
- `Nivel1LiberadoEm`: quando liberou
- `Nivel2Liberado`: quando utilizado determina se foi liberado pelo gerente operacional
- `Nivel2LiberadoPor`: quem liberou
- `Nivel2LiberadoEm`: quando liberou
- `MotivoComiss`: motivo de alteração de valor da comissão do técnico

---

### OSVeículos
- **Descrição:** Veículos a instalar ou alterar na OS
- **Relacionamento:** 
- `CodVei` → `OrçamentosVeículos.CodInterno`
- `Planílha` → `OSs.Planílha`
- `TipoVeículo` → `DadosEntidades.CodInterno`
- `SistemaRastreamento` → `DadosEntidades.CodInterno`
- `Bloqueio` → `DadosEntidades.CodInterno`
- `CodVeículoCadastro` → `GRVeículos.CodInterno`
- **Combustível:**
- `G`: Gasolina
- `A`: Etanol
- `B`: BiCombustível
- `D`: Diesel
- `N`: GNV
- `E`: Elétrico
- `H`: Híbrido
- **Campos:**
- `CodInterno`: código interno PK
- `CodVei`: veículo no orçamento
- `Planílha`: planílha da OS
- `Placa`: placa do veículo
- `Ativo`: se está ativo sendo cobrado ou não
- `Observações`
- `ID`: ID do veículo
- `ValorVeículo`: valor mensal do veículo
- `Modelo`: modelo do veículo
- `Combustível`: tipo de combustível
- `Ano`: ano do veículo
- `Cor`: cor do veículo
- `Renavam`: número do Renavam
- `Chassis`: número do Chassis
- `LocalizaçãoMódulo`: local do módulo
- `Bloqueio`: tipo de bloqueio
- `Panico`: possui botão de panico
- `ChipGPRS`: depreciado
- `Rastreador`: depreciado
- `DataVencimentoContrato`: quando encerra o contrato
- `CodVeículoCadastro`: código do cadastro do veículo
- `ValorSeguro`: valor do seguro
- `ValorAssistência`: valor da assistência
- `Seguro`: se usa seguro
- `Assistência`: se usa assistência
- `UsaBloqueio`: se usa bloqueio
- `ValorBloqueio`: valor do bloqueio
- `ReleInvertido`: se tem rele invertido
- `LocalSirene`: local da instalação da sirene
- `LocalBotão`: local da instalação do botão de panico
- `ValorLocação`: valor da locação de equipamentos
- `Voltagem`: voltagem do veículo 12/24v
- `TipoVeículo`: tipo de veículo
- `SistemaRastreamento`: sistema de rastreamento
- `ObsVeículo`
- `VeiculoAltera`: se é veículo a alterar
- `Apelido`: apelido do 

---

### OSVeículosChip
- **Descrição:** CHIPs GRPS vinculados a veículos de OS
- **Relacionamento:** 
- `CodVeículo` → `OSVeículos.CodInterno`
- `CodChip` → `GRChip.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `CodVeículo`
- `CodChip`

---

### OSVeículosRastreador
- **Descrição:** Rastreadores vinculados a veículos de OS
- **Relacionamento:** 
- `CodVeículo` → `OSVeículos.CodInterno`
- `CodRastreador` → `GRRastreador.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `CodVeículo`
- `CodRastreador`

---

### OSVeículosRetirar
- **Descrição:** Veículos a retirar (cancelar) da OS
- **Relacionamento:** 
- `CodVeículo` → `GRVeículos.CodInterno`
- `Planílha` → `OSs.Planílha`
- **Campos:**
- `CodInterno`: código interno PK
- `Planílha`
- `CodVeículo`

---

### PacotesServiçosControle
- **Descrição:** Controle de pacotes de serviços 
- **Relacionamento:** 
- `CodCliente` → `Clientes.CodCliente`
- `CodVeículo` → `GRVeículos.CodInterno`
- `CodServiçoAdicional` → `ServiçosAdicionais.CodInterno`
- `CodServiço` → `Serviços.CodServiço`
- `PlanílhaOrçamento` → `Orçamentos.Planílha`
- `CodAditivo` → `ClientesAditivos.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `TipoVínculo`: C - Cliente; V - Veículo
- `CodCliente`: cliente vinculado
- `CodVeículo`: veículo vinculado
- `CodServiçoAdicional`: código do serviço adicional vinculado
- `CodServiço`: código do serviço na OS
- `Quantidade`: quantidade de vezes que o serviço pode ser usado
- `PlanílhaOrçamento`: orçamento que criou o controle
- `CodAditivo`: aditivo que incluiu o serviço e gerou o controle
- `DataInclusão`: quando incluiu
- `UsuárioInclusão`: quem incluiu
- `DataInícioPrazo`: quando passa vigorar
- `PrazoConsumo`: quantidade de dias para consumir o pacote
- `QuantidadeDisponível`: quantidade que ainda resta para uso
- `ServiçosEventos`: log de eventos do serviço
- `Cancelado`: se foi cancelado
- `DataCancelamento`: quando foi cancelado
- `UsuárioCancelamento`: quem cancelou
- `MotivoCancelamento`: motivo do cancelamento

---

### PagamentoCartaoPortal
- **Descrição:** Manipulado pelo IntegraService

---

### PagSeguroRecebimentos
- **Descrição:** depreciado

---

### Países
- **Descrição:** cadastro de países (para notas de importação)
- **Campos:**
- `CodPaís`: código do país
- `País`: descrição

---

### ParametrosGeraisNfse
- **Descrição:** usado pelo NFSe

---

### ParametrosMailgun
- **Descrição:** usado pelo MessageHub

---

### ParametrosNFSe
- **Descrição:** usado pelo NFSe

---

### Pedidos
- **Descrição:** Pedidos de compras
- **Relacionamento:** 
- `Fornecedor` → `Clientes.CodCliente`
- `Empresa` → `Empresas.CodEmpresa`
- `FormaPagamento` → `FormasPagto.CodFormaPagto`
- `Transportadora` → `Clientes.CodCliente`
- `CodProjeto` → `Projetos.CodProjeto`
- **Campos:**
- `CodPedido`: código interno PK
- `Fornecedor`: fornecedor do pedido
- `Movimento`: data de geração do pedido
- `Usuário`: quem gravou
- `Planílha`: planílha do pedido
- `Pedido`: número do pedido (contador por empresa conciliada)
- `Baixado`: se foi atendido
- `BaixadoEm`: quando foi atendido
- `Empresa`: empresa vinculada
- `Obs`: observações do pedido
- `FormaPagamento`: código da forma de pagamento
- `Transportadora`: código da transportadora
- `TipoFrete`: 1 - por conta do fornecedor; 2 - por conta da empresa
- `PrazoEntrega`: prazo da entrega em dias
- `NomeContato`: contato no fornecedor
- `EmailContato`: contato no fornecedor
- `FoneContato`: contato no fornecedor
- `Chegada`: data da previsão de entrega
- `BaixadoPor`: quem baixou o pedido
- `EmailEnviado`: quando foi enviado para o fornecedor
- `EmailEnviadoUsuário`: quem enviou para o fornecedor
- `BaixaManual`: se foi baixado sem receber toda a mercadoria
- `ValorFrete`: valor do frete negociado
- `DescontoPedido`: valor do desconto negociado
- `Liberado`: se liberado para compra
- `LiberadoPor`: quem liberou
- `LiberadoEm`: quando liberou
- `BaixaMotivo`: motivo que fez a baixa avulsa do pedido
- `Utilização`: onde serão utilizados os produtos
- `PrazoPagamento`: dias para pagamento
- `CodProjeto`: projeto vinculado

---

### PJTransações
- **Descrição:** Transações de pagamento (débito em conta) comandadas pelo sistema no PJBank
- **Relacionamento:** 
- `Conta` → `ContasCaixa.CodCaixa`
- **TipoTransacao:**
- `1`: PIX QRCode
- `2`: PIX Chave
- `3`: Código de Barras
- `4`: TED
- **Campos:**
- `CodInterno`: código interno PK
- `Identificador`: id da transação na PJ
- `Conta`: conta de caixa da transação
- `ValorTransação`: valor da transação
- `Vencimento`: vencimento do pagamento
- `Pagamento`: data do pagamento
- `Descrição`: descrição do pagamento
- `Favorecido`: nome do favorecido
- `CGCCPF`: CPF ou CNPJ do favorecido
- `TipoTransacao`: forma de transação
- `PIXQrCode`: QrCode do pix copia e cola quando TipoTransacao=1
- `TipoChavePIX`: Tipo de chave do PIX quando TipoTransacao=2 (email;cpf;cnpj;aleatoria;telefone)
- `ChavePix`: chave do PIX
- `CódigoBarras`: Código de barras quando TipoTransacao=3
- `FavBanco`: Código do Banco quando TipoTransacao=4 (ex: 104 - CEF)
- `FavAgência`: Agência sem dígito TipoTransacao=4
- `FavConta`: Conta com dígito TipoTransacao=4
- `TipoConta`: Tipo de conta TipoTransacao=4 (corrente;poupanca)
- `Usuário`: quem fez o movimento
- `DataHora`: data e hora do evento
	
---

### Planílhas
- **Descrição:** Tabela com dados temporários que apóia o funcionamento de várias telas

---

### PlanosComissãoRecorrente
- **Descrição:** Planos de comissão recorrente sobre mensalidades (gera todo mês até o cancelamento do cliente)
- **Relacionamento:** 
- `Unidade` → `Unidades.CodUnidade`
- **Campos:**
- `CodInterno`: código interno PK
- `Descrição`: descrição do plano
- `Percentual`: percentual aplicado
- `Ativo`: se o plano está ativo
- `Unidade`: unidade vinculada

---

### PortariaIntegração
- **Descrição:** Configuração de integração com sistemas de Portaria
- **Relacionamento:** 
- `Unidade` → `Unidades.CodUnidade`
- `TécnicoPadrão` → `Clientes.CodCliente`
- `Defeito` → `EntidadesSigma.CodSigma` onde Entidade='D'
- **Prioridade:**
- `A`: alta
- `N`: normal
- `B`: baixa
- **Campos:**
- `CodInterno`: código interno PK
- `Unidade`: unidade vinculada
- `Tipo`: 1 - Situator
- `Nome`: descrição
- `URL`: endpoint da api da portaria
- `LoginUsuário`: se sim por usuário, senão por Token
- `Usuário`: usuário quando LoginUsuário=1
- `Senha`: usuário quando LoginUsuário=1
- `Token`: usuário quando LoginUsuário=2
- `TécnicoPadrão`: técnico padrão para OSs de portaria (abertura pelo sistema de portaria)
- `Defeito`: defeito padrão para abertura da OS
- `Prioridade`: prioridade da OS
- `Ativa`: se a configuração está ativa

---

### PostosCancelamentos
- **Descrição:** Processos de cancelamento de postos ou de serviços de postos
- **Relacionamento:** 
- `CodPosto` → `ClientesPostos.CodInterno`
- `CodServiçoAdicional` → `ServiçosAdicionais.CodInterno`
- `PlanílhaMulta` → `ContasReceber.Planílha`
- `CodCancelamento` → `DadosEntidades.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `CodPosto`: posto em cancelamento
- `CodServiçoAdicional`: serviço adicional quando não é todo o posto
- `Planílha`: planílha do cancelamento 
- `StatusCancelamento`: A - Ativo, C - Cancelado
- `DataComunicação`: data em que o cliente pediu cancelamento
- `CodCancelamento`: codigo do motivo de cancelamento
- `MotivoCancelamento`: motivo de cancelamento
- `Observações`: informações do cancelamento
- `UsuárioComunicação`: quem cadastrou
- `DataConfirmação`: data em que foi confirmado o cancelamento
- `UsuárioConfirmação`: quem confirmou o cancelamento
- `DataProgramada`: data em que foi acordado o cancelamento 
- `DataEstorno`: data em que o processo foi cancelado 
- `UsuárioEstorno`: quem estornou o processo
- `VerificadoFinanceiro`: se foi validado pelo financeiro
- `VerificadoFinanceiroData`: data em que foi validado pelo financeiro
- `VerificadoFinanceiroUsuário`: quem validou o financeiro
- `ValorMulta`: valor a cobrar de multa contratual
- `PlanílhaMulta`: planílha do contas a receber gerado para cobrar a multa contratual
- `DistratoAssinado`: se o distrato foi assinado/aceito
- `DistratoAssinatura`: data da assinatura
- `DistratoImpresso`: se o distrato foi impresso
- `DistratoImpressão`: quando foi impresso o distrato
- `DistratoImpressãoUsuário`: quem imprimiu o distrato
- `DistratoAssinaturaUsuário`: usuário que registrou a assinatura
- `DataVisita`: data agendada para visita
- `ObservaçõesVisita`: informações do contato
- `UsuárioVisita`: quem gravou o contato
- `ResponsávelVisita`: quem foi responsável pelo contato
- `DataVisitaRealizada`: data em que foi realizada a visita
- `ValorCancelamento`: valor do cancelamento

---

### PostosCancelamentos
- **Descrição:** Postos de Serviço do Módulo de Segurança, simplesmente cadastrais
- **Relacionamento:** 
- `Unidade` → `Unidades.CodUnidade`
- **Campos:**
- `CodPS`: código interno PK
- `CNPJContratada`: CNPJ da contratada
- `CNPJContratante`: CNPJ do contratante
- `NomePosto`: nome do posto
- `Endereço`
- `Bairro`
- `Cidade`
- `Estado`
- `CEP`
- `Telefone`
- `QtPostos`: quantidade de pessoas no posto
- `QtArmados`: quantidade de pessoas armadas
- `VigilanteResponsável`
- `Unidade`
- `Observações`
- `InícioContrato`
- `FinalContrato`

---

### PostosPercComissão
- **Descrição:** Regras para geração de comissão em postos de serviços
- **Relacionamento:** 
- `Unidade` → `Unidades.CodUnidade`
- **Campos:**
- `CodInterno`: código interno PK
- `Unidade`
- `ResultDe`: resultado de
- `ResultAte`: resultado até
- `Percentual`: percentual aplicado na faixa

---

### PósVenda
- **Descrição:** Contatos de pós venda com clientes
- **Relacionamento:** 
- `CodCliente` → `Clientes.CodCliente`
- `Executor` → `Clientes.CodCliente`
- `CodVeículo` → `GRVeículos.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `CodCliente`: código do cliente
- `Data`: data do evento
- `Hora`: hora do evento
- `Título`: título do contato
- `Descrição`: relato do contato
- `Usuário`: usuário que gravou
- `Contato`: com quem foi conversado
- `Executor`: quem fez o contato
- `CodVeículo`: veículo assunto do contato

---

### PraçasSicredi
- **Descrição:** depreciado

---

### PreçosViaSeg
- **Descrição:** tabela temporária que apóia a importação da lista da Viaseg

---

### PreçosViaSegExcessões
- **Descrição:** produtos que não devem ser atualizados na importação da lista da Viaseg

---

### PréOrçamento
- **Descrição:** Modelos de orçamentos pré-gravados que facilitam a criação de um novo orçamento
- **Relacionamento:** 
- `Unidade` → `Unidades.CodUnidade`
- **Campos:**
- `CodInterno`: código interno PK
- `Descrição`: nome do modelo
- `Unidade`
- `Observações`: observações do modelo
- `ValorMensalVenda`: valor padrão de mensalidade para venda
- `ValorMensalComodato`: valor padrão de mensalidade para locação
- `Atualizado`: depreciado
- `Ampliação`: determina que é um modelo de ampliação
- `LimitePontos`: quantidade de pontos limite no orçamento
- `ValorPontoAdicional`: valor a cobrar por ponto adicional ao limite
- `ValorCrea`: valor padrão do CREA

---

### PréOrçamentoProdutos
- **Descrição:** Produtos inclusos nos modelos de orçamentos
- **Relacionamento:** 
- `CodPréOrçamento` → `PréOrçamento.CodInterno`
- `CodProduto` → `Produtos.CodProduto`
- **Campos:**
- `CodInterno`: código interno PK
- `CodProduto`
- `Quantidade`: quantidade de unidades
- `Multiplica`: depreciado
- `CodPréOrçamento`: código do modelo
- `GrupoOrçamento`: grupo do orçamento
- `Descrição`: descrição do item
- `OrcOrdem`: ordem de inserção no orçamento

---

### PréOrçamentoServiços
- **Descrição:** Serviços inclusos nos modelos de orçamentos
- **Relacionamento:** 
- `CodPréOrçamento` → `PréOrçamento.CodInterno`
- `CodServiço` → `Serviços.CodServiço`
- **Campos:**
- `CodInterno`: código interno PK
- `CodServiço`
- `Quantidade`: quantidade de unidades do serviço
- `Multiplica`: depreciado
- `CodPréOrçamento`: código do modelo
- `GrupoOrçamento`: grupo do orçamento
- `OrcOrdem`: ordem de inserção no orçamento

---

### PréOrçamentoServiçosAdicionais
- **Descrição:** Serviços adicionais da mensalidade inclusos nos modelos de orçamentos
- **Relacionamento:** 
- `CodPréOrçamento` → `PréOrçamento.CodInterno`
- `CodServiçoAdicional` → `ServiçosAdicionais.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `CodServiçoAdicional`
- `CodPréOrçamento`: código do modelo
- `Quantidade`: quantidade do serviço

---

### PrevisãoVendas
- **Descrição:** Serviços adicionais da mensalidade inclusos nos modelos de orçamentos
- **Relacionamento:** 
- `Vendedor` → `Clientes.CodCliente`
- **Campos:**
- `CodInterno`: código interno PK
- `Mês`: mês de referência
- `Ano`: ano de referência
- `Base`: salário base do vendedor
- `Custo`: ajuda de custo
- `Vendas`: valor em vendas esperado (produtos e serviços)
- `Monitoramento`: valor em mensalidades esperado 
- `QtVendas`: quantidade de clientes vendidos esperado
- `QtLocação`: quantidade de clientes locados esperado
- `QtdeAçõesVenda`: quantidade de ações de vendas esperadas
- `QtdeCancelados`: máximo de cancelamentos esperados

---

### Produtos
- **Descrição:** Produtos cadastrados
- **Relacionamento:** 
- `CodMarca` → `DadosEntidades.CodInterno`
- `CodSecao` → `DadosEntidades.CodInterno`
- `CodGrupo` → `DadosEntidades.CodInterno`
- `CodSubGrupo` → `DadosEntidades.CodInterno`
- `CodUnidade` → `Unidades.CodUnidade`
- `CodCategoria` → `DadosEntidades.CodInterno`
- `EstoquePadrão` → `TiposEstoque.CodEstoque`
- **MovEstoque:**
- `0`: Não Definido
- `1`: Sempre Movimenta
- `2`: Nunca Movimenta
- **Campos:**
- `CodProduto`: código do produto
- `Similar`: código do similar (depreciado)
- `CodFabricante`: código do fabricante do produto
- `CodMarca`: marca do produto
- `Conversao`: depreciado
- `Descriçao`: nome do produto
- `DescriçaoNF`: nome do produto para a nota
- `CodSecao`: seção do produto
- `CodGrupo`: grupo do produto
- `CodSubGrupo`: subgrupo do produto
- `Unidade`: unidade de medida do produto
- `PreçoAnterior`: depreciado
- `Alteraçao`: depreciado
- `Preço`: depreciado
- `Estoque`: depreciado
- `Custo`: depreciado
- `DataCadastro`: data de cadastro
- `Localiza1`: depreciado
- `Localiza2`: depreciado
- `Localiza3`: depreciado
- `VendaNegativa`: se permite venda com estoque negativo (sem solicitar liberação)
- `Minimo`: depreciado
- `Maximo`: depreciado
- `Classe`: depreciado
- `Aplicação`: uma descrição mais detalhada do produto
- `Lucro`: depreciado
- `Foto`: path da foto do item
- `Cancelado`: se o produto está cancelado
- `CustoReposição`: depreciado
- `CustoGerencial`: depreciado
- `CustoMédio`: depreciado
- `ICMSEntrada`: depreciado
- `ICMSSaída`: depreciado
- `SituaçãoTributária`: situação tributária: I;T;F;D;S;N (sem aplicação hoje)
- `SubstituiçãoTributária`: MVA da substituição tributária
- `CodSituaçãoTributária`: CST para contribuinte
- `IPI`: percentual de IPI no item
- `ItemGeral`: se é item geral (permite mudar a descrição)
- `ReduçãoICMSVenda`: percentual de redução da base de calculo de ICMS
- `MasterGrade`: depreciado
- `TipoMoeda`: depreciado
- `PreçoDolar`: depreciado
- `CustoDolar`: depreciado
- `ProdutoKit`: se é um kit de produtos
- `Etiqueta`: se gera etiquetas
- `CobraLocado`: se é cobrado em clientes de locação
- `Pontos`: quantidade de pontos do produto (utilizado para calcular a quantidade de serviço no Orçamento)
- `Lucro2`: margem de lucro esperada para o produto (se 0 pega da configuração da empresa)
- `ComissãoProduto`: percentual de comissão do produto, se 0 busca as regras padrões
- `SemDevolução`: se deve retirar ao cancelar o cliente
- `NCM`: nomeclatura comum do mercosul, identifica o tipo de produto e suas tributações
- `CSOSN`: CSOSN para empresas simples nos clientes contribuintes
- `CodigoBarras`: Código de barras EAN13 do produto
- `MovEstoque`: se movimenta estoque na entrada de mercadoria 
- `PercentualImposto`: percentual aproximado de impostos para mensagem na nota
- `OcultaInventário`: se não deve constar nos inventários de Sintegra e Sped
- `AcréscimoInstalação`: valor a acrescentar no serviço de instalação quando usado o produto
- `AcréscimoMensal`: valor a acrescentar na mensalidade quando usado o produto
- `CodigoViaseg`: código de vinculo com a tabela da Viaseg
- `CEST`: código de CEST do produto
- `GrupoOrçamento`: grupo do orçamento a constar o produto
- `ControlaRastreabilidade`: se deve controlar a rastreabilidade do item no movimento do estoque
- `CSTNContr`: CST não contribuinte
- `CSOSNNContr`: CSOSN não contribuinte
- `UnidadesExcessões`: unidades onde o produto não deve constar se CodUnidade=0
- `TributaçãoMonofásicaPisCofins`: se é tributação monofásica
- `DescrAlternativa`: descrição alternativa para orçamentos
- `NãoEnviarAssistência`: ao retirar de cliente não deve ir para assistência
- `DiferimentoICMSVenda`: percentual de diferimento de ICMS
- `SemGETIN`: mesmo com o código de barras não deve informar o GETIN na NFe
- `IsentoFCP`: produto isento de FCP
- `ScTTD212`: se enquadra na normativa de SC (depreciado)
- `Convertido`: não usado no Service
- `CodProdutoLegado`: não usado no Service
- `CodCategoria`: categoria do produto
- `IsRastreador`: determina se o produto é um Rastreador - cria critérios específicos para a rastreabilidade
- `CodLegado`: não usado no Service
- `ProducaoPropria`: se é de produção própria
- `TributaçãoZeroPisCofins`: se a tributação de PIS e COFINS deve ser 0
- `EntregaMatriz`: se a entrega é feita pela matriz (Porter)
- `ValorComodatoMensal`: valor do produto para composição da mensalidade (Porter)
- `PesoUnitário`: peso em Kg unitário
- `EstoquePadrão`: estoque padrão de entrada do item
- `IDMonitorining`: ID do produto no Monitoring (Porter)
- `ModeloFabricante`: modelo do fabricante

---

### Produtos_Log
- **Descrição:** Log de alteração de produtos, mesmos campos da tabela Produtos com a inclusão dos campos UsuárioGravação e DataHora

---

### ProdutosAssistência
- **Descrição:** Produtos enviados para a assistência técnica
- **Relacionamento:** 
- `PlanílhaOS` → `OSs.Planílha`
- `CodProduto` → `Produtos.CodProduto`
- `Fornecedor` → `Clientes.CodCliente`
- `Cliente` → `Clientes.CodCliente`
- `Unidade` → `Unidades.CodUnidade`
- `EstoqueEnvio` → `TiposEstoque.CodEstoque`
- `EstoqueRetorno` → `TiposEstoque.CodEstoque`
- `PlaEnvio` → `NotasFiscaisSaída.Planílha`
- `PlaRetorno` → `NotasFiscaisEntrada.Planilha`
- `PlaDescarte` → `NotasFiscaisEntrada.Planilha`
- `IDProdutoRastreio` → `ProdutosRastreio.CodRastreio`
- `EmpresaInclusão` → `Empresas.CodEmpresa`
- **Status:**
- `A`: Pendente de envio
- `O`: Aguardando retorno
- `X`: Retornado do fornecedor
- `T`: Aguardando descarte
- `Z`: Descartadas
- `C`: Canceladas
- **Campos:**
- `CodInterno`: código interno PK
- `PlanílhaOS`: planílha da OS que gerou a assistência
- `CodProduto`: código do produto
- `NumSerie`: numero de série do item
- `Defeito`: defeito relatado
- `PlaEnvio`: planílha de envio ao fornecedor
- `DataEnvio`: data do envio ao fornecedor
- `Fornecedor`: fornecedor do produto
- `UsuárioEnvio`: quem enviou
- `Unidade`: unidade referente
- `Cliente`: cliente vinculado
- `PrevisãoRetorno`: data da previsão de retorno da assistência
- `PlaRetorno`: planílha de retorno
- `DataRetorno`: data de retorno
- `UsuárioRetorno`: usuário que lançou o retorno
- `LaudoFornecedor`: laudo do fornecedor
- `EstoqueEnvio`: tipo de estoque de saída no envio
- `EstoqueRetorno`: tipo de estoque de entrada no retorno
- `ValorConserto`: valor a pagar pelo conserto
- `PlaDescarte`: planílha do descarte dos itens (sem conserto)
- `UsuárioDescarte`: usuário que descartou
- `DataDescarte`: data do descarte
- `PlaEncerramento`: planílha de encerramento do processo
- `UsuárioEncerramento`: quem encerrou o processo
- `DataEncerramento`: data de encerramento do processo
- `Status`: status do processo
- `LogEventos`: log de eventos da assistência
- `DataInclusão`: data da criação 
- `UsuárioInclusão`: quem cadastrou
- `DataCancelamento`: data de cancelamento do processo
- `UsuárioCancelamento`: quem cancelou
- `IDProdutoRastreio`: ID unico do item rastreado
- `Anotações`: anotações (depreciado)
- `EmpresaInclusão`: empresa onde o processo foi incluído

---

### ProdutosBeneficioFiscal
- **Descrição:** Tabela de benefícios fiscais de produtos
- **Relacionamento:** 
- `CodProduto` → `Produtos.CodProduto`
- **Campos:**
- `CodInterno`: código interno PK
- `CodProduto`: código do produto
- `CFOP`: CFOP vinculado ao benefício
- `CST`: CST vinculado ao benefício
- `UF`: estado do benefício
- `CodBeneficio`: código do benefício

---

### ProdutosFornecedores
- **Descrição:** Associação entre produto e fornecedor nas importações de NFe para nota de entrada
- **Relacionamento:** 
- `CodFornecedor` → `Clientes.CodCliente`
- `CodProduto` → `Produtos.CodProduto`
- **Campos:**
- `CodInterno`: código interno PK
- `CodFornecedor`: código do fornecedor
- `CodProduto`: código do produto
- `CodFabricante`: código que identifica o produto na NFe
- `UnFornecedor`: unidade de medida no fornecedor
- `UnService`: unidade no Service
- `FatorConversão`: multiplicador para converter entre fornecedor e Service as quantidades

---

### ProdutosKits
- **Descrição:** Produtos que compõe um kit de produtos
- **Relacionamento:** 
- `CodProdutoKit` → `Produtos.CodProduto`
- `CodProdutoAgregado` → `Produtos.CodProduto`
- **Campos:**
- `CodInterno`: código interno PK
- `CodProdutoKit`: código do produto que se comporta como Kit (mestre)
- `CodProdutoAgregado`: código do produto que compõe o Kit
- `Quantidade`: quantidade de itens no kit
- `Percentual`: percentual do valor do produto que compõe o kit

---

### ProdutosRastreio
- **Descrição:** Identificação única de produtos na rastreabilidade de movimentações
- **Relacionamento:** 
- `CodProduto` → `Produtos.CodProduto`
- `CodRastreador` → `GRRastreador.CodInterno`
- **Campos:**
- `CodRastreio`: código interno PK (utilizado nas etiquetas como identificação)
- `CodProduto`: código do produto 
- `NumSerie`: numero de série do item
- `Geração`: data e hora da geração do rastreio
- `Usuário`: quem gerou
- `Observações`: observações incluídas na criação do item
- `CodRastreador`: quando vincula rastradores, identifica o rastreador veicular

---

### ProdutosRastreioMobile
- **Descrição:** Nas retiradas de mercadorias pelo mobile, registra os items que foram identificados no rastreio para confirmação no sistema
- **Relacionamento:** 
- `CodRastreio` → `ProdutosRastreio.CodRastreio`
- `CodOrdem` → `OSs.CodOrdem`
- `CodProduto` → `Produtos.CodProduto`
- **Campos:**
- `CodInterno`: código interno PK
- `CodRastreio`: código do item de rastreio
- `CodOrdem`: ordem de serviço ao qual se refere
- `CodProduto`: código do produto 
- `RegistroData`: quando registrou a retirada
- `ProdutoARetirar`: se é item a retirar

---

### ProdutosSimilares
- **Descrição:** São produtos similares, que podem ser usados em substituição de outros
- **Relacionamento:** 
- `CodProduto` → `Produtos.CodProduto`
- `Similar` → `Produtos.CodProduto`
- **Campos:**
- `CodInterno`: código interno PK
- `CodProduto`: código do produto 
- `Similar`: código do item com similaridade ao produto

---

### ProdutosST
- **Descrição:** Cadastro de substituição tributária de produtos para calculo do MVA, quando não tem os dados de entrada da mercadoria
- **Relacionamento:** 
- `CodEmpresa` → `Empresas.CodEmpresa`
- `CodProduto` → `Produtos.CodProduto`
- **Campos:**
- `CodInterno`: código interno PK
- `CodEmpresa`: código da empresa
- `CodProduto`: código do produto 
- `BaseICMSSTRetido`: base do ICMSST de retenção
- `ICMSSTRetido`: valor do ICMSST de retenção
- `PercentualSuportado`: percentual de substituição (pST)
- `ICMSSubstituto`: valor do ICMS substituto

---

### ProdutosTabelas
- **Descrição:** Tabela de preços de produtos e serviços, aplicasse a orçamentos, OSs, retaguarda etc
- **Relacionamento:** 
- `EmpresaConciliadora` → `Empresas.CodEmpresa`
- **Campos:**
- `CodInterno`: código interno PK
- `EmpresaConciliadora`: código da empresa conciliadora em que vale a tabela
- `Nome`: nome da tabela
- `PrazoContrato`: prazo de contrato a considerar quando utilizada a tabela, se 0 segue o padrão
- `VisivelUnidade`: se fica visível em toda a unidade
- `Inativa`: se está inativa
- `UtilizaValoresProprios`: se utiliza valores próprios informados, caso não o calculo é por indice
- `UtilizaPrecoCusto`: quando utiliza valores próprios, se usa o custo da tabela
- `UtilizaPrecoVenda`: quando utiliza valores próprios, se usa o preço de venda da tabela
- `LimiteDesconto`: percentual de limite de desconto quando utilizada a tabela

---

### ProdutosTabelasItens
- **Descrição:** Itens que compõe a tabela de preços
- **Relacionamento:** 
- `CodTabela` → `ProdutosTabelas.CodInterno`
- `CodProduto` → `Produtos.CodProduto`/`Serviços.CodServiço`/`ServiçosAdicionais.CodInterno`
- **TipoItem:**
- `P`: Produto
- `S`: Serviço
- `D`: Serviço Adicional (Mensal)
- **Campos:**
- `CodInterno`: código interno PK
- `CodTabela`: tabela de preços
- `CodProduto`: código do produto, serviço ou serviço adicional
- `TipoIndice`: P - Percentual; V - Valor
- `ValorIndice`: quando não usa valores próprios, guarda o valor do índice, em caso de percentual multiplica pelo valor do item, em caso de valor soma/subtrai do valor do item
- `TipoItem`: tipo de item que está gravado
- `PrecoCusto`: preço de custo a ser usado em caso de tabela com UtilizaValoresProprios=1
- `PrecoVenda`: preço de venda a ser usado em caso de tabela com UtilizaValoresProprios=1

---

### ProdutosTributação
- **Descrição:** São os valores de tributação de ICMS dos produtos por estado
- **Relacionamento:** 
- `CodProduto` → `Produtos.CodProduto`
- `Unidade` → `Unidades.CodUnidade`
- **Campos:**
- `CodInterno`: código interno PK
- `CodProduto`: código do produto
- `UF`: estado destino/remetente 
- `ICMSEntrada`: percentual do ICMS de entrada de mercadorias vindo do estado
- `ICMSSaída`: percentual do ICMS de saída de mercadorias para o estado
- `Unidade`: unidade vinculada (produtos podem estar em mais de uma unidade, permite valores específicos para cada uma)
- `ICMSInterno`: percentual do ICMS interno do estado destino, usado para calcular a substituição tributária
- `MVAAjustado`: Margem de Valor Agregado, percentual estimado de lucro sobre o produto para calculo da substituição tributária

---

### ProdutosTributação_Log
- **Descrição:** Log das alterações feitas na tributação de produtos
- **Relacionamento:** 
- `CodProduto` → `Produtos.CodProduto`
- `Unidade` → `Unidades.CodUnidade`
- **Campos:**
- `CodInterno`: código interno PK
- `CodProduto`: código do produto
- `Unidade`: unidade vinculada 
- `UF`: estado destino/remetente 
- `ICMSEntradaAnterior`: percentual do ICMS de entrada de mercadorias vindo do estado, antes de alterar
- `ICMSEntrada`: percentual do ICMS de entrada de mercadorias vindo do estado, após alterar
- `ICMSSaídaAnterior`: percentual do ICMS de saída de mercadorias para o estado antes, de alterar
- `ICMSSaída`: percentual do ICMS de saída de mercadorias para o estado, após alterar
- `ICMSInternoAnterior`: percentual do ICMS interno do estado destino, usado para calcular a substituição tributária, antes de alterar
- `ICMSInterno`: percentual do ICMS interno do estado destino, usado para calcular a substituição tributária, após alterar
- `MVAAjustadoAnterior`: Margem de Valor Agregado, percentual estimado de lucro sobre o produto para calculo da substituição tributária, antes de alterar
- `MVAAjustado`: Margem de Valor Agregado, percentual estimado de lucro sobre o produto para calculo da substituição tributária, após alterar
- `Usuário`: quem alterou
- `DataHoraAlteração`: quando alterou

---

### ProjetoPlanílhas
- **Descrição:** São os vínculos de projetos com o contas a pagar
- **Relacionamento:** 
- `Planílha` → `ContasPagar.Planílha`
- `CodProjeto` → `Projetos.CodProjeto`
- **Campos:**
- `CodInterno`: código interno PK
- `Planílha`: planílha do contas a pagar
- `CodProjeto`: projeto vinculado
- `ValorProjeto`: valor do projeto vinculado ao contas a pagar

---

### ProjetosValores
- **Descrição:** São os pagamentos feitos de contas a pagar vinculadas ao projeto
- **Relacionamento:** 
- `PlanílhaCaixa` → `MovimentoCaixa.Planílha`
- `CodProjeto` → `Projetos.CodProjeto`
- `CentroResultados` → `SubContas.CodInterno`
- `CaixaCodInterno` → `ContasCaixa.CodCaixa`
- **Campos:**
- `CodInterno`: código interno PK
- `PlanílhaCaixa`: planílha da baixa da duplicata
- `CodProjeto`: projeto vinculado
- `CentroResultados`: subconta de resultados da baixa/duplicata
- `Débito`: valor correspondente ao projeto na baixa
- `CaixaCodInterno`: caixa em que foi feito o lançamento

---

### ProlaboreGerentes
- **Descrição:** Utilizado pela Inviolável, parametrizam o calculo do prolabore para gerentes
- **Relacionamento:** 
- `Unidade` → `Unidades.CodUnidade`
- `Plano` → `ProlaborePlanos.CodInterno`
- `ContaDL` → `SubContas.ContaDL`
- **Campos:**
- `CodInterno`: código interno PK
- `Unidade`: unidade vinculada
- `Nome`: nome do gerente
- `PercentualAbono`: percentual do abono de cargo de gerência (em geral 40)
- `PercentualMonitoramento`: percentual a receber das vendas de mensalidades
- `PercentualVendas`: percentual a receber das vendas de produtos e serviços
- `PercentualInadimplência`: percentual a abater pela inadimplência
- `PercentualPerdas`: percentual a abater pelos cancelamentos de mensalidades
- `Plano`: plano de prolabore em que encaixa
- `RecebeLocação`: se recebe comissão sobre clientes de locação
- `PercentualDL`: percentual da distribuição de lucros
- `ContaDL`: subconta de resultados utilizada para a distribuição para apurar o lucro distribuido

---

### ProlaboreGerentesHolerite
- **Descrição:** Utilizado pela Inviolável, valores do Holerite mensal do gerente
- **Relacionamento:** 
- `CodGerente` → `ProlaboreGerentes.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `CodGerente`: código do gerente
- `Referência`: mês de referência
- `ValorHolerite`: valor do holerite

---

### ProlaborePlanos
- **Descrição:** Utilizado pela Inviolável, faixa de valores de faturamento para calculo do salário base de gerente
- **Campos:**
- `CodInterno`: código interno PK
- `SalárioBase`: salário base
- `FaturamentoInicial`: valor inicial da faixa salarial
- `FaturamentoFinal`: valor final da faixa salarial

---

### ProlaborePlanosGerente
- **Descrição:** depreciado

---

### ProlaboreSupervisores
- **Descrição:** depreciado

---

### Prospects
- **Descrição:** Cadastro de prospects (leads que podem se tornar clientes)
- **Relacionamento:** 
- `Vendedor` → `Clientes.CodCliente`
- `Interesse` → `DadosEntidades.CodInterno`
- `Atividade` → `DadosEntidades.CodInterno`
- `Origem` → `DadosEntidades.CodInterno`
- `CodCliente` → `Clientes.CodCliente`
- `Unidade` → `Unidades.CodUnidade`
- `InativoMotivo` → `DadosEntidades.CodInterno`
- `Prévendas` → `Clientes.CodCliente`
- `Indicante` → `Clientes.CodCliente`
- `GrupoEconomico` → `DadosEntidades.CodInterno`
**Status:**
- `A`: Prospect ou Lead
- `X`: Prospect ou Lead convertido em cliente
- `C`: Cancelado
- **Campos:**
- `CodProspect`: código do prospect
- `Nome`: nome do prospect
- `Email`: email do prospect
- `Endereço`: endereço do prospect
- `NumCasa`: numero do endereço
- `Bairro`
- `Estado`
- `Cidade`
- `CEP`
- `Fone1`
- `Fax`
- `Interesse`: área de interesse
- `Atividade`: atividade do prospect
- `Vendedor`: vendedor que está atrelado ao prospect
- `Origem`: origem do prospect
- `DataCadastro`: data do cadastro
- `Status`: status do prospect
- `CodCliente`: quando convertido em cliente, identifica quem
- `Ficha`: ficha cadastral do prospect, um descritivo dele
- `Unidade`: unidade ao qual está vinculado
- `Inativo`: se o prospect foi cancelado
- `Latitude`: coordenada de localização
- `Longitude`: coordenada de localização
- `Usuário`: quem cadastrou
- `OrigemMobile`: se foi cadastrado no mobile
- `QtdadeVeículos`: quantidade de veículos que o prospect possui
- `InativoData`: quando foi cancelado
- `InativoPor`: quem cancelou
- `InativoMotivo`: motivo do cancelamento
- `AcompanhaPipe`: se o vendedor vai sempre ver o prospects em todas as etapas do Pipeline (Kanban)
- `Repassado`: se o vendedor recebeu de repasse (distribuição de prospects)
- `RepasseDataHora`: quando recebeu
- `RepasseUsuário`: quem repassou
- `InativadoMotivoDescreve`: texto do motivo de cancelamento
- `Complemento`: complemento do endereço
- `CPF`: CPF/CNPJ do prospect
- `Prévendas`: prévendas que levantou o prospect
- `Indicante`: cliente que indicou o prospect
- `OrigemSistema`: depreciado
- `GerouPolgo`: se gerou o prospect no Polgo (integração específica para um cliente)
- `RDID`: se integrado ao RD, qual o ID do prospect na plataforma
- `GrupoEconomico`: grupo economico do prospect

---

### ProspectsAçãoVendas
- **Descrição:** Cadastro de ações de vendas do prospect (tentativas de contato, visitas, ligações, emails, etc)
- **Relacionamento:** 
- `CodProspect` → `Prospects.CodProspect`
- `Interesse` → `DadosEntidades.CodInterno`
- `Contato` → `ProspectsContatos.CodContato`
- `Vendedor` → `Clientes.CodCliente`
- `Ação` → `DadosEntidades.CodInterno`
- `OrçamentoVinculado` → `Orçamentos.CodInterno`
- **Campos:**
- `CodAção`: código da ação
- `Data`: data da ação
- `Hora`: hora da ação
- `CodProspect`: código do prospect
- `Interesse`: área de interesse
- `Vendedor`: código do vendedor
- `Contato`: código do contato
- `Probabilidade`: probabilidade de 0 a 100 de fechamento da venda
- `Duração`: tempo de duração da ação
- `ProxContato`: data do próximo contato
- `ProxContatoHora`: hora do próximo contato
- `Descrição`: relato do contato com o cliente
- `Ação`: ação de vendas feita
- `Latitude`: coordenada do mobile onde gravou
- `Longitude`: coordenada do mobile onde gravou
- `codAtividade`: depreciado
- `OrçamentoVinculado`: depreciado

---

### ProspectsContatos
- **Descrição:** Cadastro de contatos do prospect e de clientes
- **Relacionamento:** 
- `CodCliente` → `Clientes.CodCliente`
- `CodProspect` → `Prospects.CodProspect`
- **Campos:**
- `CodContato`: código do contato
- `CodCliente`: código do cliente vinculado
- `CodProspect`: código do prospect
- `Nome`: nome do contato
- `Email`: email do contato
- `Fone1`: telefone do contato
- `Fone2`: telefone do contato
- `Celular`: celular do contato
- `Fax`: fone 3
- `Email`
- `Skype`
- `Outros`: outros meios de comunicação
- `Nascimento`: data de nascimento do contato
- `Setor`: setor onde trabalha
- `Função`: função do contato na empresa
- `Origem`: não utilizado no service
- `Observações`: observações do contato
- `Inativo`: se está inativo
- `NomeEmpresa`: nome da empresa
- `Endereço`
- `Site`
- `EnviaMala`: se envia mala direta
- `EnviaCobranca`: se envia cobrança

---

### ProspectsVendedoresRoteamento
- **Descrição:** Cadastro dos vendedores no roteamento de prospects
- **Relacionamento:** 
- `Vendedor` → `Clientes.CodCliente`
**Tipo:**
- `1`: por DDD
- `2`: por CEP
- `3`: por Área de Interesse
- `4`: por Cidade
- `5`: Geral
- **Campos:**
- `CodInterno`: código interno PK
- `Vendedor`: código do vendedor
- `Tipo`: tipo de distribuição que o vendedor participa - utiliza também como prioridade de 1 a 5
- `ValorTipo`: valor do item inicial de acordo com o tipo
- `Ativo`: se está ativo
- `UltimoRepasse`: data e hora do ultimo repasse
- `ValorTipoFinal`: valor do item final de acordo com o tipo
- `Cidade`: cidade no tipo 4
- `Estado`: estado no tipo 4

---

### ProspectsVendedoresRoteamentoEventos
- **Descrição:** Eventos de distribuição de prospects para o vendedor
- **Relacionamento:** 
- `Vendedor` → `Clientes.CodCliente`
- `CodProspect` → `Prospects.CodProspect`
- **Campos:**
- `CodInterno`: código interno PK
- `Vendedor`: código do vendedor
- `DataHora`: data e hora do evento
- `Evento`: relato do evento 
- `Usuário`: quem gravou
- `CodProspect`: prospect que foi direcionado
- `Cancelado`: se cancelou
- `CanceladoPor`: quem cancelou
- `CanceladoEm`: quando cancelou

---

### ProtrackModelDevices
- **Descrição:** Modelos de rastreadores na integração com a Protrack
- **Campos:**
- `CodInterno`: código interno PK
- `model`: modelo
- `manufacturer`: fabricante

---

### ProvisãoEstoque
- **Descrição:** Lançamentos de provisão de estoque (faz entrada do estoque antes do lançamento da nota de entrada, que vai efetivar)
- **Relacionamento:** 
- `CodProduto` → `Produtos.CodProduto`
- `CodProspect` → `Prospects.CodProspect`
- `TipoEstoque` → `TiposEstoque.CodEstoque`
- **Campos:**
- `CodInterno`: código interno PK
- `DataMovimento`: data do evento
- `Usuário`: quem gravou
- `Planílha`: planílha da provisão
- `CodProduto`: produto da provisão
- `Unidade`: unidade vinculada
- `Empresa`: empresa vinculada
- `Quantidade`: quantidade em provisão
- `Unitário`: valor unitário
- `Motivo`: motivo do lançamento da provisão
- `QtBaixa`: quanto baixou da provisão com notas de entrada
- `Saldo`: quantidade a baixar
- `DataBaixa`: data em que encerrou a provisão
- `TipoEstoque`: tipo de estoque vinculado

---

### ReajusteServiçosAdicionais
- **Descrição:** Reajustes feitos em serviços adicionais de clientes
- **Relacionamento:** 
- `CodCliente` → `Clientes.CodCliente`
- `CodServiço` → `ServiçosAdicionais.CodInterno`
- `CodPosto` → `ClientesPostos.CodInterno`
- `CodServAD` → `ClientesPostosServiços.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `CodCliente`: código do cliente
- `Planílha`: planílha da atualização
- `CodServiço`: serviço adicional reajustado
- `ValorServiço`: novo valor do serviço
- `Manutenção`: se tem manutenção
- `Observações`: observações do serviço
- `CodPosto`: código do posto de serviço
- `CodServAD`: código do serviço adicional no posto de serviço

---

### ReajusteVeículos
- **Descrição:** Reajustes feitos em veículos
- **Relacionamento:** 
- `CodCliente` → `Clientes.CodCliente`
- `CodVeículo` → `GRVeículos.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `CodCliente`: código do cliente
- `Planílha`: planílha da atualização
- `CodVeículo`: código do veículo
- `ValorMensal`: novo valor mensal
- `ValorLocação`: novo valor de locação
- `DataAlteração`: data e hora de alteração
- `Usuário`: quem reajustou

---

### ReajusteVeículosServiçosAdicionais
- **Descrição:** Reajustes feitos em serviços adicionais de veículos
- **Relacionamento:** 
- `CodVeículo` → `GRVeículos.CodInterno`
- `CodServiço` → `ServiçosAdicionais.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `Planílha`: planílha da atualização
- `CodVeículo`: código do veículo
- `CodServiço`: código do serviço adicional
- `ValorServiço`: novo valor

---

### RecibosBase
- **Descrição:** Dados temporários para apoio em tela

---

### RecibosGerados
- **Descrição:** Recibos gerados de forma avulsa ou pelo caixa
- **Relacionamento:** 
- `Unidade` → `Unidades.CodUnidade`
- `CodCliente` → `Clientes.CodCliente`
- **Campos:**
- `CodInterno`: código interno PK
- `NumRecibo`: número do recibo
- `Unidade`: unidade vinculada
- `RecebidoDe`: nome do pagador
- `Valor`: valor do recibo
- `Referente`: motivo do pagamento
- `Data`: data do recibo
- `RecebidoPor`: quem recebeu
- `Documento`: documento que foi pago
- `Usuário`: quem gerou
- `DataInformada`: data que foi impressa no recibo
- `Endereço`: endereço do recebedor
- `CodCliente`: cliente vinculado
- `Fantasia`: fantasia da empresa
- `ListaChaves`: centrais do cliente

---

### RecuperarSenha
- **Descrição:** Utilizado pelo IntegraService para o Portal do Cliente

---

### RegistrosBlocoSIAPPA
- **Descrição:** Não utilizado - depreciado

---

### RegrasTributosVenda
- **Descrição:** Cadastro de regras de tributos por NCM para geração de notas
**TipoReducaoBaseICMS:**
- `0`: Em x%
- `1`: De x%
- `2`: Para x%
**CalculaDifal:**
- `0`: Não Calcula
- `1`: Sim - Base Simples ST
- `2`: Sim - Base Dupla ST
- `3`: Sim - Base Simples
- `4`: Sim - Base Dupla
**RegimeTributario:**
- `0`: Todos
- `1`: Simples Nacional
- `2`: Regime Normal
- **Campos:**
- `CodInterno`: código interno PK
- `NCM`: NCM da regra
- `UFEmissao`: estado de emissão
- `UFDestino`: estado de destino da regra
- `Contribuinte`: se se aplica a contribuinte ou não contribuinte
- `DestinoFinal`: se é destino final do produto
- `CFOP`: CFOP da operação
- `ICMSInterestadual`: percentual do ICMS interestadual para destacar na nota
- `FCP`: percentual do fundo de combate a pobreza
- `ICMSInterno`: ICMS interno do estado destino para calculo do ST
- `IPI`: percentual de IPI
- `CST`: código de situação tributária 
- `CSOSN`: código de situação tributária no simples
- `MVA`: MVA para calculo da ST
- `ReducaoBaseICMS`: percentual de redução da base de calculo de ICMS
- `TipoReducaoBaseICMS`: forma de redução da base de calculo
- `DiferimentoICMS`: percentual de diferimento de ICMS
- `ProcoloConvenio`: se possui protocolo/convenio com o estado destino
- `CalculaDifal`: forma de calculo do Difal
- `CodBeneficioFiscal`: código do benefício fiscal
- `InformacoesAdicionaisNota`: informações adicionais a serem incluídas na nota
- `RegimeTributario`: tipo de regime tributário do destinatário da nota ao qual se aplica a regra
- `CSTCadastro`: tipo de CST do cadastro de produtos ao qual se aplica a regra
- `ProdutosRegra`: lista de códigos de produtos separados por ; aos quais a regra sempre deve ser aplicada
- `ProdutosExcecao`: lista de códigos de produtos separados por ; aos quais a regra nunca deve ser aplicada
- `CFOPGarantia`: CFOP em caso de faturamento da garantia
- `CFOPBrindes`: CFOP em caso de faturamento de brindes

---

### RelatoriosPersonalizados
- **Descrição:** Não utilizado pelo Service

---

### Remessa
- **Descrição:** Dados temporários que apoiam a tela de remessa bancária de contas a receber

---

### RemessaContasPagar
- **Descrição:** Dados temporários que apoiam a tela de remessa bancária de contas a pagar

---

### RemessasGeradas
- **Descrição:** Remessas de contas a receber geradas 
- **Relacionamento:** 
- `Empresa` → `Empresas.CodEmpresa`
- `FormaPagamento` → `FormasPagto.CodFormaPagto`
- **Campos:**
- `CodInterno`: código interno PK
- `Empresa`: código da empresa
- `Banco`: código do banco
- `FormaPagamento`: forma de pagamento
- `Arquivo`: arquivo gerado
- `DataGeração`: data e hora da geração do arquivo
- `UsuárioGeração`: quem gerou o arquivo
- `ContadorRemessa`: número do contador de remessa
- `Integração`: tipo de integração gerada

---

### RemessasGeradasDuplicatas
- **Descrição:** duplicatas das remessas de contas a receber geradas 
- **Relacionamento:** 
- `CodRemessa` → `RemessasGeradas.CodInterno`
- `CodDuplicata` → `ContasReceber.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `CodRemessa`: código da remessa
- `CodDuplicata`: código da duplicata
- `Instrução`: código da instrução gerada
- `DescreveInstrução`: descrição da instrução gerada
- `Vencimento`: novo vencimento (se alterado)
- `ValorDuplicata`: novo valor (se alterado)
- `NossoNúmero`: nosso número da integração
- `DupEliminada`: se foi gerado de duplicata excluída
- `Prazo`: se foi comando de protesto o prazo
- `ValorAbatimento`: se foi abatimento o valor
- `AtualizarVencimento`: se atualizou o vencimento na 

---

### RemessasInnove
- **Descrição:** duplicatas enviadas para o Serasa através da integração com a Innove
- **Relacionamento:** 
- `CodDuplicata` → `ContasReceber.CodInterno`
- `Empresa` → `Empresas.CodEmpresa`
- `Unidade` → `Unidades.CodUnidade`
**StatusInnove:**
- `1`: Pedido de Inclusão
- `2`: Incluída na Innove
- `3`: Inclusão Rejeitada pela Innove
- `4`: Pedido de Exclusão
- `5`: Excluída da Innove
- `6`: Exclusão Rejeitada pela Innove
- **Campos:**
- `CodInterno`: código interno PK
- `CodDuplicata`: código da duplicata
- `Empresa`: empresa usadada para envio
- `Unidade`: unidade da empresa
- `Movimento`: I - Inclusão; E - Exclusão
- `CodRestriçãoInnove`: código da duplicata na Innove
- `StatusInnove`: status da duplicata na Innove
- `DataEnvio`: data e hora do envio da solicitação
- `Usuário`: quem enviou
- `Retorno`: quando retornou resposta da Innove
- `ÚltimaTentativa`: quando fez a ultima tentativa de validação com a Innove
- `Erros`: erros que ocorreram na tentativa

---

### RemetenteAceiteEletronico
- **Descrição:** Utilizado pelo IntegraService para envio de Aceites

---

### RemotyCidades
- **Descrição:** Cidades na integração com o Remoty

---

### RemotyEstados
- **Descrição:** Estados na integração com o Remoty

---

### RemotyFusos
- **Descrição:** Fuso horários na integração com a Remoty

---

### RemotyPaíses
- **Descrição:** Países horários na integração com a Remoty

---

### RequisiçãoAlmoxarifado
- **Descrição:** Requisições feitas ao almoxarifado
- **Relacionamento:** 
- `CodProduto` → `Produtos.CodProduto`
- `EmpresaOrigem` → `Empresas.CodEmpresa`
- `EmpresaMovimento` → `Empresas.CodEmpresa`
- `CodCliente` → `Clientes.CodCliente`
- `CentroCustos` → `Centros.CodInterno`
- `CodRequisiçãoCompra` → `Requisições.CodInterno`
- `TipoEstoque` → `TiposEstoque.CodEstoque`
- `CodLote` → `RequisiçãoAlmoxarifadoLote.CodLote`
- `EstoqueContrapartida` → `TiposEstoque.CodEstoque`
**Status:**
- `A`: Pendentes de entrega
- `X`: Entregues
- `C`: Canceladas
- **Campos:**
- `CodInterno`: código interno PK
- `DataRequisição`: data da requisição
- `Usuário`: quem fez a requisição
- `CodProduto`: produto que foi requerido
- `Quantidade`: quantidade de itens requerida
- `Motivo`: motivo da requisição
- `Status`: status da requisição
- `DataConclusão`: data e hora da entrega
- `TransferênciaDireta`: depreciado
- `EmpresaOrigem`: empresa de origem da requisição
- `EmpresaMovimento`: empresa destino
- `CodCliente`: cliente relacionado ao pedido
- `CentroCustos`: centro de custo relacionado
- `CodRequisiçãoCompra`: caso tenha sido necessário requisitar a compra, o código da requisição gerada
- `LogAlterações`: log de alterações da requisição
- `PlanílhaEntrega`: planílha da baixa/entrega
- `Observação`: observações da requisição
- `Entregue`: quantidade entregue
- `Devolvido`: quantidade devolvida
- `ProdutoCusto`: custo do produto
- `TipoEstoque`: estoque movimentado
- `CodLote`: lote de produtos cadastrado na requisição
- `EstoqueContrapartida`: estoque movimentado em contrapartida em caso de transferência de estoque

---

### RequisiçãoAlmoxarifadoDevolução
- **Descrição:** Devoluções de requisições feitas ao almoxarifado
- **Relacionamento:** 
- `CodReqAlmox` → `RequisiçãoAlmoxarifado.CodInterno`
- `CodProduto` → `Produtos.CodProduto`
- `TipoEstoque` → `TiposEstoque.CodEstoque`
- `EstoqueContrapartida` → `TiposEstoque.CodEstoque`
**Status:**
- `A`: Pendentes de devolução
- `X`: Devolvidos
- `C`: Canceladas
- **Campos:**
- `CodInterno`: código interno PK
- `CodReqAlmox`: código da requisição de origem
- `Usuário`: quem fez a requisição
- `DataReqDevolução`: data da requisição de devolução
- `CodProduto`: produto que será devolvido
- `Quantidade`: quantidade de itens 
- `Motivo`: motivo da devolução
- `Status`: status da devolução
- `DataDevolução`: data e hora da devolução
- `PlanílhaDevolução`: planílha da devolução
- `TipoEstoque`: estoque movimentado
- `EstoqueContrapartida`: estoque movimentado em contrapartida em caso de transferência de estoque

---

### RequisiçãoAlmoxarifadoLote
- **Descrição:** Lotes de requisições
- **Campos:**
- `CodInterno`: código interno PK
- `DataEmissão`: data do cadastro do lote
- `Usuário`: quem gravou

---

### RequisiçãoAlmoxarifadoPendentesEntrada
- **Descrição:** Requisições pendentes de entrega
- **Relacionamento:** 
- `CodRequisicao` → `RequisiçãoAlmoxarifado.CodInterno`
- `CodProduto` → `Produtos.CodProduto`
- `EmpresaOrigem` → `Empresas.CodEmpresa`
- `EmpresaMovimento` → `Empresas.CodEmpresa`
- `ConciliadoraOrigem` → `Empresas.CodEmpresa`
- `ConciliadoraEntrega` → `Empresas.CodEmpresa`
- `EstoqueOrigem` → `TiposEstoque.CodEstoque`
- `EstoqueContrapartida` → `TiposEstoque.CodEstoque`
- **Campos:**
- `CodInterno`: código interno PK
- `CodRequisicao`: código da requisição
- `Planílha`: planílha da pendencia
- `CodProduto`: produto que foi requerido
- `EmpresaOrigem`: empresa de origem da requisição
- `EmpresaMovimento`: empresa onde foi processada a requisição
- `ConciliadoraOrigem`: empresa conciliadora de origem da requisição
- `ConciliadoraEntrega`: empresa conciliadora destino
- `Quantidade`: quantidade a entregar
- `EstoqueOrigem`: estoque movimentado
- `EstoqueContrapartida`: estoque movimentado em contrapartida em caso de transferência de estoque
- `Pendente`: se está pendente
- `BaixadoEm`: quando foi entregue
- `BaixadoPor`: quem entregou

---

### RequisiçãoCompras
- **Descrição:** Depreciado

---

### Requisições
- **Descrição:** Requisições de Compras
- **Relacionamento:** 
- `CodProduto` → `Produtos.CodProduto`
- `Unidade` → `Unidades.CodUnidade`
- `CodCotação` → `Cotações.CodInterno`
- `PlaOS` → `OSs.Planílha`
- `Empresa` → `Empresas.CodEmpresa`
- `CodPedido` → `Pedidos.CodPedido`
- **Campos:**
- `CodRequisição`: código interno PK
- `CodProduto`: produto que foi requerido
- `Quantidade`: quantidade a entregar
- `UsuárioRequisição`: quem gravou a requisição
- `Unidade`: unidade da requisição
- `DataRequisição`: data da requisição
- `QuantidadeImportada`: quantidade importada para pedido/cotação
- `CodCotação`: cotação de preços gerada/onde a requisição foi importada
- `DataImportação`: data da importação
- `UsuárioImportação`: quem importou
- `Observações`
- `QtEstoque`: quantidade em estoque do item no cadastro
- `LogAlterações`: log de alterações feitas
- `Cancelada`: se a requisição foi cancelada
- `PlaOS`: planílha da OS que gerou a requisição (empresa trabalha com just in time)
- `Empresa`: empresa da requisição
- `CodPedido`: código do pedido onde foi importada a requisição
- `DescricaoProduto`: descrição do produto para o fornecedor

---

### Retornos
- **Descrição:** Retornos bancários processados
- **Relacionamento:** 
- `Unidade` → `Unidades.CodUnidade`
- **Campos:**
- `CodInterno`: código interno PK
- `Banco`: código do banco
- `Arquivo`: nome do arquivo de retorno
- `DataImportação`: data e hora da importação
- `Cedente`: cedente lido no arquivo
- `Usuário`: quem importou
- `DataArquivo`: data de geração informada no arquivo
- `Unidade`: unidade vinculada
- `ResponsePJ`: nas integrações via API grava o retorno da API na consulta (log)

---

### RetornosDados
- **Descrição:** Boletos dos retornos bancários processados
- **Relacionamento:** 
- `CodRetorno` → `Retornos.CodInterno`
- `Empresa` → `Empresas.CodEmpresa`
- `Cliente` → `Clientes.CodCliente`
- `CodDuplicata` → `ContasReceber.CodInterno`
- `CodContaCaixa` → `ContasCaixa.CodCaixa`
- **Campos:**
- `CodInterno`: código interno PK
- `CodRetorno`: código do retorno
- `NossoNumero`: nosso numero do retorno
- `SeuNumero`: seu número do retorno
- `Empresa`: se localizou o nosso numero na base, a empresa da duplicata
- `Cliente`: se localizou o nosso numero na base, o cliente da duplciata
- `Duplicata`: se localizou o nosso numero na base, o numero da duplicata
- `Letra`: se localizou o nosso numero na base, a letra da duplicata
- `Vencimento`: data de vencimento do boleto
- `ValorDuplicata`: valor da duplicata
- `Saldo`: sem uso, sempre 0
- `ValorPago`: valor total pago pelo cliente
- `Multa`: valor de multa paga
- `Descontos`: valor de descontos no pagamento
- `Tarifas`: valor de tarifas bancárias vinculadas ao movimento
- `Baixado`: se a duplicata sofreu baixa pelo movimento
- `Cedente`: identificação do cedente
- `Ocorrência`: ocorrência do retorno
- `MotivoRejeição`: motivos de rejeição de instruções enviadas
- `DescOcorrência`: descreve a ocorrência
- `DescMotivo`: descreve os motivos de rejeição
- `Pagamento`: data do pagamento do título
- `Mora`: valor de mora dia pago
- `DDA`: se o cliente usa DDA (somente Itau)
- `CodDuplicata`: se localizou o nosso numero na base, o código da duplicata
- `DataCredito`: data de crédito dos valores
- `CP`: nos retornos de contas a pagar, a CP
- `NossoNumeroOriginal`: no PJBank traz o nosso numero original da duplicata, em alguns casos o sistema localiza por ai
- `Pagador`: identifica o pagador
- `idUnico`: no PJBank traz o id Unico
- `idUnicoOriginal`: no PJBank traz o id Unico Original
- `ObservaçõesBaixa`: texto que deve ser gravado junto a baixa da duplicata
- `CodContaCaixa`: conta de caixa instruída para a baixa da duplicata

---

### RoteirizacaoOS
- **Descrição:** Não utilizado no Service - Manipulado pelo Horus

---

### RPS
- **Descrição:** Manipulado pelo NFSe

---

### SACPesquisas
- **Descrição:** Pesquisas feitas pelo SAC
- **Relacionamento:** 
- `CodCliente` → `Clientes.CodCliente`
- `CodOS` → `OSs.CodInterno`
**Tipo:**
- `I`: Pós-Venda Instalações (OS)
- `M`: Manutenção (OS)
- `R`: Atendimento do SAC
- `P`: Aleatória (Periódica)
**P1...P10:**
- `1`: Ótimo
- `2`: Bom
- `3`: Ruim
- `4`: Péssimo
- `5`: Sim
- `6`: Não
- **Campos:**
- `CodInterno`: código interno PK
- `CodCliente`: código do cliente
- `Tipo`: tipo de pesquisa
- `Data`: data da pesquisa
- `Usuário`: quem gravou a pesquisa
- `Contato`: contato no cliente que respondeu
- `P1...P10`: são respostas das perguntas
- `Sugestão`: sugestões/observações gerais da pesquisa
- `CodOS`: código da OS vinculada
- `SugestãoP1...SugestãoP10`: sugestões de melhoria/reclamações atribuídas a pergunta
- `NãoOpinou`: identifica que o cliente não quis responder a pesquisa
- `NPS`: índice de 0 a 10 de indicar a empresa para um conhecido

---

### SacPesquisasEnviadas
- **Descrição:** Pesquisas enviadas para clientes (link da pesquisa)
- **Relacionamento:** 
- `CodCliente` → `Clientes.CodCliente`
- `CodOS` → `OSs.CodInterno`
**TipoPesquisa:**
- `I`: Pós-Venda Instalações (OS)
- `M`: Manutenção (OS)
- `R`: Atendimento do SAC
- `P`: Aleatória (Periódica)
- **Campos:**
- `CodInterno`: código interno PK
- `CodCliente`: código do cliente
- `TipoPesquisa`: tipo de pesquisa
- `Usuário`: quem enviou a pesquisa
- `DataEnvio`: data do envio
- `TipoEnvio`: E - Email; W - WhatsApp
- `EndereçoEnvio`: endereço de email/celular do envio
- `CodOS`: código da OS vinculada

---

### SACQuestões
- **Descrição:** Perguntas das pesquisas de avaliação do SAC
- **Relacionamento:** 
- `Unidade` → `Unidades.CodUnidade`
**TipoAvaliação:**
- `I`: Pós-Venda Instalações (OS)
- `M`: Manutenção (OS)
- `R`: Atendimento do SAC
- `P`: Aleatória (Periódica)
- **Campos:**
- `CodInterno`: código interno PK
- `TipoAvaliação`: tipo de pesquisa
- `Ordem`: ordem da pergunta
- `Questão`: texto da pergunta
- `TPSimNão`: se é do tipo Sim/Não, caso não seja fica entre ótimo e péssimo
- `Unidade`: unidade vinculada
- `MensagemNãoConforme`: texto de não coformidade que será carregado no SAC para abertura de reclamação caso tenha sido avaliado como Ruim ou Péssimo

---

### SACReclamações
- **Descrição:** São os atendimentos feitos pelo SAC
- **Relacionamento:** 
- `Cliente` → `Clientes.CodCliente`
- `Origem` → `DadosEntidades.Codigo` onde CodEntidade=285
- `Tipo` → `DadosEntidades.Codigo` onde CodEntidade=117
- `MotivoReclamação` → `DadosEntidades.CodInterno`
- `Setor` → `DadosEntidades.CodInterno`
- `CodVeículo` → `GRVeículos.CodInterno`
**Causa:**
- `M`: Máquina
- `E`: Meio
- `T`: Material
- `D`: Medida
- `O`: Método
- `B`: Mão de Obra
**Origem:**
- `A`: Auditoria
- `C`: Cliente
**Status:**
- `A`: Esperando ação imediata
- `I`: Esperando ação corretiva/plano de ação
- `R`: Esperando avaliação do SAC
- `F`: Encerrada
**Tipo:**
- `E`: Elogio
- `R`: Reclamação
- `S`: Solicitação
- **Campos:**
- `CodInterno`: código interno PK
- `Data`: data de registro
- `Hora`: hora de registro
- `Contato`: contato que pediu o atendimento
- `AçãoImediata`: ação imediata que foi executada no contato do cliente
- `Usuário`: quem registrou o contato
- `PrazoAçãoImediata`: data limite esperada para ação imediata
- `Resultado`: se a ação imediata surtiu resultado
- `AçãoCorretiva`: ação corretiva executada no cliente
- `ResponsávelAçãoCorretiva`: quem foi responsável pela ação corretiva
- `PrazoAçãoCorretiva`: data limite esperada para ação corretiva
- `Eficaz`: se a ação corretiva resolveu o problema
- `Reclamação`: texto do relato do cliente para o qual o atendimento foi registrado
- `Procedente`: se a reclamação foi procedente
- `EmitAuditor`: responsável pelo encerramento
- `CausasFundamentais`: uma descrição dos motivos que levaram ao problema
- `PlanoAção`: uma descrição de um plano de ação para mitigar as cusas do problema
- `PlanoAçãoQuem`: responsável pelo plano de ação
- `PlanoAçãoPrevisto`: data limite esperada para execução do plano de ação
- `PlanoAçãoRealizado`: data em que o plano de ação foi realizado
- `Observações`: observações do encerramento
- `Causa`: causa do atendimento
- `Origem`: origem do atendimento
- `Ação`: C - Corretiva; P - Preventiva
- `Reincidência`: se é reincidente o problema
- `Status`: status do atendimento
- `Tipo`: tipo da reclamação
- `MotivoReclamação`: motivo da reclamação
- `DataAvaliação`: data da avaliação pelo SAC
- `Setor`: setor da reclamação
- `DataFechamento`: data de fechamento do atendimento
- `AçãoImediataRealizado`: data de realização da ação imediata
- `AçãoCorretivaRealizado`: data de realização da ação corretiva
- `PlanoAçãoRealizadoHora`: hora de realização do plano de ação
- `FechamentoHora`: hora do fechamento
- `AvaliaçãoHora`: hora da avaliação
- `AcompanhaProcesso`: se deseja acompanhar o processo
- `EventosReclamação`: eventos da reclamação
- `CodPesquisa`: depreciado
- `CodTemporario`: código temporário
- `Portal`: se foi aberto pelo portal
- `CodVeículo`: código do veículo atrelado

---

### SACSemContato
- **Descrição:** Tentativas de contato do SAC com o cliente para pesquisa sem sucesso
- **Relacionamento:** 
- `CodCliente` → `Clientes.CodCliente`
- `PlanílhaOS` → `OSs.Planílha`
- `CodReclamação` → `SACReclamações.CodInterno`
**TipoPesquisa:**
- `I`: Pós-Venda Instalações (OS)
- `M`: Manutenção (OS)
- `R`: Atendimento do SAC
- `P`: Aleatória (Periódica)
- **Campos:**
- `CodInterno`: código interno PK
- `CodCliente`: código do cliente
- `Usuário`: usuário que tentou contato
- `Data`: data do contato
- `TipoPesquisa`: tipo de pesquisa de contato
- `PlanílhaOS`: planílha da OS que originou a pesquisa
- `CodReclamação`: código do atendimento do SAC que originou a pesquisa
- `Observações`: observações da tentativa de contato

---

### SACSemContatoReclamação
- **Descrição:** Tentativas de contato do SAC com o cliente para atendimento sem sucesso
- **Relacionamento:** 
- `CodCliente` → `Clientes.CodCliente`
- `CodReclamação` → `SACReclamações.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `CodCliente`: código do cliente
- `Usuário`: usuário que tentou contato
- `Data`: data da tentativa de contato
- `CodReclamação`: código do atendimento do SAC
- `Observações`: observações da tentativa de contato

---

### SeguradoraAtividades
- **Descrição:** Tipos de atividades para integração com a Moninf
- **Relacionamento:** 
- `Unidade` → `Unidades.CodUnidade`
- **Campos:**
- `CodInterno`: código interno PK
- `CodProduto`: código de produto na seguradora
- `CodAtividade`: código da atividade na seguradora
- `Descricao`: descrição da atividade
- `AtividadeAceita`: se a atividade é aceita
- `Seguradora`: 3 - Moninf
- `Unidade`: Unidade vinculada

---

### SeguradorasPlanos
- **Descrição:** Planos de seguro
- **Relacionamento:** 
- `Unidade` → `Unidades.CodUnidade`
**Seguradora:**
- `0`: Sulamerica
- `1`: Servis
- `2`: Seguradora
- `3`: Moninfo
- `4`: Facil Assist
- **Campos:**
- `CodInterno`: código interno PK
- `Descrição`: descrição do plano
- `Valor`: valor mensal
- `Seguradora`: seguradora do plano
- `ProdutoSeguradora`: código do produto da seguradora
- `PlanoProduto`: plano do produto
- `Ativo`: se está ativo
- `Unidade`: Unidade vinculada
- `SeguroLimiteIdade`: limite de idade
- `SeguroLimiteAnoVeículo`: limite de ano de veículo

---

### SegurançaAvisos
- **Descrição:** Dados temporários para avisos

---

### Senhas
- **Descrição:** Cadastro e configurações de usuários
- **Relacionamento:** 
- `Empresa` → `Empresas.CodEmpresa`
- `Funcionário` → `Clientes.CodCliente`
- `SetorSAC` → `DadosEntidades.CodInterno`
- `TabelaPadrão` → `ProdutosTabelas.CodInterno`
**SSL:**
- `0`: Nenhum
- `1`: SSL
- `2`: SSL/TLS
**EmpPABX:**
- `0`: Liberty
- `1`: SNEP
- `2`: SNEP 3/MBX
- `3`: VipPhone
- `4`: Fortics
- `5`: GoTo Voice
**VisãoCancelamento:**
- `0`: Todas as etapas
- `1`: Etapas Financeiras
- `2`: Etapas de Ordens de Serviço
**VisãoAndamento:**
- `0`: Todas as etapas
- `1`: Etapas Financeiras
- `2`: Etapas Técnicas
- `3`: Etapas de Vendedor
**AjusteDPLTipo:**
- `0`: Todas
- `1`: Contas a Receber
- `2`: Contas a Pagar
- **Campos:**
- `Usuário`: usuário
- `Senhasis`: senha do sistema
- `Empresa`: empresa inicial de login
- `ImpressoraNota`: depreciado
- `ImpressoraPadrão`: depreciado
- `ImpressoraPDF`: depreciado
- `TempoTestaAviso`: tempo em minutos para visualizar avisos
- `TempoAviso`: tempo do aviso em tela
- `AvisaOSExcedida`: se avisa OSs fora do prazo
- `AvisaOrçamentoLiberar`: se avisa orçamentos pendentes de liberação
- `AvisaOrçamentoLiberado`: se avisa orçamentos aguardando abertura de OS
- `AvisaOSFaturar`: se avisa OSs aguardando faturamento
- `Funcionário`: código de vendedor/tecnico vinculado
- `MostraContasReceber`: depreciado
- `MostraContasPagar`: depreciado
- `MostraAbaixoEstoque`: depreciado
- `MostraRequisições`: depreciado
- `MostraPedidos`: depreciado
- `AvisaVeículos`: se mostra aviso de veículos
- `AvisaSegurança`: se mostra aviso dos cadastros de segurança
- `ChaveBiometria`: depreciado
- `NívelLiberação`: nível de liberação que o usuário consegue com a senha
- `IDUsuário`: código interno PK
- `CelularUsuário`: número do celular do usuário
- `AvisaServiçosEntregar`: se avisa clientes pendentes de entrega de serviço
- `ExibeSAC`: identifica como gestor de SAC podendo ver atendimentos a encargos de outros usuários e excluir operações
- `DescontoUsuário`: percentual de desconto vinculado ao usuário 
- `SetorSAC`: setor do SAC vinculado (permite ver os atendimentos do setor)
- `OrdemCrescente`: se no histórico financeiro exibe as duplicatas em ordem crescente ou decrecente
- `FinalizaBorderô`: se finaliza borderos do caixa
- `TempoRetornoLocação`: tempo máximo para retorno de locação específico do usuário
- `FinalizaRequisiçãoVeículos`: em requisições de peças de veículos se permite finalizar
- `Smtp`: se envia o email por SMTP
- `Email`: email do usuário
- `EmailSmtp`: URL do SMTP do usuario
- `EmailAutenticado`: se tem autenticação
- `EmailUsuário`: usuário do email
- `EmailSenha`: senha do email
- `FaturamentoLote`: se visualiza a guia de faturamento em lote nos cadastros de clientes e postos
- `PortaEmail`: portal do SMTP de email
- `SSL`: tipo de SSL do SMTP
- `AssinaturaEmail`: texto de assinatura em emails
- `ConfirmaEmail`: se faz confirmação de email
- `CopiaEmail`: se recebe email em cópia no envio
- `TestaPreventiva`: se avisa sobre clientes com preventivas vencidas
- `TestaContratos`: se avisa sobre clientes com contrato vencidos e a vencer
- `TempoContratos`: tempo em dias antes do vencimento do contrato para aviso
- `AcessoCompleto`: acesso de gerencia, permite em telas visualizar dados de outros vendedores
- `MovEstoqueEntrada`: se em notas de entrada pode alterar o movimento
- `LibertyServidor`: servidor de PABX virtual
- `LibertyRamal`: ramal no servidor de PABX virtual
- `LibertySenha`: senha no servidor de PABX virtual
- `TabelasPermitidas`: lista de tabelas de preço disponíveis para o usuario
- `AvisaPedido`: se avisa sobre pedidos em aberto com data de entrega vencida
- `ExcluiOrçamento`: se permite excluir um orçamento
- `EmpPABX`: tipo de integração PABX virtual
- `AvisaEstoqueMínimo`: se avisa sobre produtos abaixo do mínimo
- `UsuarioGoogle`: depreciado
- `SenhaGoogle`: depreciado
- `TempoGoogle`: depreciado
- `PermiteSerasa`: se pode visualizar/gerar consultas no Serasa/SPC
- `AvisaDesbloqueioCliente`: se avisa sobre clientes com agendamento de reativação vencido
- `criaEditaRelGerador`: sem uso no Service
- `controlaAcessoGerador`: sem uso no Service
- `ImagemUsuário`: bitmap da foto do usuário
- `UsuárioInativo`: se está inativo
- `DataCadastro`: data de cadastro do usuário
- `DataDesativação`: data de desativação do usuário
- `DataSenha`: data da última alteração de senha
- `Identificação`: nome do usuário
- `PerCodigo`: depreciado
- `AcessoCadastroCliente`: string que determina o acesso e alteração para cada tipo de cliente no cadastro
- `VisualizaEmails`: se no gerenciador de emails/SMS/Whats pode ver mensagens de outros usuários
- `OSMobileUsuários`: se no OSMobile pode editar os contatos da central
- `OSMobileAcessos`: se no OSMobile pode editar os acessos da central
- `OSMobileSetores`: se no OSMobile pode editar os setores da central
- `OSMobileServiços`: se no OSMobile pode editar os serviços da OS
- `ÚltimoAcesso`: data e hora do último acesso do usuário
- `NFEEditaAtuPreço`: se na nota de entrada de mercadoria pode selecionar a atualização ou não de preços
- `NFEAtuCusto`: se na nota de entrada de mercadoria sempre atualiza custo
- `NFEAtuPreço`: se na nota de entrada de mercadoria sempre atualiza preço de venda
- `AlteraPedidoEnviado`: se permite alterar um pedido de compra que já foi enviado ao fornecedor
- `TotaisProspects`: se visualiza os cards com totais na tela do prospect
- `AllFinanceiro`: se no APP de gestão permite liberar nível financeiro
- `AllLiberacao`: se no APP de gestão permite liberar
- `AllTecnica`: se no APP de gestão permite liberar nível técnico
- `AllVendas`: se no APP de gestão permite liberar nível vendas
- `AvisaNotas`: se avisa sobre NFEs ainda não enviadas a receita
- `IDColaboradorSigma`: ID no Sigma para OSs
- `ExibeDashCaixa`: se no caixa exibe os Dashboards no topo da tela
- `AvisaOSPortal`: se avisa sobre OSs abertas no Portal
- `AvisaReclamaçãoPortal`: se avisa sobre Reclamações abertas no Portal
- `TempoPreventiva`: tempo em dias para avisar antes do vencimento da preventiva
- `EmailNomeExibição`: nome para exibição do email
- `VisãoCancelamento`: filtro dos processos de cancelamento
- `AcessaHorus`: se tem acesso ao Horus
- `AvisaErroEmail`: se avisa sobre mensagens com erros no MessageHub
- `ErroEmailQuantidade`: quantidade de erros para avisar
- `MigraCarteiras`: se permite migrar as carteiras de cobrança de clientes
- `NãoCancelaOrçamento`: se não permite cancelar orçamentos
- `NãoAcessaVeículos`: se não permite visualizar a guia de veículos no cadastro do cliente
- `ContrapartidasBloqueadas`: contrapartidas de caixa que o usuário não tem acesso a usar
- `OSMobileProdutos`: se no OSMobile permite editar os produtos da OS
- `EmailDireto`: se os emails irão ser enviados sempre pelo MessageHub
- `OcultaOpens`: obsuleto
- `AvisoAguardandoChave`: avisa clientes que estão aguardando a geração de chave
- `PermiteAlterarCaixa`: se permite alterar rateios e centros de resultados nos detalhes do lançamento de caixa
- `PermiteAlterarNossoNumero`: se no ajuste de duplicatas permite alterar o nosso número de contas a receber
- `PermiteOSFormaPagto`: se permite alterar a forma de pagamento em OSs
- `VisãoAndamento`: filtro de processos no andamento de orçamentos
- `NãoCadastraChipGPRS`: depreciado
- `AcessaSenhasGerenciais`: se acessa a aba de senhas gerenciais no configurador geral
- `NFEAtuCST`: se atualiza o CST nas notas fiscais de entrada
- `ConfiguraPortal`: usa no Portal?
- `TabelaPadrão`: tabela de preços padrão para o usuário
- `VisualizaTarefas`: se visualiza as tarefas de todos os usuários
- `ReqAlmoxUsuário`: se visualiza as requisições do almoxarifado de todos os usuários
- `ReqAlmoxEmpresas`: se visualiza as requisições do almoxarifado de todas as empresas
- `ReqAlmoxBaixa`: se permite baixar as requisições do almoxarifado
- `ReqAlmoxCompra`: se permite gerar requisição de compra das requisições do almoxarifado
- `OrçamentoLiberaSemAntecipar`: se permite liberar orçamentos sem atencipação
- `IdFcm`: id para recebimento de notificações no celular
- `OcultaAvisoLiberação`: se não deve exibir aviso de liberações gerenciais pendentes
- `AcessoGecom`: se tem acesso de gerente comercial (permite ver os vendedores vinculados a ele no cadastro)
- `AvisaContasPagar`: se avisa sobre contas a pagar vencidas
- `OcultaBoletoInside`: depreciado
- `AcessoAgenda`: usuários que acessam a agenda do usuário em questão
- `BloqueiaAlteraçãoAçãoVenda`: se permite alterar e excluir ações de vendas
- `ExcluiCompetência`: se permite excluir lançamentos da competência
- `NãoAcessaDadosCobrançaCadastro`: não permite acessar a aba de dados da cobrança no cadastro do cliente
- `LoginAutomatico`: se integra com o Login do Windows
- `OcultaRankingMobile`: depreciado?
- `NãoSenhaSemCobrança`: não pedir liberação para lançar serviços sem cobrança no OS Mobile
- `ReceberEmailAberturaSAC`: se ao incluir um atendimento no SAC deve receber um email avisando
- `OcultarPreçosOSMobile`: se oculta preços de produtos e serviços no OSMobile
- `AvisaRetornoPJ`: se avisa que existem títulos pendentes de baixa no PJBank
- `AvisaVersaoMailServer`: se avisa sobre nova versão do MailServer (depreciado com o MessageHub?)
- `NFEAtuNCM`: se atualiza o NCM nas notas fiscais de entrada
- `OcultaDadosFinanceirosF10`: se na consulta de clientes deve ocultar dados financeiros
- `OcultaSaldosCaixa`: se na tela do caixa deve ocultar os saldos das contas
- `DataUltimaAtualizacao`: data da última busca de novidades do sistema
- `MobileCtrlEstTec`: se controla o estoque do técnico no OSMobile
- `MobileLibEstTec`: se libera o movimento do estoque do técnico com senha no OSMobile
- `AcessoCompletoAceite`: se visualiza todos os processos do aceite digital
- `AvisaVendasDiretas`: se avisa sobre OSs aguardando a conversão para venda direta
- `VisualizaVendedores`: se no Hórus visualiza os vendedores
- `VisualizaTecnico`: se no Hórus visualiza os técnicos
- `VisualizaOs`: se no Hórus visualiza as OSs
- `AcessaRoteirizacaoOs`: se no Hórus acessa a roteirização
- `BaixaFaturamentoOS`: se permite baixar OSs como faturadas no andamento de orçamentos
- `AvisaRequisiçõesCompra`: se avisa sobre requisições de compras pendentes
- `AvisaRequisiçõesAlmox`: se avisa sobre requisições ao almoxarifado pendentes
- `AvisaRequisiçõesVeículos`: se avisa sobre requisições de veículos pendentes
- `NãoPermiteExcluirProdutos`: se não permite excluir produtos e serviços em OSs
- `EmailCópias`: outros emails que devem receber cópia dos emails enviados
- `OcultarLocalVeículos`: ocultar local de botão e módulo no cadastro dos veículos
- `AvisaValidadeOrçamentos`: avisa sobre orçamentos perdendo a validade
- `DiasAvisoValidade`: quantidade de dias antes para aviso de orçamentos perdendo a validade
- `AvisaFimContratoPostoServiço`: se avisa sobre postos de serviço próximos do vencimento do contrato
- `OSMobileEditaRastreador`: se no OSMobile permite alterar o rastreador
- `AvisaRetornoAssistência`: se avisa sobre produtos com data de retorno da assistência vencida
- `TempoDiasAssistência`: quantidade de dias antes do vencimento do retorno da assistência para aviso
- `AjusteDPLTipo`: tipo de acesso ao ajuste de duplicatas
- `NãoListarSac`: não exibir o usuário nos processos do SAC
- `NãoListarTarefas`: não exibir o usuário nas tarefas
- `EstoquesSemAcesso`: tipos de estoque ao qual o usuário não deve ter acesso
- `PermiteCobrançaAvulsa`: se pode gerar cobrança avulsa pela tela do histórico financeiro
- `CadNDadosGerais`: se acessa a aba de dados gerais no cadastro de clientes
- `CadNEndEntrega`: se acessa a aba de endereço de entrega no  cadastro de clientes
- `CadNDadosTec`: se acessa a aba de dados técnicos no cadastro de clientes
- `CadNGR`: se acessa a aba de gestão de risco no cadastro de clientes
- `CadNFisica`: se acessa a aba de dados de pessoa física no cadastro de clientes
- `CadNJuridica`: se acessa a aba de dados de pessoa jurídica no cadastro de clientes
- `CadNObs`: se acessa a aba de observações no cadastro de clientes
- `CadNFichaArq`: se acessa a aba de ficha cadastral no cadastro de clientes
- `AvisaOSsImportar`: Se avisa sobre OSs pendentes de importação no monitoramento
- `NãoBaixaPJ`: se quando utiliza processamento automático do retorno da PJ, não seja feito por esse usuário
- `OSMobileGeo`: se permite alterar a geolocalização do OSMobile
- `ForticsChannel`: canal da fortics vinculado ao usuário
- `ForticsAgent`: email da fortics vinculado ao usuário
- `AvisaVEye`: se exibe os alertas sobre Chips GPRS
- `AvisaNovosProspects`: se avisa sobre prospects novos sem ação do vendedor
- `OcultarContratosImprimir`: se não mostra o nó de contratos a imprimir no andamento de orçamentos
- `EscondeTelefoneOS`: ocultar telefone do cliente no OSMobile
- `CentrosCustosAcessos`: centros de custos aos quais o usuário tem acesso
- `OSAlteraCustoTec`: se permite alterar o custo do técnico em serviços nas OSs
- `ReceberEmailSetorSac`: se recebe email automático do SAC para o setor
- `AvisaOSFechadasMobile`: se avisa sobre OSs fechadas no OSMobile aguardando confirmação
- `OcultarCustosF5`: se oculta os custos do produto na consulta
- `Nome`: nome do usuário (Integração Oráculo)
- `Sobrenome`: sobrenome do usuário (Integração Oráculo)
- `EmailCadastro`: (Integração Oráculo)
- `Telefone`: (Integração Oráculo)
- `Celular`: (Integração Oráculo)
- `Apelido`: (Integração Oráculo)
- `Sexo`: (Integração Oráculo)
- `Setor`: (Integração Oráculo)
- `PermiteAtendimento`: (Integração Oráculo)
- `Master`: (Integração Oráculo)
- `AddOraculo`: se foi gravado no Oráculo (Integração Oráculo)
- `EscondeDadosInstala`: ocultar dados da instalação (senhas) no OSMobile
- `CarteiraCobrança`: carteira de cobrança vinculada ao usuário
- `AvisaCampanhasEncerrar`: se avisa sobre campanhas de comissão a encerrar
- `AvisaCampanhasEncerrarDias`: tempo em dias antes de vencer a campanha para aviso
- `EditaFluxoDiario`: se permite alterar os dados da tela do fluxo financeiro diário
- `OSMobileVisMaster`: se no OSMobile Visualiza senha Master, PC e Painel do Sigma
- `AcessoCompletoFinanceiro`: se permite ver os lançamentos de todos os usuários
- `NãoAtualizaVirtueyes`: se não atualiza o vEye nesse usuário
- `LimitarOpTécnico`: limita o usu do Service Control como técnico sem poder alterar certos dados
- `ProspectMobileAcompanhaInstalacao`: se acompanha o andamento da instalação no mobile (depreciado?)
- `OSMobileNaoEnviaCritica`: não envia a critica de fechamento no OSMobile
- `OcultarOutlook`: não lista o usuário no gerenciador de mensagens
- `EmailCadastroVerificado`: se validou o email de cadastro no MailGun
- `EmailCadastroStatus`: status do email na validação MailGun
- `AcessaReimpRecibo`: se pode reimprimir recibos
- `CondutorVinculado`: condutor vinculado ao usuário no Mobile
- `CondutorAcessaTodos`: se acessa todos os veículos no Mobile
- `DescontoUsuárioServ`: percentual limite de desconto para serviços no usuário
- `AlteraVendedorAtualCadCli`: se permite alterar o vendedor atual no cadastro de clientes
- `OSMobileAlteraEtapa`: se permite alterar a etapa das OSs
- `AvisaCashBackPJ`: se avisa sobre processos de cashback no cartão da PJBank
- `AvisaErroMensagem`: se avisa sobre erros em envios de SMS/Whats pelo MessageHub
- `ErroMensagemQuantidade`: quantidade de erros para aviso
- `LiberaPedidoCompra`: se libera pedidos de compra
- `GRCancelaSubstituição`: se permite cancelar uma substituição de veículo
- `NãoEnviaWakeUp`: se não envia duplicatas automaticamente para a WakeUp
- `PersonalizaPainel`: se personaliza Painel de Indicadores/Gerador de Relatórios
- `FeedbackUsuario`: sem uso
- `ReqAlmoxEntrada`: se confirma o recebimento de itens no almoxarifado
- `AvisaCancAbertura`: se avisa sobre cancelamentos aguardando a abertura da OS
- `AvisaCancAberturaDias`: tempo em dias para avisar sobre abertura de OS em cancelamentos
- `AvisaCancFechamento`: se avisa sobre cancelamentos aguardando o fechamento da OS
- `AvisaCancFechamentoDias`: tempo em dias para avisar sobre o fechamento de OS em cancelamentos
- `SkypeCadastro`: (Integração Oráculo)
- `OrcAlteraCusto`: permite alterar o custo de orçamentos em produtos
- `PipeVisualizaSomenteEle`: se não visualiza outros vendedores no gráfico de Pipeline
- `TiposDocumentosPermitidos`: tipos de documentos que o usuário pode consultar nas notas de entrada
- `BuscaProdDetalhes`: se mostra os detalhes na busca de produtos
- `AvisaFornecedorContrato`: se avisa sobre o fim de um contrato com um fornecedor
- `AvisaFornecedorContratoDias`: tempo antes do fim do contrato para aviso
- `MemAndamento`: memoriza o estado dos nós no andamento de orçamentos
- `MemAssistência`: memoriza o estado dos nós no manager de assistência
- `MemVeiSubstituição`: memoriza o estado dos nós nas substituições de veículos
- `MemCompra`: memoriza o estado dos nós no andamento de compras
- `ControlaRastreabilidade`: depreciado
- `BaixaPedidoCompra`: se permite baixa avulsa de pedido de compra
- `OSMobileVisualizaAuxiliar`: se no OSMobile visualiza auxiliar
- `OSMobileVisualizaSubArea`: se no OSMobile visualiza subarea
- `OSMobilePermiteAssumir`: se no OSMobile permite assumir a OS
- `OSMobileRegistraAuxiliar`: se no OSMobile registra o tempo do auxiliar
- `ContratoNaoBaixarSemAceite`: se não permite baixar um contrato sem aceite
- `GeraEmailToken`: se gera email por token
- `OSMobilePermiteOS`: se permite abrir OS pelo OSMobile
- `ComisTecNivel`: nível de liberação de comissão de OSs do usuário
- `PedidoLimiteLibera`: limite de valor para liberação de pedidos
- `OrçamentoNaoFecharSemAceite`: se não permite fechar um orçamento sem aceite
- `AvisaPedidoLibera`: se avisa sobre pedidos de compras aguardando liberação
- `NaoExcluiObsOSNF`: se não permite excluir observações da NF ref OSs Vinculadas
- `ArqNãoInclui`: se não permite incluir arquivos no cadastro de clientes
- `ArqNãoVisualiza`: se não permite visualizar arquivos no cadastro de clientes
- `ArqNãoApagar`: se não permite apagar arquivos no cadastro de clientes
- `FilaSecreNatyUser`: fila da secretária Naty vinculada ao usuário
- `NaoDesativaAuto`: não desativar o usuário automaticamente mesmo com dias sem uso
- `GruposProdBloqueados`: grupos de produtos bloqueados para o usuário na busca
- `NaoAlteraRastrea`: não permite alterar a flag de "Controla Rastreabilidade" em produtos
- `NaoRecalculaMinMax`: não permite recalcular minimo e maximo na sugestão de compras
- `OrçamentoNaoLiberarSemAceite`: não permite liberar orçamento sem aceite
- `AvisaOrcAntecipa`: se avisa sobre Orçamentos Pendentes e/ou Geração Antecipada
- `LimitaAcesso`: se limita o acesso do usuário a certos dias e horários
- `TrabalhaFeriados`: se trabalha em feriados
- `NaoPermiteEdicaoObservacoesOS`: se não permite editar as observações de abertura da OS
- `ContasCaixaBloqueadas`: contas caixa que o usuário não tem acesso
- `EncerrarOSMobile`: se sempre fechar as OSs ao encerrar no OSMobile
- `OSAlteraRequisicao`: se permite alterar OSs com requisições de compras
- `GrupoUsuario`: permite atualizar as permissões de usuários por grupos
- `EditaRelatorio`: se Edita Layouts de Relatórios
- `GoToRamal`: id do ramal na GoTo
- `OrcNaoBaixaAvulso`: não permitir baixa avulsa de notas fiscais no andamento de orçamentos
- `AvisaCancMulta`: se avisa sobre processos de cancelamento aguardando o faturamento da multa
- `PlaOrcTemp`: planílha temporária de orçamento para recarregar em caso de erro
- `OrcAndExibeValores`: se exibe os valores no andamento de orçamentos para este usuário quando configurado para não exibir na unidade

---

### Senhas_Log
- **Descrição:** Log de alteração de usuários, mesmos campos da tabela Senhas com a inclusão de Usuário(que alterou), DataEvento e UsuárioAlterado

---

### SenhasDesativações
- **Descrição:** Desativações temporárias de usuários
- **Campos:**
- `CodInterno`: código interno PK
- `Usuário`: usuário desativado
- `Motivo`: motivo da desativação
- `Início`: data inicial
- `Fim`: data final

---

### SenhasEmailOAuth
- **Descrição:** grava os tokens para o envio de email através do Outlook no oauth

---

### SenhasEtapas
- **Descrição:** Etapas de OS onde o usuário deve receber email ao entrar na etapa
- **Relacionamento:** 
- `Etapa` → `DadosEntidades.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `Usuário`: usuário 
- `Etapa`: etapa da OS 

---

### SenhasHorarios
- **Descrição:** Horarios de acesso do usuário quando limitado
- **Relacionamento:** 
- `IDUsuario` → `Senhas.IDUsuario`
- **Campos:**
- `CodInterno`: código interno PK
- `IDUsuario`: usuário 
- `Dia`: 1 domingo 7 sábado
- `IniciaManha`
- `FimManha`
- `InicioTarde`
- `FimTarde`

---

### SenhasUnidades
- **Descrição:** Unidades com acesso do usuário
- **Relacionamento:** 
- `Unidade` → `Unidades.CodUnidade`
- **Campos:**
- `CodInterno`: código interno PK
- `Usuário`: usuário 
- `Unidade`

---

### SenhasVínculo
- **Descrição:** Vínculo entre usuário e vendedor/técnico por unidade
- **Relacionamento:** 
- `Unidade` → `Unidades.CodUnidade`
- `Vinculado` → `Clientes.CodCliente`
- **Campos:**
- `CodInterno`: código interno PK
- `Usuário`: usuário 
- `Unidade`
- `Vinculado`

---

### Serviços
- **Descrição:** Serviços de instalação e manutenção que não são cobrados mensalmente em recorrência
- **Relacionamento:** 
- `Unidade` → `Unidades.CodUnidade`
- `TipoConsumo` → `DadosEntidades.CodInterno`
- `Fornecedor` → `Clientes.CodCliente`
- **Campos:**
- `CodServiço`: código do serviço
- `Descrição`: nome do serviço
- `AlteraDescrição`: se permite informar a descrição em orçamentos e OSs
- `Unitário`: valor unitário
- `CobraLocado`: se cobra em clientes locados
- `SomaPontos`: se soma os pontos dos produtos para precificar o orçamento
- `Custo`: custo unitário dos serviços
- `Unidade`: unidade vinculada
- `ComissãoServiço`: percentual de comissão do serviço
- `ISSServiço`: percentual de ISS sobre o serviço
- `Inativo`: se está inativo
- `LogServiço`: log de alterações do serviço
- `GrupoOrçamento`: grupo do orçamento que deve constar o serviço
- `CodTipoServiço`: código do tipo do serviço
- `ExigeCobrança`: se sempre exige cobrança
- `CustoTécnico`: custo unitário para pagamento do técnico
- `DescrAlternativa`: descrição alternativa para orçamento
- `ServiçoExpirável`: se baixa serviço expirável
- `PrazoServiço`: validade em dias do serviço
- `TipoConsumo`: forma de consumo (Km ou Un)
- `Fornecedor`: fornecedor que executa o serviço
- `ServiçoVeicular`: se é serviço vinculado a veiculo
- `UnidadesExcessões`: unidades em que não deve constar o serviço se Unidade=0 (compartilhado)

---

### ServiçosAdicionais
- **Descrição:** Tipos de Serviços adicionais recorrentes prestados aos clientes
- **Relacionamento:** 
- `CentroResultados` → `SubContas.CodInterno`
- `CentroResultadosCrédito` → `SubContas.CodInterno`
- `CodPlanoSeguradora` → `SeguradorasPlanos.CodInterno`
- `Unidade` → `Unidades.CodUnidade`
- `CodGrupoServiço` → `DadosEntidades.CodInterno`
- `UnidadeGeração` → `Unidades.CodUnidade`
- `EmpresaGeração` → `Empresas.CodEmpresa`
- **Campos:**
- `CodInterno`: código do serviço adicional
- `Descrição`: nome do serviço adicional
- `CentroResultados`: subconta de resultados que permite calcular o resultado por cliente rateando os valores pagos em contas a pagar nessa conta com os clientes que usam o serviço
- `TextoNF`: depreciado
- `DocumentoOrçamento`: path de documento a ser anexado nos envios de orçamento para o cliente sobre o serviço
- `CentroResultadosCrédito`: subconta de resultados onde gerará lançamentos de caixa e posteriores relatórios da conta específica para o serviço
- `Inativo`: se está inativo
- `PercentualComodato`: quando calculado valor de locação automaticamente, determina quantos porcento do serviço se trata de locação
- `CNAE`: CNAE do serviço para NFSe
- `NãoCobraProporcional`: se o serviço sempre será cobrado integralmente no faturamento mesmo que não utilizado o mês cheio
- `PercentualVeículo`: se o valor do serviço adicional para o cliente será baseado em percentual do valor de veículos
- `PercentualAplicado`: percentual dos veículos a ser aplicado caso PercentualVeículo=1
- `FaturaHora`: se o serviço fatura por hora (usa a escala para calcular)
- `Segunda`: carga horária de Segunda
- `Terça`: carga horária de Terça
- `Quarta`: carga horária de Quarta
- `Quinta`: carga horária de Quinta
- `Sexta`: carga horária de Sexta
- `Sábado`: carga horária de Sábado
- `Domingo`: carga horária de Domingo
- `Feriado`: carga horária de Feriados
- `TrabalhaSábado`: se trabalha no sábado
- `TrabalhaDomingo`: se trabalha no domingo
- `TrabalhaFeriado`: se trabalha no feriado
- `TrabalhaFeriadoIndepente`: se trabalha em feriados independente da escala
- `DescrAlternativa`: descrição alternativa para orçamentos
- `IntegraSeguradora`: se é seguro e deve integrar com a seguradora
- `CodPlanoSeguradora`: código do plano de seguro vinculado
- `NãoExigeComunicaçãoLiberaçãoOrc`: se existe o serviço adicional para o cliente no orçamento, não solicita o meio de comunicação (portaria etc)
- `Unidade`: unidade vinculada se 0 consta em todas
- `ControlaPreventiva`: se exige OSs preventivas
- `DiasPreventiva`: quantidade de dias padrão para a preventiva
- `ObsPreventiva`: observação padrão para a preventiva
- `ContratoCerca`: se gera contrato de cerca (Inviolável)
- `ContratoImagem`: se gera contrato de imagem (Inviolável)
- `CodGrupoServiço`: grupo de serviços, permite filtros em relatórios
- `SolicitaLiberacaoFechamentoOrc`: caso o serviço conste no cliente do orçamento, será solicitada liberação gerencial para fechar o orçamento
- `SemTaticoInv`: gera o contrato sem tático (Inviolável)
- `Portaria`: se é serviço de portaria remota (integração)
- `CodServPrestado`: código do serviço para NFSe
- `NãoReajustarAuto`: ao reajustar automaticamente, este serviço mantém o valor
- `ManterGR`: em caso de desativar os veículos, mantém a cobrança do serviço no cliente
- `NãoSomaMulta`: em caso de cancelamento, o valor do serviço não soma no calculo da multa rescisória
- `UnidadeGeração`: unidade onde o cliente será gerado com esse serviço (Porter)
- `EmpresaGeração`: empresa onde o cliente será gerado com esse serviço (Porter)
- `SomaComodatoFat`: se o valor deste serviço deve somar à locação para faturar em lote

---

### ServiçosAdicionaisDefeitos
- **Descrição:** Vínculo de serviços mensais prestados com defeitos, na OS permite filtrar apenas os defeitos para os serviços que o cliente tem contratado
- **Relacionamento:** 
- `CodServiço` → `ServiçosAdicionais.CodInterno`
- `CodDefeito` → `EntidadesSigma.CodSigma` onde Entidade='D'
- **Campos:**
- `CodInterno`: código interno PK
- `CodServiço`
- `CodDefeito`

---

### ServiçosAdicionaisMínimo
- **Descrição:** Valor padrão dos serviços adicionais por Unidade
- **Relacionamento:** 
- `CodServiço` → `ServiçosAdicionais.CodInterno`
- `Unidade` → `Unidades.CodUnidade`
- **Campos:**
- `CodInterno`: código interno PK
- `CodServiço`
- `Unidade`
- `ValorMínimo`: valor mínimo para venda
- `Custo`: valor de custo de prestação do serviço

---

### ServiçosAdicionaisPacotes
- **Descrição:** Vinculo com serviços expiráveis, identifica os serviços que podem ser prestados caso o cliente contrate este pacote (serviço adicional)
- **Relacionamento:** 
- `CodServiçoAdicional` → `ServiçosAdicionais.CodInterno`
- `CodServiço` → `Serviços.CodServiço`
- **Campos:**
- `CodInterno`: código interno PK
- `CodServiçoAdicional`
- `CodServiço`
- `Quantidade`: quantidade de unidades do serviço

---

### ServiçosTextos
- **Descrição:** Configuração de textos para a NF relacionado ao serviço adicional por empresa
- **Relacionamento:** 
- `CodServiço` → `ServiçosAdicionais.CodInterno`
- `Empresa` → `Empresas.CodEmpresa`
- **Campos:**
- `CodInterno`: código interno PK
- `CodServiço`
- `Empresa`
- `Texto`: texto para a NF
- `TextoComodato`: texto para a NF de locação

---

### SigmaConferência
- **Descrição:** Tabela com dados temporários usada para conferência dos cadastros entre o Service e o monitoramento

---

### SigmaOndemand
- **Descrição:** São os deslocamentos ondemand realizados no Sigma, para cobrança no Service
- **Relacionamento:** 
- `CodServiço` → `ServiçosAdicionais.CodInterno`
- `EmpresaSigma` → `ConexãoSigma.CodInterno`
- `CodCliente` → `Clientes.CodCliente`
- `FaturadoPlanílha` → `NotasFiscaisSaída.Planílha`
- **Campos:**
- `CodInterno`: código interno PK
- `CodHistórico`: código do deslocamento no sigma
- `Central`: id da central
- `Partição`: id da partição
- `EmpresaSigma`: integração que importou
- `DataDeslocamento`: data e hora do deslocamento
- `CGCCPF`: CPF ou CNPJ do cliente
- `Razão`: Razão do cliente
- `Fantasia`: Fantasia do cliente
- `CodCliente`: Código do cliente no Service se localizado pela central
- `Faturado`: se foi faturado
- `FaturadoPlanílha`: planílha da nota que faturou
- `VinculadoPor`: quem fez o vínculo com o cliente no Service
- `VinculadoEm`: quando foi feito o vínculo
- `Ignorar`: se o deslocamento não deve ser cobrado
- `IgnorarPor`: quem determinou a não cobrança
- `IgnorarEm`: quando determinou a não cobrança
- `ValorFaturado`: valor cobrado pelo 

---

### SLAOSs
- **Descrição:** SLA de atendimento de OSs
- **Relacionamento:** 
- `Unidade` → `Unidades.CodUnidade`
- `DefeitoOS` → `EntidadesSigma.CodSigma` onde Entidade='D'
**Status:**
- `A`: Ativa
- `I`: Inativa
**TipoHoras:**
- `1`: Corridas
- `2`: Úteis
- **PrioridadeOS:**
- `A`: alta
- `N`: normal
- `B`: baixa
**OperaçãoOS:**
- `A`: Ampliação
- `I`: Interna
- `M`: Manutenção
- `P`: Preventiva
- `R`: Retirada de Equipamentos/Cancelamento de Contrato
- `V`: Vendas Instalação
- **Campos:**
- `CodInterno`: código interno PK
- `Status`: status do SLA
- `Unidade`: unidade vinculada
- `Nome`: nome do SLA
- `TipoHoras`: forma de contagem de horas
- `Feriado`: se trabalha em feriados
- `PrimeiroAtendimento`: se controla primeiro atendimento da OS
- `HorasPrimeiroAtendimento`: em quantas horas deve acontecer o primeiro atendimento
- `FechamentoOS`: se controla o fechamento da OS
- `HorasFechamento`: em quantas horas deve acontecer o fechamento da OS
- `PrioridadeOS`: qual a prioridade se destina o SLA
- `OperaçãoOS`: qual operação se destina o SLA
- `DefeitoOS`: qual o tipo de defeito se destina o SLA

---

### SLAOSsHorarios
- **Descrição:** Cadastra os tempos de atendimento nos dias da semana para calculo do SLA
- **Relacionamento:** 
- `CodRegra` → `SLAOSs.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `CodRegra`: código do SLA
- `Dia`: dia da semana onde 1 é domingo e 7 é sábado
- `IniciaManha`: hora de início na manhã
- `FimManha`: hora de fim na manhã
- `InicioTarde`: hora de início na tarde
- `FimTarde`: hora de fim na tarde

---

### SMSConfigMessageHub
- **Descrição:** Manipulado pelo MessageHub

---

### SMSControle
- **Descrição:** São os registros de SMS ou Whats gerenciados pelo MessageHub
- **Relacionamento:** 
- `CodCliente` → `Clientes.CodCliente`
- `CodPerfil` → `SMSPerfil.CodInterno`
- `CodDuplicata` → `ContasReceber.CodInterno`
- `CodDuplicata` → `ContasReceber.CodInterno`
- `Empresa` → `Empresas.CodEmpresa`
**Status:**
- `A`: A enviar
- `X`: Enviado
- `C`: Envio Cancelado
- **Campos:**
- `CodInterno`: código interno PK
- `CodCliente`: código do cliente
- `Celular`: numero para envio
- `Mensagem`: mensagem
- `DataGeração`: quando gerou
- `DataEnvio`: quando enviou
- `TentativaEnvio`: quando tentou envio com erro
- `TextoErro`: erro recebido
- `Status`: status da mensagem
- `TentativasEnvio`: quantidade de tentativas de envio
- `CodPerfil`: perfil que gerou a mensagem
- `CodDuplicata`: duplicata vinculada a mensagem
- `Whats`: se envia por WhatsApp
- `ExcluídoPor`: quem cancelou
- `ExcluídoData`: quando cancelou
- `ExcluídoMotivo`: motivo do cancelamento
- `CodLembrete`: depreciado
- `Empresa`: empresa vinculada
- `CanalEnvioWhatsMH`: usado pelo MessageHub
- `PrioridadeEnvio`: prioridade para enviar de 0 a 5
- `Usuario`: quem gerou a mensagem
- `TemplateWhats`: nome do template que deve ser enviado o WhatsApp
- `TemplateWhatsVariaveis`: lista de variáveis que devem ser enviadas no template separadas por pipe |

---

### SMSPerfil
- **Descrição:** São os perfis que geram automaticamente mensagens e emails para cobrança ou avisos
- **Relacionamento:** 
- `SituaçãoCliente` → `DadosEntidades.CodInterno`
- `TipoFaturamento` → `TiposFaturamento.CodTipoFaturamento`
- `TemplateWhats` → `TemplateFortics.CodInterno`
**TipoPessoa:**
- `A`: Ambos
- `F`: Pessoa Física
- `J`: Pessoa Jurídicao
**TipoEnvio:**
- `0`: SMS
- `1`: Email
- `3`: WhatsApp
**NãoCobrar:**
- `0`: Todos
- `1`: Sim
- `2`: Não
**FiltroCliFatStatus:**
- `0`: Todos
- `1`: Ativo
- `2`: Inativo
- **Campos:**
- `CodInterno`: código interno PK
- `Nome`: nome do perfil
- `TextoSMS`: texto a ser enviado na mensagem SMS/WhatsApp
- `DiaIni`: intervalo de dias da duplicata inicial
- `DiaFim`: intervalo de dias da duplicata final
- `FormasPagamento`: lista de formas de pagamento que devem entrar no filtro
- `TipoPessoa`: filtra tipo de pessoa do cadastro de clientes
- `DataInício`: a partir de que dia inicia o perfil
- `HoraEnvio`: hora de geração das mensagens
- `Empresas`: lista de empresas que devem entrar no filtro 
- `TipoVencimento`: 1 - filtrar pelo vencimento atual; 2 - pelo vencimento original
- `Ativo`: se o perfil está ativo
- `LogEventos`: eventos do perfil
- `ÚltimaExecução`: última vez que o perfil foi acionado
- `TipoEnvio`: forma de envio da mensagem
- `ExcluídoMotivo`: motivo do cancelamento
- `CodLembrete`: depreciado
- `Empresa`: empresa vinculada
- `CanalEnvioWhatsMH`: usado pelo MessageHub
- `PrioridadeEnvio`: prioridade para enviar de 0 a 5
- `Usuario`: quem gerou a mensagem
- `TemplateWhats`: nome do template que deve ser enviado o WhatsApp
- `TemplateWhatsVariaveis`: lista de variáveis que devem ser enviadas no template separadas por pipe |
- `EmailRTF`: gravava o RTF do email, agora o mesmo html
- `EmailHTML`: html do email de envio
- `RuleID`: depreciado
- `AnexaBoleto`: se anexa o boleto com a mensagem
- `CarteirasCob`: lista de carteiras de cobrança incluídas no filtro
- `NãoCobrar`: se leva em conta a flag de "Não Cobrar" do cadastro de clientes
- `EmailCCo`: email para cópia oculta
- `DiasRestritos`: lista de dias onde não deve gerar mensagens
- `SituaçãoCliente`: filtro pela situação do cliente no cadastro
- `ServiçosAdicionais`: filtro por serviços adicionais
- `SomenteEntradaConfirmada`: filtrar somente duplicatas que receberam retorno de entrada no banco
- `VersaoMailServer`: depreciado
- `FiltraOpção`: filtro de opção de envio de boletos
- `MínimoMédiaAtrasos`: filtro sobre a média de atraso do cliente
- `FiltroConceito`: filtro sobre o conceito Service
- `TipoFaturamento`: filtro sobre o tipo de faturamento no cadastro
- `CentroResultadosDPL`: lista de centro de resultados no filtro
- `ForticsChannel`: canal da Fortics para envio das mensagens
- `ForticsAgent`: agente da Fortics para envio das mensagens
- `CarteirasCli`: lista de carteiras de clientes no filtro
- `GrupoEconomico`: lista de grupos economicos de clientes no filtro
- `FiltroCliFatStatus`: filtro por status do faturamento em lote
- `RegistraCobranca`: se grava como uma cobrança na tabela Cobrança
- `NatyURLEnvio`: configuração do endpoint da Naty para envio de WhatsApp
- `NatyChave`: chave Naty
- `NatyCanal`: canal Naty
- `FilaSecreNatyPerfil`: fila Naty
- `SomenteSemProtesto`: filtra somente duplicatas sem protesto
- `EnviaTodosContatos`: gera mensagem para todos os contatos do cliente
- `IncluirDuplicataDescontada`: se inclui duplicatas com desconto em banco
- `TemplateWhats`: template do WhatsApp a ser utilizado (Fortics)
- `GeraDupAcessoria`: se gera mensagem para duplicatas em assessoria de cobrança
- `UsaDadosGerais`: se usa os endereços dos dados gerais
- `UsaDadosNota`: se usa os endereços dos dados de nota
- `UsaDadosCobrança`: se usa os endereços dos dados de cobrança
- `UsaDadosRepLegal`: se usa os endereços dos dados do representante legal
- `UsaDadosTec`: se usa os endereços dos dados técnicos
- `UsaCanalSecreNaty`: se a conexão da Naty é feita por canal

---

### SpedICMSCréditos
- **Descrição:** Depreciado

---

### STVInvestidor
- **Descrição:** Depreciado

---

### SubÁreas
- **Descrição:** Cadastro de SubÁreas de atendimento
- **Relacionamento:** 
- `Área` → `Áreas.CodÁrea`
- `Técnico` → `Clientes.CodCliente`
- `Unidade` → `Unidades.CodUnidade`
- **Campos:**
- `CodSubÁrea`: código interno PK
- `Área`: Área vinculada
- `DescrSub`: nome da subárea
- `Técnico`: técnico responsável
- `Unidade`: unidade vinculada
- `PrazoPrimeiro`: tempo em horas para o primeiro atendimento
- `PrazoFinal`: tempo em horas para o fechamento da OS

---

### SubÁreasTécnicos
- **Descrição:** Técnicos vinculados a uma SubÁrea
- **Relacionamento:** 
- `CodSubÁrea` → `SubÁreas.CodSubÁrea`
- `Técnico` → `Clientes.CodCliente`
- **Campos:**
- `CodInterno`: código interno PK
- `CodSubÁrea`
- `Técnico`

---

### SubContas
- **Descrição:** Contas contábeis ou contas de receita e despesa, também chamadas de centro de resultados
- **Relacionamento:** 
- `CentroResultados` → `CentroResultados.CodInterno`
- `DespVeículos` → `VeículosDespesas.CodDespesa`
- `CentroVinculado` → `Centros.CodInterno`
- **Campos:**
- `CodInterno`: código da conta PK
- `Descrição`: nome da conta de receita ou despesa
- `CentroResultados`: centro de resultados vinculado
- `Veículos`: se movimenta despesa de veículos
- `DespVeículos`: qual tipo de despesa de veículos está vinculada
- `Detalhada`: se recebe lançamento em detalhes
- `ContaExportacao`: identificação para exportação contábil
- `Inativo`: se a subconta está inativa
- `CentroVinculado`: centro de custo vinculado a esta subconta
- `SomaBI`: depreciado

---

### SubContasCentros
- **Descrição:** Usado apenas para exportação contábil
- **Relacionamento:** 
- `SubConta` → `SubContas.CodInterno`
- `Empresa` → `Empresas.CodEmpresa`
- **Campos:**
- `CodInterno`: código interno PK
- `Empresa`
- `SubConta`
- `CentroCusto`: identificação para gerar na exportação
- `CentroLucro`: identificação para gerar na exportação

---

### SubContasDetalhes
- **Descrição:** Em contas detalhadas, determina os detalhes que rateiam os valores
- **Relacionamento:** 
- `CodConta` → `SubContas.CodInterno`
- `Unidade` → `Unidades.CodUnidade`
- **Campos:**
- `CodInterno`: código interno PK
- `CodConta`: subconta de resultados
- `Descrição`: descreve o detalhamento
- `Unidade`: unidade vinculada
- `Inativo`: se o detalhamento está ativo

---

### SubContasDetalhesMovimento
- **Descrição:** São os valores pagos em cada detalhe da subconta de resultados
- **Relacionamento:** 
- `CodDetalhe` → `SubContasDetalhes.CodInterno`
- `Empresa` → `Empresas.CodEmpresa`
- `Planílha` → `MovimentoCaixa.Planílha`
- **Campos:**
- `CodInterno`: código interno PK
- `CodDetalhe`
- `Data`: data do lançamento
- `Empresa`
- `Valor`: valor lançado para o detalhe
- `Planílha`: planílha do lançamento de caixa do movimento

---

### SubContasDetalhesPrevisão
- **Descrição:** Grava as previsões mensais para detalhamentos de contas
- **Relacionamento:** 
- `CodDetalhe` → `SubContasDetalhes.CodInterno`
- `Empresa` → `Empresas.CodEmpresa`
- **Campos:**
- `CodInterno`: código interno PK
- `CodDetalhe`
- `Mês`: mês de referência
- `Ano`: ano de referência
- `Empresa`: empresa vinculada
- `Previsto`: valor da previsão para o detalhe

---

### SugestãoCompra
- **Descrição:** Tabela temporária para apoio da sugestão

---

### SupervisorAtendimentosNotificacao
- **Descrição:** Usado pelo OSMobile?

---

### SystemSatClientes
- **Descrição:** Tabela temporária para apoio da conferência do rastreamento

---

### SystemSatRastreadores
- **Descrição:** Tabela temporária para apoio da conferência do rastreamento

---

### SystemSatVeiculos
- **Descrição:** Tabela temporária para apoio da conferência do rastreamento

---

### TabelaAcsp
- **Descrição:** Grava os percentuais aproximados de tributos por NCM para constar nas notas fiscais
- **Relacionamento:** 
- `CodDetalhe` → `SubContasDetalhes.CodInterno`
- `Empresa` → `Empresas.CodEmpresa`
- **Campos:**
- `CodInterno`: código interno PK
- `NCM`: NCM do produto
- `Ex`: não usado
- `Tabela`: não usado
- `aliqNac`: percentual aproximado interno
- `alicImp`: percentual aproximado importação
- `alicEstadual`: não utilizado
- `alicMunicipal`: não utilizado
- `UF`: não utilizado
- `InicioVigencia`: não utilizado
- `FimVigencia`: não utilizado

---

### TabelaAcsp
- **Descrição:** Grava os percentuais aproximados de tributos por NCM para constar nas notas fiscais
- **Campos:**
- `CodInterno`: código interno PK
- `NCM`: NCM do produto
- `Ex`: não usado
- `Tabela`: não usado
- `aliqNac`: percentual aproximado interno
- `alicImp`: percentual aproximado importação
- `alicEstadual`: não utilizado
- `alicMunicipal`: não utilizado
- `UF`: não utilizado
- `InicioVigencia`: não utilizado
- `FimVigencia`: não utilizado

---

### TabelaAcspServiços
- **Descrição:** Grava os percentuais aproximados de tributos por tipo de serviço para constar nas notas fiscais
- **Campos:**
- `CodInterno`: código interno PK
- `CodServiço`: código de serviço
- `Ex`: não usado
- `Tabela`: não usado
- `aliqNac`: percentual aproximado interno
- `alicImp`: percentual aproximado importação
- `alicEstadual`: não utilizado
- `alicMunicipal`: não utilizado

---

### Tarefas
- **Descrição:** São as tarefas gravadas no sistema
- **Relacionamento:** 
- `Predecessora` → `Tarefas.CodInterno`
- `ClienteVinculado` → `Clientes.CodCliente`
**Status:**
- `A`: Em Andamento
- `P`: Paralisada
- `I`: A Iniciar
- `X`: Concluída
- `C`: Cancelada
**Prioridade:**
- `I`: Imediata
- `A`: Alta
- `M`: Média
- `B`: Baixa
- **Campos:**
- `CodInterno`: código interno PK
- `Descrição`: descreve a tarefa a ser executada
- `Status`: status da tarefa
- `Responsável`: responsável pela tarefa
- `DataGeração`: quando gravou
- `Usuário`: quem gravou
- `PrevisãoEncerramento`: previsão de encerramento
- `Encerramento`: data de encerramento
- `LogAlterações`: alterações feitas na tarefa
- `Colaboradores`: quem vai executar a tarefa
- `Predecessora`: identifica a atividade pai de onde esta foi gerada
- `LidoPor`: quem visualizou a tarefa
- `DescriçãoTXT`: descrição da tarefa sem a formatação HTML
- `Prioridade`: prioridade da tarefa
- `ClienteVinculado`: cliente vinculado a tarefa
- `Tempo`: tempo gasto com a tarefa

---

### TarefasComentários
- **Descrição:** São comentários feitos em tarefas
- **Relacionamento:** 
- `CodTarefa` → `Tarefas.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `CodTarefa`
- `Usuário`: quem comentou
- `DataComentário`: quando comentou
- `Comentário`: o comentário
- `LidoPor`: usuários que fizeram a visualização do comentário

---

### TarefasLog
- **Descrição:** Log de alterações do texto da tarefa
- **Relacionamento:** 
- `CodTarefa` → `Tarefas.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `CodTarefa`
- `Texto`: texto gravado
- `Usuário`: quem gravou
- `Data`: quando gravou

---

### tblPapers
- **Descrição:** depreciado

---

### TécnicosExceçõesHorários
- **Descrição:** Dias e horários que o técnico não trabalha para montagem da agenda técnica 
- **Relacionamento:** 
- `Técnico` → `Clientes.CodCliente`
- **Campos:**
- `CodInterno`: código interno PK
- `Técnico`
- `DataInicial`: se por período determina a data inicial
- `DataFinal`: se por período determina a data final
- `Dias`: string com o dias que determina quando vale a exceção
- `HoraInicial`: hora inicial
- `HoraFinal`: hora final
- `Descrição`: descrição do motivo

---

### TécnicosHorários
- **Descrição:** Dias e horários que o técnico trabalha para montagem da agenda técnica 
- **Relacionamento:** 
- `Técnico` → `Clientes.CodCliente`
- **Campos:**
- `CodInterno`: código interno PK
- `Técnico`
- `Dia`: dia da semana onde 1 é domingo e 7 é sábado
- `Ativo`: se o dia está ativo (trabalha)
- `Início`: horário de início do primeiro período
- `Fim`: horário final do primeiro período
- `InícioTarde`: horário de início do segundo período
- `FimTarde`: horário final do segundo período

---

### TécnicosVinculados
- **Descrição:** Vínculo entre técnicos em unidades diferentes
- **Relacionamento:** 
- `Técnico` → `Clientes.CodCliente`
- `Vinculado` → `Clientes.CodCliente`
- **Campos:**
- `CodInterno`: código interno PK
- `Técnico`
- `Vinculado`

---

### TelefonesUteisPortal
- **Descrição:** utilizado pelo IntegraService?

---

### TelefoneÚteis
- **Descrição:** Telefones úteis cadastrados
- **Relacionamento:** 
- `Unidade` → `Unidades.CodUnidade`
- **Campos:**
- `CodInterno`: código interno PK
- `Nome`: nome do contato
- `Fone1`
- `Fone2`
- `Fax`: fone 3
- `Unidade`

---

### pastas Temp* são dados temporários que o sistema utiliza para montagem de telas e relatórios

---

### TermosAceiteLGPD
- **Descrição:** Utilizada no OSMobile?

---

### Texto
- **Descrição:** Cadastro de textos configurados em diversas telas do sistema
- **Relacionamento:** 
- `Unidade` → `Unidades.CodUnidade`
- **Campos:**
- `Identifica`: identificação do texto configurado
- `Texto`: o texto em si
- `Unidade`: unidade vinculada
- `CodInterno`: codigo interno PK
- `Título`: titulo do texto (quando há)
- `OpOS`: tipo de operação de OS em que o texto será usado
- `Assunto`: assunto, geralmente em configurações de email
- `TemplateWhats`: em caso de integração com API oficial, qual o template que está vinculado o texto na Meta

---

### TipoServiços
- **Descrição:** Tipos de serviços prestados para NFSe
- **Campos:**
- `Código`: código do serviço
- `Descrição`: descrição do serviço
- `NãoRetemContribuicoes`: se não retem contribuições (PIS, COFINS...)
- `NãoRetemIRRF`: se não retem IRRF
- `ExigeART`: se exige ART do CREA

---

### TipoServiçosTributação
- **Descrição:** Cadastro de tipos de serviço por empresa com a tributação
- **Relacionamento:** 
- `Empresa` → `Empresas.CodEmpresa`
- `CodServiço` → `TipoServiços.Código`
**TipoInscr:**
- `A`: Ambos
- `I`: Inscrito
- `N`: Não Inscrito
- **Campos:**
- `CodInterno`: código interno PK
- `Empresa`
- `CodServiço`: código do serviço
- `UsaTributaçãoServiço`: se vai usar a tributação configurada nessa tabela para o serviço ou padrão
- `DISS`: se retem ISS
- `ISS`: percentual do ISS para o serviço
- `DIRRF`: se retem IRRF
- `IRRF`: percentual do IRRF para o serviço
- `DINSS`: se retem INSS
- `INSS`: percentual do INSS para o serviço
- `DPIS`: se retem PIS
- `PIS`: percentual do PIS para o serviço
- `DCOFINS`: se retem COFINS
- `COFINS`: percentual do COFINS para o serviço
- `DCSLL`: se retem CSLL
- `CSLL`: percentual do CSLL para o serviço
- `CodMunicipioIBGE`: caso o cadastro seja para uma cidade, identifica o código do IBGE dela
- `TipoInscr`: tipo de inscrição municipal do destinatário ao qual a tributação vale
- `TPIss`: tipo de ISS para a NFSe
- `BaseRetençãoIRRF`: valor mínimo base para retenção de IRRF
- `ISSRet`: retenção de ISS

---

### TiposEstoque
- **Descrição:** Tipos de estoque cadastrados
- **Relacionamento:** 
- `Unidade` → `Unidades.CodUnidade`
- `Técnico` → `Clientes.CodCliente`
- **Campos:**
- `CodEstoque`: código do tipo de estoque
- `TipoEstoque`: nome do tipo de estoque
- `SenhaCarac`: senha para liberar a movimentação desse estoque na entrega (técnico)
- `SenhaBio`: sem uso
- `Unidade`
- `Técnico`: técnico vinculado
- `Inativo`: se o tipo de estoque está inativo
- `OcultarSped`: se o tipo de estoque não deve somar nos inventários de Sped e Sintegra

---

### TiposFaturamento
- **Descrição:** Cadastro de tipos de faturamento em lote
- **Relacionamento:** 
- `Unidade` → `Unidades.CodUnidade`
- **Campos:**
- `CodTipoFaturamento`: código do tipo
- `TipoFaturamento`: nome do tipo
- `Unidade`
- `Inativo`: se está inativo
- `EmpresasExceção`: empresas onde o tipo de faturamento não deve constar

---

### TributaçãoImpostosFederaisAtividade
- **Descrição:** Configuração de tributação de impostos federais por atividade do cliente
- **Relacionamento:** 
- `Empresa` → `Empresas.CodEmpresa`
- `CodAtividade` → `DadosEntidades.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `Empresa`
- `CodAtividade`
- `IRRF`: percentual do IRRF
- `DIRRF`: se retém IRRF
- `INSS`: percentual do INSS
- `DINSS`: se retém INSS
- `PIS`: percentual do PIS
- `DPIS`: se retém PIS
- `COFINS`: percentual do COFINS
- `DCOFINS`: se retém COFINS
- `CSLL`: percentual do CSLL
- `DCSLL`: se retém CSLL

---

### Trocas
- **Descrição:** Depreciado

---

### Unidades
- **Descrição:** Unidades do sistema
- **Relacionamento:** 
- `CentroResultadosDécimo` → `Unidades.CodUnidade`
- `EstoqueVenda` → `TiposEstoque.CodEstoque`
- `EstoqueEmprestimo` → `TiposEstoque.CodEstoque`
- `EstoqueGarantia` → `TiposEstoque.CodEstoque`
- `EstoqueGratifica` → `TiposEstoque.CodEstoque`
- `EstoqueInterno` → `TiposEstoque.CodEstoque`
- `EstoqueLocado` → `TiposEstoque.CodEstoque`
- `ClienteModelo` → `Clientes.CodCliente`
- `FornecedorISS` → `Clientes.CodCliente`
- `FornecedorIRRF` → `Clientes.CodCliente`
- `FornecedorINSS` → `Clientes.CodCliente`
- `FornecedorPIS` → `Clientes.CodCliente`
- `FornecedorCOFINS` → `Clientes.CodCliente`
- `FornecedorCSLL` → `Clientes.CodCliente`
- `FormaPagamentoPadrãoOS` → `FormasPagto.CodFormaPagto`
- `CentroComissãoTécnico` → `SubContas.CodInterno`
- `HistóricoCréditosNFE` → `HistóricosCaixaContrapartida.CodContrapartida`
- `LibEstVenda` → `TiposEstoque.CodEstoque`
- `LibEstLocação` → `TiposEstoque.CodEstoque`
- `LibEstRastreamento` → `TiposEstoque.CodEstoque`
- `COIVendaBalcão` → `ConfiguraçãoCOI.Identificação`
- `CentroResultadosPostos` → `SubContas.CodInterno`
- `FornecedorISSCentro` → `SubContas.CodInterno`
- `FornecedorIRRFCentro` → `SubContas.CodInterno`
- `FornecedorINSSCentro` → `SubContas.CodInterno`
- `FornecedorPISCentro` → `SubContas.CodInterno`
- `FornecedorCOFINSCentro` → `SubContas.CodInterno`
- `FornecedorCSLLCentro` → `SubContas.CodInterno`
- `GRTrocaTitularidadeCancelamento` → `DadosEntidades.CodInterno`
- `OSServHoras` → `Serviços.CodServiço`
- `ContaDevolOS` → `SubContas.CodInterno`
- `COIFatVendaNFCe` → `ConfiguraçãoCOI.Identificação`
- `CentroComissãoVendedor` → `SubContas.CodInterno`
- `CentroConsertos` → `SubContas.CodInterno`
- `CodServHorus` → `Serviços.CodServiço`
- `AsaasContrapartida` → `HistóricosCaixaContrapartida.CodContrapartida`
- `COIVendaBalcãoNFCe` → `ConfiguraçãoCOI.Identificação`
- `EmpresaPadrãoCadastro` → `Empresas.CodEmpresa`
- `MsgBoasVindasTemplate` → `TemplateFortics.CodInterno`
- `TemplateBloqueio` → `TemplateFortics.CodInterno`
- `TemplateDesbloqueio` → `TemplateFortics.CodInterno`
- `ProdutoModelo` → `Produtos.CodProduto`
- `CobranceContrapartida` → `HistóricosCaixaContrapartida.CodContrapartida`
**TipoIndicação:**
- `0`: Valor Fixo
- `1`: Percentual da mensalidade do indicante
- `2`: Percentual da mensalidade do indicado
**SacEnviarEmailCliente:**
- `0`: Não envia email
- `1`: Enviar email no cadastro da reclamação
- `2`: Enviar email no fechamento da reclamação
- `3`: Enviar email no cadastro e fechamento da reclamação
**TipoEnvioWhats:**
- `0`: Fortics
- `1`: Bten
- `2`: Secretária Naty
**BloquearProdutosSemAtualizaçãoTipo:**
- `0`: Custos e preço de venda
- `1`: Custo
- `2`: Custo Gerencial
- `3`: Preço de Venda
- `4`: Nota de entrada (Compra)
**ForticsCloseSession:**
- `0`: Mantem seção aberta
- `1`: Encerra seção
- `2`: Seção transferida para espera na resposta
- `3`: Mantém o status da seção existente
**OrçamentosObrigaTestemunhas:**
- `0`: Não exige
- `1`: Uma testemunha
- `2`: Duas testemunhas
- **Campos:**
- `CodUnidade`: código da unidade
- `Unidade`: nome da unidade
- `Liberação`: criptografado, define até quando está liberada a unidade
- `ModLib`: conjunto de strings que determinam quais módulos estão ativos do sistema
- `LimiteChaves`: se limita a quantidade de chaves a ser criadas no sistema
- `DataEvento`: última verificação de ativação
- `SemChat`: depreciado
- `Bloqueada`: se a unidade está bloqueada
- `SystemsatLogin`: depreciado
- `SystemsatSenha`: depreciado
- `SystemsatEmpresa`: depreciado
- `SystemsatAtiva`: depreciado
- `ZeradaIntegração`: depreciado
- `ParcelamentoMeses`: depreciado
- `ParcelamentoPercentual`: depreciado
- `MobileDistancia`: determina o raio em metros que o técnico pode fazer checkin no mobile no cliente
- `CentroResultadosClienteVendido`: centro de resultados padrão para clientes vendidos
- `CentroResultadosClienteLocado`: centro de resultados padrão para clientes locados
- `CentroResultadosClienteRastreamento`: centro de resultados padrão para clientes de rastreamento
- `AditivoV`: depreciado, passou para tabela de empresas
- `AditivoS`: depreciado, passou para tabela de empresas
- `AditivoR`: depreciado, passou para tabela de empresas
- `AditivoE`: depreciado, passou para tabela de empresas
- `AditivoA`: depreciado, passou para tabela de empresas
- `AditivoT`: depreciado, passou para tabela de empresas
- `AditivoX`: depreciado, passou para tabela de empresas
- `ComissionaMMN`: depreciado
- `PedidosLimite0`: valor para pedidos sem liberação gerencial
- `PedidosLimite1`: valor para pedidos em liberação administrativa (nível 1)
- `ContaExportacao`: conta para exportações contábeis
- `TokenOpens`: depreciado
- `EndereçoOpens`: depreciado
- `SolicitouOpens`: depreciado
- `SeparaChaveSigma`: se a geração de chave será feito em processo separado a liberação do orçamento
- `ReativaSigmaAutomatico`: se deve reativar clientes automaticamente no monitoramento caso paguem as dívidas
- `BuscaTecnicoVendedor`: se permite buscar técnicos nas buscas de vendedores
- `MobileContaDeslocamentoAtendimento`: se considera o tempo de deslocamento no atendimento da OS
- `TipoIntegraçãoGR`: depreciado, foi para o GRIntegrações
- `FulltrackProdução`: depreciado, foi para o GRIntegrações
- `RetornoBaixaDesconto`: limite para baixar o valor como descontos no retorno bancário
- `ContaExportaçãoCaixa`: para exportações contábeis
- `CSTComodato`: CST padrão para locação
- `CSOSNComodato`: CSOSN padrão para locação
- `DataEncerramentoContabil`: trava o sistema para fazer lançamentos anteriores a essa data
- `RegimeCompetência`: se a empresa trabalha gerando lançamentos em regime de competência
- `AditivoY`: depreciado, passou para tabela de empresas
- `COIPerda`: COI utilizado para faturamento das perdas em venda direta
- `COIFatVenda`: COI utilizado para faturamento da venda em NFe
- `EstoqueVenda`: estoque padrão para equipamentos vendidos
- `EstoqueEmprestimo`: estoque padrão para equipamentos emprestados
- `EstoqueGarantia`: estoque padrão para equipamentos em garantia
- `EstoqueGratifica`: estoque padrão para brindes
- `EstoqueInterno`: estoque padrão para uso interno
- `EstoqueLocado`: estoque padrão para equipamento locado
- `PermiteProdutoDuplicado`: se será possível em orçamentos e OSs lançar mais de uma vez o mesmo código de produto
- `APISemax`: caminho da API para integração com o Sentinela da Semax
- `ProspectCadEndereçoTipo`: se a cidade e estado de um novo prospect deve vir de 0 - Cliente Modelo ou 1 - Cadastro da Empresa
- `OrçamentoExigeDataNasc`: se exige data de nascimento para fechar um orçamento
- `OrçamentoExigeAntecipação`: se exige antecipação em orçamentos
- `SomaAdicionaisVeiculos`: se o valor dos adicionais em veículos deve somar para compor o valor mensal
- `SolicitouBoletoInside`: depreciado
- `CentroResultadosDécimo`: subconta em que devem ser criados os contas a receber de faturamento do decimo terceiro
- `OSMobileExibeValor`: se exibe o valor cobrado no OSMobile
- `ClienteModelo`: define o cliente modelo da unidade
- `PrazoSAC`: prazo para atendimento no SAC em dias
- `ContasPagarRetenção`: se grava retenções de impostos como contas a pagar
- `FornecedorISS`: fornecedor para gravar retenções de ISS
- `FornecedorIRRF`: fornecedor para gravar retenções de IRRF
- `FornecedorINSS`: fornecedor para gravar retenções de INSS
- `FornecedorPIS`: fornecedor para gravar retenções de PIS
- `FornecedorCOFINS`: fornecedor para gravar retenções de COFINS
- `FornecedorCSLL`: fornecedor para gravar retenções de CSLL
- `EfetuarRetençãoComodato`: se retem impostos federais em recibos de locação
- `ForçaCartaCobrançaWord`: se força as cartas de cobrança a serem em arquivo Word
- `OcultaDadosZeradosOrçamento`: se oculta blocos zerados no orçamento padrão
- `UsaContadorComodato`: depreciado, foi para tabela empresas
- `SomaFreteICMS`: se soma o frete a base de ICMS
- `NãoPermiteAgrupamentoFatOS`: se não permite fazer o agrupamento de duplicatas no faturamento de OS
- `DecompoeKitOrçamento`: se os kits serão decompostos no orçamento
- `AbreOSWord`: depreciado
- `InformaPrazoContratoOrçamento`: se o prazo de contrato deve ficar visível e alterável no orçamento
- `CancelamentoTipoCálculo`: forma de calcular a multa de contrato 0 - percentual dos produtos locados, 1 - percentual sobre o valor mensal do cliente
- `CancelamentoSobre`: se CancelamentoTipoCálculo=1, no caso de 0 é sobre o restante do prazo de contrato, 1 é sobre um número X de meses
- `CancelamentoMeses`: se CancelamentoSobre=1, define o número X de meses para calculo
- `UsaAceite`: se usa aceite digital
- `EndereçoInternoIntegra`: endereço do integra service para a api do Aceite
- `NãoRatearAdicionais13`: se não rateia os serviços adicionais no faturamento de décimo terceito
- `ExigeEncerramentoAditivo`: se exige que as OSs vinculadas tenham sido finalizadas para baixar o aditivo
- `CFOPsGiro`: lista de CFOPs que devem ser levados em conta no Giro de Estoque
- `NãoFaturarProcessoCancelamento`: não gera faturamento em lote para cliente com processo de cancelamento aberto
- `AtualizarKitsAuto`: se o preço dos kits deve ser atualizado caso algum produto integrante seja reajustado
- `BloqueiaAtribuiçãoProspect`: se não permite que um novo prospect seja vinculado diretamente a um vendedor
- `EnviaEmailCancelamentoSigma`: se permite enviar email ao não importar uma OS do monitoramento
- `SystemSatFranquia`: depreciado, foi para o GRIntegrações
- `SystemSatPortal`: depreciado, foi para o GRIntegrações
- `SystemSatLocaliza`: depreciado, foi para o GRIntegrações
- `EnviaEmailAtendimentoOs`: se envia email ao gravar um atendimento de OS no mobile
- `OSsListarPasta`: se lista todos os arquivos de modelo de OS da pasta configurada
- `SigmaMetodoEstorno`: caso um orçamento liberado que criou uma central no monitoramento seja cancelado, ele deve 0 - Eliminar a central no monitotramento; 1 - Desativar a central no monitoramento
- `ValorPadrãoVeículo`: valor padrão por veículo no rastreamento
- `FatEntregaNFLoca`: se no faturamento na entrega de mercadorias gera nota de locação
- `FatEntregaNFRetLoca`: se no faturamento na entrega de mercadorias gera nota de retorno de locação
- `FatEntregaNFBrinde`: se no faturamento na entrega de mercadorias gera nota de brinde
- `FatEntregaNFEmpr`: se no faturamento na entrega de mercadorias gera nota de empréstimo
- `FatEntregaNFRetEmpr`: se no faturamento na entrega de mercadorias gera nota de retorno de empréstimo
- `FatEntregaNFGarantia`: se no faturamento na entrega de mercadorias gera nota de garantia
- `FatEntregaNFRetGarantia`: se no faturamento na entrega de mercadorias gera nota de retorno de garantia
- `ProspectPreencheCPF`: se no mobile de vendas exige preenchimento do CPF/CNPJ 
- `ProspectConsultaSerasa`: se no mobile de vendas exige consulta serasa do prospect
- `DesativarHorus`: não utilizar georeferenciamento no OS Mobile
- `TamanhoImagensMobile`: tamanho das imagens no mobile: 480;1080;2048
- `NãoPermiteOrçamentoSemAção`: se é obrigatório registrar uma ação de vendas antes de gerar um orçamento para o prospect
- `NãoFecharOrçamentoSemAção100`: se é obrigatório registrar uma ação de vendas com 100% de probabilidade antes de fechar um orçamento do prospect
- `ProspectPrazoEstagnado`: quantidade de dias para considerar um prospect estagnado (que pode ser assumido por outro vendedor)
- `UsaDistratoVeículo`: se faz impressão de distrato no processo de cancelamento de veículos
- `UtilizaPreVendasProspects`: se informa o prévendas nos prospects
- `UtilizaMultiplosVendedoresOrçamentos`: se permite informar múltiplos vendedores em um orçamento
- `UsaIndicaçãoCliente`: se permite informar cliente indicante nos prospects
- `ValorIndicação`: valor/percentual pago por indicação
- `TipoIndicação`: forma de calculo do valor da indicação
- `PrazoBonificaIndicação`: prazo em dias para geração da bonificação da indicação
- `UsaMoedas`: se deve constar conversão de moedas no orçamento (cliente do PY)
- `CotaDolar`: cotação do dolar em relação ao real (se UsaMoedas)
- `CotaGuarani`: cotação do guarani em relação ao real (se UsaMoedas)
- `PermiteSPCSerasaFechamentoOrçamento`: se permite visualizar/consultar o Serasa na tela de fechamento de orçamento
- `ControlaConserto`: se envia para conserto automaticamente ao retirar produtos de OSs de manutenção, preventiva e retirada
- `NãoValidarFoneProspect`: se não valida o telefone para verificar se outro vendedor já está atendendo o prospect
- `SACNãoEnviarEmails`: se não deve enviar emails aos usuários nos processos do SAC
- `ExibeMoni`: depreciado
- `ExibeDemaisSMS`: se exibe todas as empresas integradas de SMS nas configurações (ou somente o InsideSMS)
- `SacEnviarEmailCliente`: configuração do envio de emails para o cliente na movimentação do SAC
- `SacEmailAberturaTexto`: texto do email no cadastro da reclamação
- `SacEmailFechamentoTexto`: texto do email no fechamento da reclamação
- `SacEmailAberturaAssunto`: assunto do email no cadastro da reclamação
- `SacEmailFechamentoAssunto`: assunto do email no fechamento da reclamação
- `CaixaSolicitaLiberaçãoBaixaAssessoria`: se exige liberação gerencial para baixar duplicatas de contas a receber que estejam com a assessoria de cobrança
- `NFAssuntoEnvio`: assunto do email automático na confirmação da NFe
- `NFTextoEnvio`: texto do email automático na confirmação da NFe
- `NFAssuntoCancelamento`: assunto do email automático na confirmação do cancelamento da NFe
- `NFTextoCancelamento`: texto do email automático na confirmação do cancelamento da NFe
- `PermiteTrocaVendedorOSOrçamento`: se na OS de instalação permite trocar o vendedor que foi importado do orçamento
- `PermiteAlterarRPS`: se permite alterar uma RPS (NF) após ela ser enviada para a prefeitura
- `MobileAvisasOSsAgendadasMinutos`: tempo em minutos para aviso para OSs agendadas
- `MobileNotificaçõesOSsMinutos`: a cada quanto tempo deve gerar as notificações no OSMobile
- `OSMobileEmailAlteraçãoCentral`: email que receberá mensagem quando no OSMobile houve alteração dos dados da central
- `FormaPagamentoPadrãoOS`: forma de pagamento padrão para OSs que não vem de orçamento
- `SolicitaSenhaAlteraçãoValorCliente`: se solicita liberação para alterar o valor mensal de um cliente no cadastro
- `NãoSolicitaSenhaAditivos`: se não vai solicitar liberação gerencial para gerar um aditivo de contrato avulso
- `OrçamentosOcultarCrea`: ocultar o valor do CREA da tela e dos orçamentos impressos
- `OrçamentoNãoSolicitaSenhaCancelados`: se não deve solicitar liberação para gerar orçamento para um cliente cancelado
- `ExigeCheckListVeículos`: se no OSMobile será obrigatório preencher o checklist de veículos na instação
- `EndereçoExternoIntegra`: URL do IntegraService que está visível para a WEB
- `SulaméricaUsuário`: usuário de acesso na API da Sulamerica
- `SulaméricaSenha`: senha de acesso na API da Sulamerica
- `SulaméricaTipoAmbiente`: 1 - Produção; 2 - Homologação
- `SulaméricaContador`: gera um contador de operação para uma identidade única do processo
- `AditivoListarTodosPasta`: se lista todos os modelos da pasta na impressão de aditivo de contrato
- `StatusOrçamentoSeparaTipoOS`: se separa OSs por Tipo no Andamento de Orçamento, etapas Aguardando Entrega de Produto/Fechamento da OS
- `NãoBloquearViagensRetroativas`: se nos deslocamentos de veículos o sistema não deve bloquear viagens com KMs menores que o atual
- `BloqueiaAgrupamentoBanco`: se exige liberação gerencial para agrupar/desagrupar duplicata com nosso número/remessa bancária gerada
- `PercentualPadrãoAntecipaçãoOrçamento`: percentual de antecipação esperada nos orçamentos
- `EnviarReciboLocaçãoNFe`: se no email da NFe deve ir anexo o recibo de locação vinculado ao processo
- `NãoSolicitarRepresentanteContratos`: se não solicita dados do representante legal em contratos
- `SystemSatClientTemplateIntegrationCode`: depreciado, foi para o GRIntegrações
- `SystemSatUserProfileTemplateIntegrationCode`: depreciado, foi para o GRIntegrações
- `SystemSatTrackerTemplateIntegrationCode`: depreciado, foi para o GRIntegrações
- `NãoFaturarProcessoCancelamentoGR`: se não deve faturar o veículo caso esteja em processo de cancelamento
- `CentroComissãoTécnico`: subconta de resultados para geração do contas a pagar ao liberar os pagamentos dos técnicos nas OSs
- `SacEmailAcompanhamento`: emails que acompanham os movimentos de reclamações no SAC
- `OSMobileOcultaValorAssinatura`: se no OSMobile oculta o valor total da OS na tela de assinatura
- `ForticsAPI`: endpoint da integração com a Fortics para WhatsApp
- `ForticsApiKey`: ApiKey da integração
- `BloqueioEnviaMensagem`: se envia mensagem SMS/Whats ao bloquear o cliente no monitoramento/rastreamento
- `BloqueioMensagem`: mensagem a ser enviada caso BloqueioEnviaMensagem=1
- `DesbloqueioMensagem`: mensagem a ser enviada no desbloqueio caso BloqueioEnviaMensagem=1
- `RateiaDespesasClientes`: se nas notas de entrada os valores devem ser rateados como despesas entre os clientes para apurar resultado
- `ForticsChannelReturn`: canal de retorno de mensagens Whats da Fortics
- `VEyesUser`: usuário na integração Virtueyes
- `VEyesPass`: senha na integração Virtueyes
- `VEyesAtualizaHoras`: intervalo de atualização
- `VEyesDiasSemConexão`: quantidade de dias para aviso de sem conexão
- `VEyesPercentualPacote`: percentual para aviso de uso do pacote
- `VEyesRaioTolera`: raio em metros tolerado entre a localização do chip e do cliente
- `UsaOSSupervisor`: se usa OSSupervisor (neste caso vai exigir Getec na OS)
- `LimiteComodatoVendedor`: valor de limite mensal de comodato/locação por mês para os vendedores
- `BloqueiaAutomaticamente`: se deve bloquear automaticamente clientes inadimplentes no sistema de monitoramento/rastreamento
- `BloqueiaAutomaticamenteVencimento`: 1 - Considera vencimento original das duplicatas; 2 - Considera vencimento atual
- `BloqueiaAutomaticamenteDuplicatas`: quantidade de duplicatas vencidas para bloqueio
- `BloqueiaAutomaticamenteDias`: tempo em dias de atraso de duplicatas para bloqueio
- `ExigeContagemEntrada`: se nas notas de entrada deve passar pelo processo de contagem
- `ComisBonificaMédia`: para Inviolável, bonificação de média de faturamento
- `ComisBonificaVendaInd`: para Inviolável, bonificação por venda individual
- `ComisBonificaVendaGrupo`: para Inviolável, bonificação por venda do grupo
- `ComisBonificaQtAções`: para Inviolável, bonificação por quantidade ações de venda
- `ComisBonificaQtCancel`: para Inviolável, bonificação por quantidade de cancelamentos
- `OSNãoFecharRetiradaSemProd`: não permitir fechar OS de retirada sem produtos a retirar
- `BaixaCréditosNFE`: se permite baixar créditos em adiantamentos na nota de entrada
- `HistóricoCréditosNFE`: histórico de caixa para baixa dos créditos
- `ExigeJustificativaNFsOutras`: se exige justificativa para Outras Entradas/Saídas Não Especificadas
- `AtualizaClienteMestreAuto`: se atualiza o cliente mestre automaticamente ao reajustar filhos/mestre
- `PermitirRetençãoProdutos`: se permite retenção de impostos federais em notas de produtos
- `GRDescreveServiçoMensal`: texto do serviço padrão no descritivo do faturamento de veículos
- `NãoExigeComunicaçãoLiberaçãoOrc`: se não exige informar o meio de comunicação ao liberar orçamento
- `LibEstVenda`: tipo de estoque para validar a quantidade de produtos em orçamento de venda
- `LibEstLocação`: tipo de estoque para validar a quantidade de produtos em orçamento de locação
- `LibEstRastreamento`: tipo de estoque para validar a quantidade de produtos em orçamento de rastreamento
- `OSCalcularPrazoDiasUteis`: se calcula o prazo de entrega da OS em dias úteis
- `COIVendaBalcão`: COI que será utilizado para faturar vendas balcão
- `NãoProcessarCartãoAuto`: se não deve automaticamente processar vendas gravadas como cartão
- `CentroResultadosPostos`: centro de resultados padrão para clientes de postos de serviços
- `UtilizaCustoReposiçãoVenda`: se utiliza o custo de reposição para formação do custo e preço de venda nas notas de entrada
- `OSFechamentoEmailAuto`: se envia email para o cliente ao fechar a OS
- `OSForçaVendaDireta`: se não permite inclusão de produtos cobrados na OS
- `OSEnviarCriticaZerada`: se envia a crítica da OS para OSs sem valor
- `AssistênciaLiberaDescarte`: se exige liberação para descarte de itens sem nota fiscal
- `OrcOcultarProdEstZero`: se oculta produtos com estoque zerado no orçamento
- `OSFaturaDespesasExibeNota`: se ao faturar OS como despesa, a opção "Exibir na Nota" estar como sim
- `FornecedorISSDiaVcto`: se ContasPagarRetenção=1 informa o dia de vencimento do contas a pagar de ISS
- `FornecedorISSCentro`: se ContasPagarRetenção=1 informa a subconta de resultados do contas a pagar de ISS
- `FornecedorIRRFDiaVcto`: se ContasPagarRetenção=1 informa o dia de vencimento do contas a pagar de IRRF
- `FornecedorIRRFCentro`: se ContasPagarRetenção=1 informa a subconta de resultados do contas a pagar de IRRF
- `FornecedorINSSDiaVcto`: se ContasPagarRetenção=1 informa o dia de vencimento do contas a pagar de INSS
- `FornecedorINSSCentro`: se ContasPagarRetenção=1 informa a subconta de resultados do contas a pagar de INSS
- `FornecedorPISDiaVcto`: se ContasPagarRetenção=1 informa o dia de vencimento do contas a pagar de PIS
- `FornecedorPISCentro`: se ContasPagarRetenção=1 informa a subconta de resultados do contas a pagar de PIS
- `FornecedorCOFINSDiaVcto`: se ContasPagarRetenção=1 informa o dia de vencimento do contas a pagar de COFINS
- `FornecedorCOFINSCentro`: se ContasPagarRetenção=1 informa a subconta de resultados do contas a pagar de COFINS
- `FornecedorCSLLDiaVcto`: se ContasPagarRetenção=1 informa o dia de vencimento do contas a pagar de CSLL
- `FornecedorCSLLCentro`: se ContasPagarRetenção=1 informa a subconta de resultados do contas a pagar de CSLL
- `OSSuperNotificaAbertura`: se notifica abertura de OS no OSSupervisor
- `OSSuperNotificaProblema`: se notifica problema relatado em OS no OSSupervisor
- `OSSuperNotificaProblemaCliente`: se notifica somente quando o problema é do cliente
- `OSSuperNotificaFechamento`: se notifica o fechamento da OS
- `NaoComunicaUsuarioOraculo`: não está na interface, mas caso verdadeiro não comunica com o Oráculo as alterações de usuários
- `GRDescritivoCompleto`: se usa descritivo completo na gestão de risco (padrão Servis)
- `OSOcultarProdRetirar`: se oculta o nó de "Produtos a Retirar" no Andamento de Orçamentos
- `Ent275Custo`: quando o serviço não for vendido, pagar o custo de cadastro para o técnico
- `PermiteEstornarCancelamentoPendente`: se permite estornar o processo de cancelamento a qualquer tempo
- `GRFaturaUltimos30`: se no faturamento dos veículos deve utilizar como base o mês anterior ou os últimos 30 dias para calculo
- `MoniSuspendeCliente`: se no Moni, ao bloquear por inadimplência o sistema deve 0 - Desativar o cliente; 1 - Suspender o cliente
- `OSNãoEnviarCríticaEmail`: se não deve enviar a crítica no email de fechamento de OS
- `OSNãoEnviarEmailOSInterna`: se não deve enviar email de fechamento em OSs Internas
- `OSNãoEnviarEmailLimiteDias`: se não deve enviar email em um intervalo menor que o tempo estabelecido
- `DocumentIDFirebase`: identificador da unidade no AllManager
- `BloqueiaAutomaticamenteCentro`: lista de subcontas de resultados a serem filtradas para a validação do bloqueio automático
- `ServiceNãoAlterarValorLiberação`: se não permite alterar o valor de comissão dos técnicos na liberação
- `OSMobileSolicitaChecklistManutVei`: se exige checklist de veículos no OSMobile para OSs de manutenção
- `OSSupervisorOSM`: se no OSSupervisor lista OSs de Manutenção
- `OSSupervisorOSV`: se no OSSupervisor lista OSs de Vendas
- `OSSupervisorOSP`: se no OSSupervisor lista OSs Preventivas
- `OSSupervisorOSA`: se no OSSupervisor lista OSs de Ampliação
- `OSSupervisorOSR`: se no OSSupervisor lista OSs de Retirada
- `OSSupervisorOSI`: se no OSSupervisor lista OSs Internas
- `SolucxApiKey`: ApiKey da integração com a Solucx
- `SolucxToken`: token da integração com a Solucx
- `SolucxCod`: código da unidade na Solucx
- `GRFaturarAgrupamento`: se ao faturar veículos, deve agrupar o faturamento de mestre/filhos
- `GRTrocaTitularidadeCancelamento`: motivo padrão de cancelamento na troca de titularidade de veículo
- `OrcNãoCriarUsersInviolável`: se não deve criar usuários MASTER/PAINEL/PC/INSTALADOR/TATICO no Sigma ao liberar o orçamento no Service (Inviolável)
- `OperaçõesGiro`: operações de nota a serem validadas nos giros de estoque
- `AditivoC`: path do layout do aditivo de alteração de valores de veículos
- `DistanciaMaximaAtendimento`: quantidade de metros de proximidade do cliente para permitir registrar atendimento no OSMobile
- `ForticsLogin`: usuário de autenticação
- `ForticsPass`: senha de autenticação
- `ForticsVersion`: versão da API (3 ou 4)
- `DplAjusteCalcJurosAuto`: se calcula juros automaticamente no ajuste de duplicatas
- `OSSupervisorNotificaVendedor`: se no prospect mobile deve constar os atendimentos feitos pelo OSSupervisor
- `OrcExigeServiçosVenda`: se exige liberação para orçamentos de vendas sem serviços
- `TempoBloqueioCentralSigma`: tempo padrão para bloquei da central de monitoramento para manutenção em horas (OSMobile)
- `OSServHoras`: código do serviço padrão para faturar a mão de obra por horas
- `PastaCartaCobrança`: pasta das cartas de cobrança
- `VEyesDiasSemUso`: dias para notificar falta de uso do CHIP
- `OSsOcultarProdEstZero`: se não OS não deve buscar produtos sem estoque
- `OSsOcultarDescontosCritica`: se oculta os descontos na crítica de OS
- `GRFaturaDataProgramada`: se usa a data programada como data de cancelamento para calculo proporcional do veículo
- `FaturaOrçamento`: se permite faturar o orçamento como venda
- `CréditoSpedContribuiçõesTomados`: se permite Crédito no Sped Contribuições para Notas de Serviços Tomados
- `AnaliseOrcConsiderarCompensacaoCheque`: se deve considerar a data da compensação do cheque na analise orçamentária
- `HabilitaFlagFaturaRecibo`: se permite faturar despesas avulsas no recibo de locação
- `SolicitaLiberaOrcSemEmail`: se solicita liberação para fechamento de orçamento com cliente sem email
- `ProspectsNãoEnviarWhatsVendedor`: se não deve enviar mensagem Whats para o vendedor ao incluir um prospect
- `BloquearProdutosSemAtualização`: se bloqueia produtos sem atualização de preço
- `DiasSemAtualização`: quantidade de dias para bloqueio
- `OrcStatusUsaFantasia`: se no andamento de orçamentos deve constar a fantasia do cliente
- `ContaDevolOS`: subconta de resultados para reembolso de OS
- `LimiteDescontoServ`: limite de desconto em serviços
- `PlanoRecorrenteTipoVend`: gerar comissão de recorrência no 0 - vendedor original; 1 - vendedor atual 
- `FluxoDiárioNãoAgrupadas`: considerar as duplicatas finais agrupadas no previso do Fluxo Diario
- `OSConsiderarCustoMO`: se considera o custo pago ao técnico como custo do serviço na OS caso este seja menor
- `ComissõesMMNPagaValorDuplicata`: se usa o valor da duplicata ou do valor mensal como base para pagamento da comissão MMN
- `OSCríticaCheckList`: se exibe o checklist na crítica da OS
- `TipoEnvioWhats`: tipo de integração com o WhatsApp
- `BtenAuthorization`: ApiKey da Bten
- `BtenBusiness`: Id da empresa da Bten
- `BtenURL`: url do endpoint
- `NFeObrigaAnexo`: se torna obrigatório anexar arquivos na nota de entrada
- `PedidosComprasLibera`: se exige liberação para pedidos de compras
- `GREstornaComissãoRetirada`: se deve estornar comissão para veículos cancelados com menos de x meses de permanência
- `GREstornaComissãoRetiradaMeses`: quantidade de meses de permanência minima
- `COIFatVendaNFCe`: COI para faturamento de venda balcão em NFCe
- `CentroComissãoVendedor`: subconta de resultados para geração de contas a pagar na liberação de comissão de vendedores
- `AssistênciaBloquearEnvioSemEstoque`: se deve Bloquear Envio para Conserto de Itens Sem Quantidade no Estoque de Origem
- `CorpoEmailMBX`: corpo do email MBX
- `TituloEmailMBX`: título do email MBX
- `CentroConsertos`: subconta de resultados para geração de contas a pagar em consertos
- `GRControlaSubstituição`: depreciado
- `GRBloqueiaSubstituicaoMultipla`: não permite mais de um veículo em orçamento de substituição
- `GRCobrarEmSubstituicao`: se cobra veículos em substituição
- `OcultaSubstituicoesAndamento`: se oculta orçamentos de substituição liberados no andamento de orçamentos
- `MapaOcultaBloqueados`: se oculta contas a receber de clientes bloqueados no mapa financeiro
- `MapaVencidas`: quantidade de dias de vencimento
- `MapaFormas`: formas de pagamento a serem filtradas
- `MapaCentros`: subcontas de resultados a serem fitradas
- `AditivosExigeAssinanteSecundario`: se exige assinante secundário em aditivos
- `AditivosObrigaTestemunhas`: se exige testemunhas em aditivos
- `OSsOcultaVendaDireta`: se oculta OSs de venda direta (depreciado?)
- `InsereServiçosNFComodato`: se deve inserir os textos dos serviços adicionais na nota de locação
- `BoletosMascararCPFCNPJ`: se mascara o CPF/CNPJ nos boletos
- `OrcDll`: se usa DLL para gerar orçamento (depreciado)
- `CSTGratifica`: CST padrão de notas de brindes
- `CSOSNGratifica`: CSOSN padrão de notas de brindes
- `CSTGarantia`: CST padrão de notas de garantia
- `CSOSNGarantia`: CSOSN padrão de notas de garantia
- `CSTEmprestimo`: CST padrão de notas de empréstimo
- `CSOSNEmprestimo`: CSOSN padrão de notas de empréstimo
- `NaoAnexarNota`: se não anexa Danfe, XML e boletos nos emails de confirmação de NFe
- `NaoAnexarBoleto`: se não deve anexar boletos em email/whatsapp
- `CSTPisComodato`: CST padrão de notas do PIS em notas de locação
- `CSTPisGratifica`: CST padrão de notas do PIS em notas de brindes
- `CSTPisGarantia`: CST padrão de notas do PIS em notas de garantia
- `CSTPisEmprestimo`: CST padrão de notas do PIS em notas de empréstimo
- `ReqAlmoxConfirmaRecebimento`: se Confirma Recebimento de Requisições com Transferência de Estoque ou Troca de Empresas
- `OSFechamentoEmailAutoM`: se deve ser enviado email no fechamento de OSs de manutenção
- `OSFechamentoEmailAutoV`: se deve ser enviado email no fechamento de OSs de vendas
- `OSFechamentoEmailAutoP`: se deve ser enviado email no fechamento de OSs preventivas
- `OSFechamentoEmailAutoA`: se deve ser enviado email no fechamento de OSs de ampliação
- `OSFechamentoEmailAutoR`: se deve ser enviado email no fechamento de OSs de retirada
- `OSFechamentoEmailAutoI`: se deve ser enviado email no fechamento de OSs internas
- `NaoUsarIntegraDocs`: se não deve gerar links com a DLL IntegraDocs
- `FaturaDespesaCR`: se fatura despesas na sua subconta de resultados própria
- `GetrakControlaSub`: se na integração com a Getrak utiliza Subclientes
- `DesbloqueioAutoQtDpls`: número de duplicatas vencidas ou menos para desbloqueio do monitoramento/rastreamento
- `BloquearProdutosSemAtualizaçãoTipo`: forma a considerar o bloqueio de produto sem atualização
- `TokenMoninfo`: token da integração com a Moninf
- `ExibeApoliceMoninfo`: se exibe a apólice
- `CopiaArquivosOrcCli`: se ao criar o cliente na liberação de orçamentos copia os arquivos anexos do orçamento para o cliente
- `FacilUsuário`: usuário integração FácilAssist
- `FacilSenha`: senha integração FácilAssist
- `FacilAmbiente`: 1 - Homologação; 2 - Produção
- `BuscaEstendidaClientes`: padrão de busca estendida (Tudo;Chaves;Endereço;Email;Fone1;Celular;Bairro;Cidade;Placa)
- `PolgoURL`: URL integração Polgo
- `PolgoUser`: usuário
- `PolgoPass`: senha
- `PolgoYear`: ano
- `PolgoCamp`: campanha
- `UsaServHorus`: se usa serviço no lançamento de KM da rota do Horus
- `CodServHorus`: serviço para lançamento
- `OSEncerraSemRetirada`: se permite fechar OSs com produtos a retirar
- `OSEnviaSMSM`: se ao gravar OS, envia mensagem para OSs de Manutenção
- `OSEnviaSMSV`: se ao gravar OS, envia mensagem para OSs de Vendas
- `OSEnviaSMSP`: se ao gravar OS, envia mensagem para OSs Preventivas
- `OSEnviaSMSA`: se ao gravar OS, envia mensagem para OSs de Ampliação
- `OSEnviaSMSR`: se ao gravar OS, envia mensagem para OSs de Reclamação`
- `OSEnviaSMSI`: se ao gravar OS, envia mensagem para OSs Internas
- `TokenVEye`: token da integração 
- `TokenExpiraVEye`: expiração do token
- `OrçamentoNaoExigeRGSemValor`: se não exige RG em orçamentos sem valor mensal
- `EmailMoninfo`: usuário da integração Moninf
- `PipePorPeriodo`: se visualiza o PipLine por 0 - Mês fechado; 1 - Corte no dia
- `PipeDiaFim`: dia de corte se PipePorPeriodo=1
- `OSsUtilizaSLA`: se utiliza SLA em OSs
- `OSPriI`: prioridade da OS Interna
- `OSPriM`: prioridade da OS de Manutenção
- `OSPriP`: prioridade da OS Preventiva
- `OSPriV`: prioridade da OS de Vendas
- `OSPriR`: prioridade da OS de Retirada
- `OSPriA`: prioridade da OS de Ampliação
- `OSEnviaEmailProblemaCliente`: se envia email ao relatar problema na execução da OS de origem Cliente
- `OSEnviaEmailProblemaClienteTipo`: 0 - envia para o vendedor do cadastro; 1 - envia para email fixo
- `OSEnviaEmailProblemaClienteEmail`: email fixo se OSEnviaEmailProblemaClienteTipo=1
- `OSEnviaEmailProblemaEmpresa`: se envia email ao relatar problema na execução da OS de origem Empresa
- `OSEnviaEmailProblemaEmpresaTipo`: 0 - envia para o vendedor do cadastro; 1 - envia para email fixo
- `OSEnviaEmailProblemaEmpresaEmail`: email fixo se OSEnviaEmailProblemaEmpresaTipo=1
- `OrcPermiteVctoFixado`: se permite datas fixadas das parcelas do orçamento
- `ListaFatLoteOrdena`: grava a ordem em que devem aparecer os tipos de faturamento sendo 0 - Código; 1 - Descrição
- `HomologacaoMoninf`: se a integração Moninf está em homologação
- `GRSubstuicaoInicioVeiOriginal`: depreciado
- `OSEnviaFechaSMSM`: se ao fechar OS, envia mensagem para OSs de Manutenção
- `OSEnviaFechaSMSV`: se ao fechar OS, envia mensagem para OSs de Venda
- `OSEnviaFechaSMSP`: se ao fechar OS, envia mensagem para OSs Preventiva
- `OSEnviaFechaSMSA`: se ao fechar OS, envia mensagem para OSs de Ampliação
- `OSEnviaFechaSMSR`: se ao fechar OS, envia mensagem para OSs de Retirada
- `OSEnviaFechaSMSI`: se ao fechar OS, envia mensagem para OSs Internas
- `GRCancEquivalencia`: se calcula o estorno de comissão do veículo cancelado por equivalência em relação ao prazo de contrato
- `InnoveLogin`: login na integração com a Innove
- `InnoveSenha`: senha na integração com a Innove
- `InnoveProdução`: se a integração está em produção
- `CPVlrMinimoLibera`: valor mínimo para solicitar liberação em contas a pagar
- `OSDataLimiteAgendamento`: prazo em dias máximo para agendamento de uma OS
- `CotaçãoGeraLink`: se no envio das cotações deve ser enviado o link ao invés da planílha
- `PrazoBonificaIndicação`: tempo em dias para bonificação por indicação de cliente
- `ForticsCloseSession`: indica se deve fechar a seção depois de enviar mensagem na fortics 
- `EnviaSMSDeslocamentoOS`: se envia mensagem ao iniciar o deslocamento para atender a OS no OSMobile
- `TextoSMSDeslocamento`: texto a ser enviado
- `OSEnviaSMSDeslocaM`: se envia a mensagem para OSs de Manutenção
- `OSEnviaSMSDeslocaV`: se envia a mensagem para OSs de Venda
- `OSEnviaSMSDeslocaP`: se envia a mensagem para OSs Preventivas
- `OSEnviaSMSDeslocaA`: se envia a mensagem para OSs de Ampliação
- `OSEnviaSMSDeslocaR`: se envia a mensagem para OSs de Retirada
- `OSEnviaSMSDeslocaI`: se envia a mensagem para OSs Internas
- `AsaasToken`: token da integração Asaas para retorno
- `AsaasHomologa`: se está em homologação
- `AsaasContrapartida`: contrapartida de caixa para baixa das duplicatas
- `OSAtualizaCustosEntrega`: se atualiza o custo do produto ao fazer a entrega
- `OSCorBaixa`: no painel de OS, cor da OS de baixa prioridade
- `OSCorNormal`: no painel de OS, cor da OS de prioridade normal
- `OSCorAlta`: no painel de OS, cor da OS de prioridade alta
- `COIVendaBalcãoNFCe`: COI usado para faturamento de venda balcão quando NFCe
- `OSsNãoAnexarArquivos`: se não anexa os arquivos no email do fechamento de OS
- `UsaDistanciaSupervisor`: se usa distancia para o Supervisor (Mobile)
- `OSsAgruparFaturadasObs`: se concatena o número das OSs Agrupadas no Faturamento nas Observações da NF
- `EnviarNFeWhats`: se envia a NFe por whatsapp ao confirmar a NFe
- `EnviarNFeCriticaOS`: se envia a critica de OS no email da confirmação da NFe
- `ComprasLiberaCancelamento`: se exige liberação para cancelamento de nota de entrada
- `OrçamentosObrigaTestemunhas`: se exige testemunhas no aceite de orçamento
- `ControlaConsertoTodas`: se envia para conserto equipamentos Retirados de OSs de Vendas/Ampliação e Internas
- `ComisPermiteApuraFim`: se permite apurar as comissões no fim do período definido na campanha
- `UsaVinculoProdutoRastreador`: se vincula produto e rastreador para a rastreabilidade
- `UsaSenhaForte`: se exige senha forte em usuários e liberações
- `CancelamentoFaturaMultaAposOS`: se fatura multa e proporcional somente após o fechamento da OS de Retirada
- `ComissLibera3Niveis`: se utiliza liberação de pagamento de técnico em três níveis
- `FatExibeCompetencia`: se exibe/informa a data de competência no faturamento em lote ou avulso de mensalidades
- `UrlAmbienteS3`: endpoint do servidor de arquivos
- `ChaveAcessoS3`: chave de acesso
- `ChaveSecretS3`: secret key
- `S3Ativo`: se está ativo o servidor de arquivos
- `GRNaoProporcionalNovos`: se não cobra proporcionalmente ao faturar veículos novos
- `MovideskToken`: token da integração com o Movidesk
- `BuscaTecnicoGecom`: se busca também técnico como Gecom
- `BloqueioFilhosAuto`: se desativa/reativar os clientes filhos de um cliente mestre automaticamente
- `EmImplantacao`: se está em implantação, informação vem do Oráculo, evita que os usuários sejam desativados automaticamente por falta de acesso
- `ForcaCustoSelecionadoOrc`: forçar o custo quando marcada a flag "Usar Custo do Cadastro de Produtos (Corpvs)"
- `VencimentoDiaUtil`: se gera os vencimentos sempre em dias úteis
- `PJBankNaoValidaCartao`: se não faz validação do cartão no PJBank
- `OSDescrAlternativa`: se usa descrição alternativa dos produtos na crítica de OS
- `LibOcultaDadosInadimplencia`: na liberação de OSs para clientes inadimplentes, não citar os valores
- `ModoPorter`: personalização para a Porter, visualiza campos e muda comportamento em várias telas
- `TipoLicenca`: tipo de licença do sistema SERVICE (por módulos) ou SMALL/PRO/PREMIUM
- `OSCríticaMascaraCPFCNPJ`: se na crítica de OS mascara o CPF/CNPJ
- `OSSomaDeslocamentos`: se soma o tempo de deslocamento ao tempo da OS
- `EmpresaPadrãoCadastro`: empresa padrão para inclusão de novos cliente na unidade
- `CSTEmpreitada`: CST padrão para EmpreitadaGlobal
- `CSOSNEmpreitada`: CSOSN padrão para EmpreitadaGlobal
- `CSTPisEmpreitada`: CST de PIS/COFINS padrão para EmpreitadaGlobal
- `EnviarNFeDanfe`: se envia o Danfe ao confirmar a NFe
- `EnviarNFeXML`: se envia o XML ao confirmar a NFe
- `LibValorMinimo`: valor mínimo de dívidas para solicitação de liberação por inadimplência
- `UsaDescAlterMobile`: se usa a descrição alternativa dos produtos no OSMobile
- `OSNaoPermiteMesmoDefeito`: se solicita liberação para OSs em duplicidade com o mesmo defeito
- `GeraChaveContrato`: se só gera a chave (central) após o contrato assinado
- `OSViewKanban`: se visualiza o Kanban de OS no formato de Kanban de produção
- `CancelamentoDataIniMonitora`: se considera para o cálculo de multa contratual o início do serviço (desmarcado será a assinatura de contrato)
- `OSEnviaEmailAbertura`: se envia email notificando a abertura de OS
- `MsgBoasVindasEnviar`: se envia email/mensagem de boas vindas
- `MsgBoasVindasTipo`: 0 - envia ao liberar o orçamento; 1 - envia ao entregar o cliente
- `MsgBoasVindasTexto`: texto da mensagem
- `UsaServidorWhats`: se utiliza o MessageHub para disparar as mensagens
- `UsaDescAlterOrc`: se utiliza descrição alternativa nos orçamentos padrão do sistema 
- `OrcPermiteImportaPlanilha`: se permite importar planílha para orçamento
- `RDAtiva`: se a integração com o RDStation está ativa
- `RDClientID`: ID do cliente
- `RDClientSecret`: Secret key
- `RDRefreshToken`: Refresh token
- `RDConfirmaCadastro`: se confirma antes de gravar o prospect no RD
- `GetrakExigeMestre`: se pede liberação para liberar orçamento sem apontar o cliente mestre na Getrak
- `OSFatCREntrega`: se gera contas a receber na entrega de mercadorias da OS
- `GeraRateioJuros`: se rateia os juros pagos nos centros de custos da duplicata ao baixar
- `OrcLiberaEspelho`: se solicita liberação para alterar o valor do orçamento através do espelho do orçamento
- `ExigeAtendimentoMobile`: se exige atendimento por deslocamento no Aplicativo Mobile
- `OSSolicitaMotivoAgenda`: se solicitar motivo ao alterar o agendamento de OS
- `InnoveAPIKey`: ApiKey da Innove
- `MsgBoasVindasTemplate`: Template whatsapp da mensagem de boas vindas
- `NatyCloseSession`: 0 - Mantém seção; 1 - Encerra seção
- `OSFaturaCreaServiços`: se fatura o CREA com os serviços da OS
- `OSNaoListaOSPendente`: se não exibe quantidade de OSs pendentes de importação do monitoramento no Service Control
- `ForticsEnviaTemplate`: se utiliza templates para envio de mensagem na Fortics
- `GoToClientID`: ID na integração com a GoTo
- `GoToClientSecret`: Secret key
- `GoToRefreshToken`: Refresh token
- `GoToAccountKey`: Account key
- `GoToDefaultLine`: linha padrão
- `GoToToken`: token
- `GoToExpiraToken`: expiração do token
- `ExigeLiberacaoNotaSemRateioClientes`: se exige liberação para nota de entrada sem rateio para os clientes
- `TemplateBloqueio`: template bloqueio inadimplente
- `TemplateDesbloqueio`: template desbloqueio inadimplente
- `AcertouCartoes`: depreciado
- `GeraXMLRazao`: se gera o nome do arquivo Danfe/XML com a razão social do cliente
- `OSVeiRastreadorAuto`: se insere automaticamente o rastreador do veículo para retirar ao Abrir OSs Preventidas e de Manutenção (onde sempre se troca o equipamento)
- `OSExigeSolicitante`: se exige o preenchimento do solicitante na OS
- `FaturaDespBonificaFilhos`: se fatura despesas e bonificações dos clientes filhos no mestre no faturamento em lote
- `UsaRateioFixoEmpresa`: se o rateio fixo terá os percentuais do centro de custo por empresa
- `NaoExigeSenhaLocado`: se não exige senha para incluir produtos locados em clientes de locação na OS
- `GRProrataComercial`: se usar mês comercial (30 dias) para cálculo de Pró-Rata
- `NãoListarOSAtendidaParaAvaliação`: se no OS supervisor não deve listar OSs encerradas pelo mobile para avaliação
- `ProdutoModelo`: produto modelo da unidade
- `OrcLocServVenda`: se deve gravar o preço de venda dos produtos locados no orçamento/OS
- `ChatRagPersona`: persona na IA
- `ChatSpaceID`: space id na IA
- `OrcExibirRetencoesAntecipacao`: faz com que na tela de antecipação de orçamentos conste as opções de retenção de impostos
- `CobranceUsuario`: usuário na integração com a Cobrance
- `CobranceSenha`: senha na integração com a Cobrance
- `CobranceEnviaAuto`: se envia duplicatas automaticamente para a Cobrance
- `CobranceEnviaAutoDias`: quantidade de dias de atraso para envio
- `CobranceCentrosExcessões`: lista de subcontas que devem filtrar o contasreceber (não enviar)
- `CobranceContrapartida`: contrapartida de caixa para baixa
- `CobranceUltimoEnvio`: controla ultimo dia do envio automatico para executar uma vez ao dia
- `GoToCode`: código da Goto para gerar o token
- `GoToRedirectURL`: URL Goto para gerar o token
- `OrcAndOcultaValores`: Se oculta os valores dos itens no andamento de orçamentos
- `OrcPropostaLocacao`: Se a unidade vai permitir proposta de locação no orçamento

---

### UraHistorico
- **Descrição:** Grava as interações do cliente com a URA
- **Relacionamento:** 
- `Cliente` → `Clientes.CodCliente`
**Opcao:**
- `1`: Vencidas
- `2`: A vencer
- `3`: Ambas
- **Campos:**
- `Ura_Codigo`: código interno PK
- `Cliente`
- `Telefone`: telefone do cliente
- `Documento`: gravado pela URA
- `Status`: S - Sucesso; E - Erro
- `Descricao`: gravado pela URA
- `DataHoraEvento`: data hora evento
- `Email`: gravado pela URA
- `Opcao`: tipos de duplicatas solicitadas

---

### UsuarioRelatorios
- **Descrição:** Não usado pelo Service

---

### UsuáriosGruposMensagens
- **Descrição:** Grupos de usuários para mensagens
- **Campos:**
- `CodInterno`: código interno PK
- `NomeGrupo`: nome do grupo
- `Componentes`: lista de usuários do grupo
- `LogAlterações`: log de alterações
- `Ativo`: se o grupo está ativo

---

### UsuáriosGruposMensagens
- **Descrição:** Grupos de usuários para mensagens
- **Campos:**
- `CodInterno`: código interno PK
- `NomeGrupo`: nome do grupo
- `Componentes`: lista de usuários do grupo
- `LogAlterações`: log de alterações
- `Ativo`: se o grupo está ativo

---

### UsuárioVersão
- **Descrição:** Grava a versão do Service que o usuário logou
- **Campos:**
- `CodInterno`: código interno PK
- `Usuário`
- `Estação`: nome do PC
- `ÚltimoAcesso`: último acesso
- `Versão`: versão do Service

---

### VanguardaVersaoEquipamentos
- **Descrição:** Versão de equipamentos no Vanguarda para a integração
- **Campos:**
- `ID_Versao`: código
- `Descricao`
- `Fabricante`

---

### VariaveisLembretesMessageHub
- **Descrição:** Utilizado pelo MessageHub

---

### Veículos
- **Descrição:** Veículos da empresa
- **Relacionamento:** 
- `Unidade` → `Unidades.CodUnidade`
- `FornecedorVeiculo` → `Clientes.CodCliente`
- `CentroVeiculo` → `Centros.CodInterno`
- `ClienteAlocado` → `Clientes.CodCliente`
- `CodBase` → `VeículosBase.CodInterno`
- **Combustível:**
- `G`: Gasolina
- `A`: Etanol
- `B`: BiCombustível
- `D`: Diesel
- `N`: GNV
- `E`: Elétrico
- `H`: Híbrido
- **Tipo:**
- `C`: Carro
- `M`: Moto
- `O`: Outros
- **Campos:**
- `CodVeículo`: código interno PK
- `Veículo`: descrição modelo
- `Placa`
- `Ano`: ano fabricação
- `Compra`: data de compra
- `Combustível`: tipo de combustivel
- `Observações`: observações do veículo
- `Tipo`: tipo de veículo
- `Ativo`: se está ativo
- `Renavam`
- `Unidade`
- `FornecedorVeiculo`: de quem foi comprado
- `Marca`
- `Modelo`
- `CentroVeiculo`: centro de custo vinculado ao veículo
- `ClienteAlocado`: cliente em que o veículo está alocado
- `Chassi`
- `AnoModelo`: ano do modelo
- `CodBase`: base do veículo

---

### VeículosAutorizaçãoAbastecimento
- **Descrição:** Autorizações de abastecimentos para veículos
- **Relacionamento:** 
- `CodVeículo` → `Veículos.CodVeículo`
- `CodMotorista` → `Condutores.CodCondutor`
- `CodPosto` → `Clientes.CodCliente`
- `CodResponsável` → `Clientes.CodCliente`
- **Combustível:**
- `G`: Gasolina
- `A`: Etanol
- `D`: Diesel
- `N`: GNV
- **TipoQuantidade:**
- `1`: Litros
- `2`: Valor
- `3`: Completar o tanque
- **Status:**
- `A`: Pendente
- `X`: Baixada
- `C`: Cancelada
- **Campos:**
- `CodInterno`: código interno PK
- `CodVeículo`: código do veículo
- `CodMotorista`: código do motorista
- `Validade`: validade da autorização
- `Combustível`: tipo de combustível
- `TipoQuantidade`: tipo da quantidade
- `Quantidade`: quantidade liberada
- `CodPosto`: posto em que deve ocorrer o abastecimento
- `CodResponsável`: responsável pela requisição
- `Observações`: observações da requisição
- `Usuário`: quem gravou
- `GeradoEm`: quando gravou
- `Status`: status da requisição
- `UsuárioBaixa`: quem baixou
- `BaixadoEm`: quando baixou
- `UsuárioCancelamento`: quem cancelou
- `CanceladoEm`: quando cancelou
- `LogEventos`: log de eventos da requisição

---

### VeículosAvisos
- **Descrição:** Tabela temporária para gerar os avisos de veículos

---

### VeículosBase
- **Descrição:** Bases de veículos
- **Campos:**
- `CodInterno`: código interno PK
- `Base`: nome da base

---

### VeículosCancelamento
- **Descrição:** Processos de cancelamento de veículos no rastreamento
- **Relacionamento:** 
- `CodVeículo` → `GRVeículos.CodInterno`
- `CodCancelamento` → `DadosEntidades.CodInterno`
- `PlanílhaMulta` → `ContasReceber.Planílha`
- `PlaOrcDes` → `Orçamentos.Planílha`
- **Campos:**
- `CodInterno`: código interno PK
- `CodVeículo`: código do veículo
- `Planílha`: planílha do cancelamento
- `StatusCancelamento`: A - Ativo, C - Cancelado
- `DataComunicação`: data da comunicação do cancelamento
- `CodCancelamento`: código do motivo de cancelamento
- `MotivoCancelamento`: motivo de cancelamento
- `Observações`: observações do cancelamento
- `UsuárioComunicação`: quem gravou a comunicação
- `DataConfirmação`: data da confirmação de cancelamento
- `UsuárioConfirmação`: quem confirmou
- `DataProgramada`: data programada para desativação do veículo no rastramento
- `DataEstorno`: data em que o processo foi estornado e o veículo permaneceu ativo
- `UsuárioEstorno`: quem estornou
- `VerificadoFinanceiro`: se o financeiro validou o cancelamento
- `VerificadoFinanceiroData`: quando foi validado
- `VerificadoFinanceiroUsuário`: quem validou
- `ValorMulta`: valor da multa contratual calculado
- `PlanílhaMulta`: planílha de faturamento da multa
- `DistratoAssinado`: se o distrato foi assinado
- `DistratoAssinatura`: quando foi assinado
- `DistratoAssinaturaUsuário`: quem registrou a assinatura
- `DistratoImpresso`: se o distrato foi impresso
- `DistratoImpressão`: quando o distrato foi impresso
- `DistratoImpressãoUsuário`: quem registrou a impressão
- `ValorMensalAnterior`: valor mensal do clientes antes do cancelamento do veículo
- `ValorMensalNovo`: valor mensal do clientes após o cancelamento do veículo
- `PlaOrcDes`: caso seja uma substituição, a planílha o orçamento

---

### VeículosDeslocamentos
- **Descrição:** Deslocamentos dos veículos da empresa
- **Relacionamento:** 
- `Viatura` → `Veículos.CodVeículo`
- `Condutor` → `Condutores.CodCondutor`
- `CodCentro` → `Centros.CodInterno`
- `Cliente` → `Clientes.CodCliente`
- `CodMotivo` → `DadosEntidades.CodInterno`
- `PlaOS` → `OSs.Planílha`
- **Campos:**
- `CodInterno`: código interno PK
- `Viatura`: código do veículo
- `Condutor`: condutor do deslocamento
- `DataEvento`: quando ocorreu
- `KmInicial`: quilometragem do veículo na saída
- `CodCentro`: centro de custo vinculado
- `Cliente`: cliente vinculado
- `CheckListEvento`: numero do checklist
- `Observação`: observações do deslocamento
- `CodMotivo`: motivo do deslocamento
- `KmFinal`: quilometragem no retorno
- `DataRetorno`: quando retornou
- `CheckListRetorno`: numero checklist de retorno
- `Usuário`: quem gravou o deslocamento
- `UsuárioRetorno`: quem gravou o retorno
- `Planílha`: planílha do deslocamento
- `Eliminado`: se foi eliminado
- `EliminadoPor`: quem eliminou
- `EliminadoEm`: quando eliminou
- `PlaOS`: OSs vinculada
- `KmInicialDigitado`: km inicial informado sem zeramentos
- `KmFinalDigitado`: km final informado sem zeramentos

---

### VeículosDespesas
- **Descrição:** Tipos de despesas de veículos
- **TipoControle:**
- `K`: quilometragem
- `D`: dias
- `L`: litros
- **Campos:**
- `CodDespesa`: código interno PK
- `Despesa`: descrição
- `Controla`: se deve haver controle de vencimento da despesa
- `TipoControle`: forma de control
- `Eficiência`: kms, dias ou litros que duram a despesa quando Controla=1
- `Inativa`: se a despesa está inativa

---

### VeículosDespesasMovimento
- **Descrição:** São as despesas dos veículos da empresa
- **Relacionamento:** 
- `CodVeículo` → `Veículos.CodVeículo`
- `CodDespesa` → `VeículosDespesas.CodDespesa`
- `CodAutorização` → `VeículosAutorizaçãoAbastecimento.CodInterno`
- **Combustível:**
- `G`: Gasolina
- `A`: Etanol
- `D`: Diesel
- `N`: GNV
- **Campos:**
- `CodInterno`: código interno PK
- `CodVeículo`: código do veículo
- `CodDespesa`: código da despesa
- `KmAtual`: km atual do veículo no evento
- `ValorUnitário`: valor unitário do produto/serviço
- `Quantidade`: quantidade de unidades
- `ValorDespesa`: valor total da despesa
- `Eficiência`: eficiencia da despesa (tempo, kms ou litros que dura)
- `Planílha`: planílha das despesas
- `Usuário`: quem gravou
- `PDE`: se trocou pneu dianteiro esquerdo
- `PDD`: se trocou pneu dianteiro direito
- `PTE`: se trocou pneu traseiro esquerdo
- `PTD`: se trocou pneu traseiro direito
- `PE`: se trocou pneu estepe
- `Data`: data do evento
- `Descrição`: descrição
- `Combustível`: tipo de combustível se abastecimento
- `Responsável`: responsável pela despesa
- `KmInformado`: KM informado na tela sem zeramentos
- `Desconto`: valor de desconto 
- `Observações`: observações da despesa
- `CodAutorização`: autorização de abastecimento
- `Cancelado`: se foi cancelado
- `CanceladoEm`: quando foi cancelado
- `CanceladoPor`: quem cancelou
- `CanceladoObs`: motivo do cancelamento

---

### VeículosDespesasMovimentoExcluidos
- **Descrição:** Mantém um histórico de despesas excluídas, mesmos campos da VeículosDespesasMovimento

---

### VeículosMovimentoTemp
- **Descrição:** Tabela temporária 

---

### VeículosOdometro
- **Descrição:** Zeramento de odometro em veículos da empresa para dar sequencia correta nas despesas
- **Relacionamento:** 
- `CodVeículo` → `Veículos.CodVeículo`
- **Campos:**
- `CodInterno`: código interno PK
- `CodVeículo`: código do veículo
- `Data`: data do zeramento
- `Usuário`: quem gravou
- `Km`: quilometragem anterior ao zeramento

---

### VeículosPeças
- **Descrição:** Peças de veículos para controle de substituição e garantia
- **Garantia:**
- `1`: por KM
- `2`: por tempo
- `3`: não tem
- **Campos:**
- `CodPeça`: código interno PK
- `Descrição`: descrição da peça
- `Unidade`: unidade de medida
- `Aplicação`: em quais veículos se utiliza
- `VidaÚtil`: vida útil informada
- `Ativo`: se está ativa
- `VínculoDespesa`: depreciado
- `Garantia`: se tem garantia
- `KmsGarantia`: kms de garantia
- `MesesGarantia`: meses de garantia

---

### VeículosPedidos
- **Descrição:** Pedidos de peças de veículos em fornecedor/mecanica
- **Relacionamento:** 
- `Fornecedor` → `Clientes.CodCliente`
- `PlanílhaNota` → `NotasFiscaisEntrada.Planilha`
- `Empresa` → `Empresas.CodEmpresa`
- `CodRequisição` → `VeículosRequisições.CodInterno`
- **Campos:**
- `CodPedido`: código interno PK
- `Fornecedor`: fornecedor do pedido
- `Emissão`: quando foi emitido
- `Usuário`: quem emitiu
- `Planílha`: planílha do pedido
- `Baixado`: se foi baixado
- `DataBaixa`: quando foi baixado
- `PlanílhaNota`: planílha da nota de entrada que baixou
- `Empresa`: empresa vinculada
- `Obs`: observações do pedido
- `CodRequisição`: requisição que originou o pedido

---

### VeículosRequisições
- **Descrição:** São cotações de peças feitas em fornecedores para troca em um veículo
- **Relacionamento:** 
- `CodVeículo` → `Veículos.CodVeículo`
- **Status:**
- `A`: Aberta
- `F`: Encerrada
- `C`: Cancelada
- **Campos:**
- `CodInterno`: código interno PK
- `CodVeículo`
- `Data`: data da requisição
- `Odometro`: km do veículo no momento
- `DescreveProblema`: problema relatado no veículo
- `Usuário`: usuário quem criou
- `Status`: status da cotação
- `Encerramento`: quando encerrou
- `UsuárioEncerramento`: quem encerrou
- `Planílha`: planílha da cotação

---

### VeículosRequisiçõesFornecedor
- **Descrição:** Fornecedores participantes de uma cotação de peças
- **Relacionamento:** 
- `CodRequisição` → `VeículosRequisições.CodInterno`
- `CodFornecedor` → `Clientes.CodCliente`
- **Campos:**
- `CodInterno`: código interno PK
- `CodRequisição`
- `CodFornecedor`
- `Obs`: observações

---

### VeículosRequisiçõesPeças
- **Descrição:** Peças para compra na cotação
- **Relacionamento:** 
- `CodRequisição` → `VeículosRequisições.CodInterno`
- `CodPeça` → `VeículosPeças.CodPeça`
- `FornecedorTop` → `Clientes.CodCliente`
- `CodDespesa` → `VeículosDespesas.CodDespesa`
- **Destaque:**
- `I`: por ICMS
- `U`: único fornecedor
- `P`: fornecedor forçado pelo usuário
- **Campos:**
- `CodInterno`: código interno PK
- `CodRequisição`
- `CodPeça`
- `Quantidade`: quantidade de peças
- `Obs`: observações
- `Destaque`: se recebe destaque na cotação
- `FornecedorTop`: fornecedor com o melhor preço
- `CustoTop`: melhor preço
- `CodDespesa`: código da despesa vinculada
- `Eficiência`: eficiência da despesa
- `PDE`: se trocou pneu dianteiro esquerdo
- `PDD`: se trocou pneu dianteiro direito
- `PTE`: se trocou pneu traseiro esquerdo
- `PTD`: se trocou pneu traseiro direito
- `Obs2`: observações adicionais do usuário

---

### VeículosRequisiçõesPedidos
- **Descrição:** Pedidos gerados pela cotação
- **Relacionamento:** 
- `CodRequisição` → `VeículosRequisições.CodInterno`
- `Planílha` → `VeículosPedidos.Planílha`
- **Campos:**
- `CodInterno`: código interno PK
- `CodRequisição`
- `Planílha`: planílha do pedido

---

### VeículosRequisiçõesPreços
- **Descrição:** Preços de peças lançados na cotação
- **Relacionamento:** 
- `CodRequisição` → `VeículosRequisições.CodInterno`
- `CodFornecedor` → `Clientes.CodCliente`
- `CodPeça` → `VeículosPeças.CodPeça`
- **Campos:**
- `CodInterno`: código interno PK
- `CodRequisição`
- `CodFornecedor`
- `CodPeça`
- `Custo`: valor do fornecedor
- `ProdutoTop`: se é o vencedor
- `SubTotal`: quantidade X custo
- `TopForçado`: se foi selecionado pelo usuário

---

### Vigilantes
- **Descrição:** Cadastro de vigilantes na segurança
- **Relacionamento:** 
- `CodPS` → `PostosDeServiço.CodPS`
- `Unidade` → `Unidades.CodUnidade`
- **Vínculo:**
- `1`: Vigilante
- `2`: Supervisor/Inspetor/Fiscal
- `3`: Instrutor
- `4`: Gerente/Diretor
- `5`: Sócio
- `6`: Sócio Gerente/Diretor
- `7`: Acionista S/A
- `8`: Proprietário Individual
- `9`: Outros
- **Campos:**
- `CodVigilante`: código interno PK
- `CNPJEmpregador`: CNPJ empresa
- `Nome`
- `DataNascimento`
- `Pai`
- `Mãe`
- `CPF`
- `RG`
- `ÓrgãoRG`
- `Sexo`: M ou F
- `CidadeNascimento`
- `EstadoNascimento`
- `PaísNascimento`
- `EndereçoResidencial`
- `Bairro`
- `CEP`
- `Cidade`
- `Estado`
- `Telefone`
- `Vínculo`: tipo de vínculo empregatício
- `Certificado`: número do certificado de vigilante
- `ExpedidorCertificado`: quem expediu
- `DataFormação`: quando formou
- `DataReciclagem`: última reciclagem
- `TransporteValores`: apto a transporte de valores
- `SegurançaPessoal`: apto a segurança pessoal
- `PIS`: número do pis
- `DataAdmissão`
- `DRT`
- `ASO`: data do ASO
- `CarteiraVigilante`: vencimento da carteira
- `Observações`
- `CodPS`: posto vinculado
- `Salário`: valor de salário
- `Horário`
- `Escala`
- `CTPS`: número da carteira de trabalho
- `SérieCTPS`
- `EmissãoCTPS`
- `EmissãoRG`
- `TítuloEleitor`
- `Zona`
- `Seção`
- `CNH`
- `CategoriaCNH`
- `PrimeiraCNH`: data
- `VencimentoCNH`: data
- `RegistroCNH`: algum registro
- `Reservista`: certificado reserva
- `Categoria`: categoria reserva
- `EstadoCivil`: AMAZIADO;CASADO;DESQUITADO;DIVORCIADO;NÃO DECLARADO;SOLTEIRO;VIÚVO
- `Raça`: BRANCO;PRETO;PARDO;AMARELO;INDÍGENA
- `TipoSanguineo`
- `GrauInstrução`: Fundamental Incompleto;Fundamental Completo;Ginasial Completo;Ginasial Incompleto;Segundo Grau Completo;Segundo Grau Incompleto;Superior Incompleto;Superior Completo;PósGraduado;Doutorado;Mestrado
- `Função`
- `Empresa`: razão ou fantasia do empregador
- `Status`: A - Ativo; C - Inativo
- `DataDemissão`
- `Unidade`
- `EscoltaArmada`: apto a escolta armada
- `GrandesEventos1`: apto a grandes eventos 1
- `GrandesEventos2`: apto a grandes eventos 2
- `ValeTransporte`: recebe vale transporte
- `ValeRefeição`: recebe vale refeição
- `CNV`
- `RPF`
- `PrazoASO`: validade do ASO em anos
- `ValidadeCracha`: validade do crachá
- `ArmasNaoLetais`: apto a armas não letais

---

### VigilantesFilhos
- **Descrição:** Cadastro de filhos de vigilantes
- **Relacionamento:** 
- `CodVigilante` → `Vigilantes.CodVigilante`
- **Campos:**
- `CodFilho`: código interno PK
- `Nome`
- `Cartório`
- `Registro`
- `Livro`
- `Folha`
- `CodVigilante`: código do vigiltante
- `Planílha`

---

### VigzulBackEnd
- **Descrição:** depreciado

---

### VigzulComissõesContratos
- **Descrição:** depreciado

---

### VigzulConfigura
- **Descrição:** depreciado

---

### VigzulEquipeTécnica
- **Descrição:** Cadastro de equipes técnicas
- **Relacionamento:** 
- `Unidade` → `Unidades.CodUnidade`
- **Campos:**
- `CodInterno`: código interno PK
- `NomeEquipe`: nome da equipe
- `Unidade`: unidade vinculada
- `Super`: depreciado

---

### VigzulMMNConfig
- **Descrição:** depreciado

---

### VigzulPontos
- **Descrição:** depreciado

---

### VigzulStartup
- **Descrição:** depreciado

---

### VigzulTabelasComissões
- **Descrição:** depreciado

---

### VigzulTabelasComissõesFormasPagto
- **Descrição:** depreciado

---

### VigzulTabelasComissõesSameDay
- **Descrição:** depreciado

---

### VigzulTabelasComissõesServiçosAdicionais
- **Descrição:** depreciado

---

### VigzulTabelasComissõesValores
- **Descrição:** depreciado

---

### WakeUpAcordos
- **Descrição:** Acordos feito na WakeUp (os dados são alimentados pela WakeUp, somente registrados no Service)
- **Relacionamento:** 
- `id_parcela_entrada` → `WakeUpAcordosParcelas.id_parcela`
- **Campos:**
- `CodInterno`: código interno PK
- `numero_documento`: id do documento
- `cpfCnpj_credor`
- `cpfCnpj_cliente`
- `data_acordo`
- `qtd_parcelas`
- `data_pag_entrada`
- `id_parcela_entrada`
- `valor_entrada`
- `valor_retido_entrada`
- `valor_total_acordo`
- `status`
- `data_atualizacao`

---

### WakeUpAcordosParcelas
- **Descrição:** Parcelas de acordos feito na WakeUp (os dados são alimentados pela WakeUp, somente registrados no Service)
- **Relacionamento:** 
- `Unidade` → `WakeUpAcordos.numero_documento`
- **Campos:**
- `CodInterno`: código interno PK
- `numero_documento`: id do documento
- `id_parcela`: código da parcela na wake
- `num_parcela`
- `vencimento`
- `valor_parcela`
- `valor_retido`

---

### WakeUpAcordosParcelas
- **Descrição:** Parcelas de acordos feito na WakeUp (os dados são alimentados pela WakeUp, somente registrados no Service)
- **Relacionamento:** 
- `numero_documento` → `WakeUpAcordos.numero_documento`
- **Campos:**
- `CodInterno`: código interno PK
- `numero_documento`: id do documento
- `id_parcela`: código da parcela na wake
- `num_parcela`
- `vencimento`
- `valor_parcela`
- `valor_retido`

---

### WakeUpAcordosTitulosOrigem
- **Descrição:** títulos que deram origem ao acordo feito na WakeUp (os dados são alimentados pela WakeUp, somente registrados no Service)
- **Relacionamento:** 
- `numero_documento` → `WakeUpAcordos.numero_documento`
- **Campos:**
- `CodInterno`: código interno PK
- `numero_documento`: id do documento
- `cpfCnpj_credor`
- `cpfCnpj_cliente`
- `id_titulo`
- `parcela`
- `valor_total_titulo`
- `valor_retido`

---

### WakeUpBaixas
- **Descrição:** baixa de acordos feito na WakeUp (os dados são alimentados pela WakeUp, somente registrados no Service)
- **Relacionamento:** 
- `id_parcela` → `WakeUpAcordosParcelas.id_parcela`
- `Retornos` → `Retornos.CodInterno`
- `numero_documento` → `WakeUpAcordos.numero_documento`
- **Campos:**
- `CodInterno`: código interno PK
- `CodRetorno`: código do retorno
- `id_parcela`
- `num_parcela`
- `vencimento`
- `status_parcela`
- `valor_parcela`
- `valor_retido`
- `numero_documento`
- `data_canc_parcela`
- `data_pag_parcela`
- `baixa`

---

### WakeUpBaixasDuplicatas
- **Descrição:** baixa de duplicatas de acordos feito na WakeUp pelo Service
- **Relacionamento:** 
- `CodBaixaWake` → `WakeUpBaixas.CodInterno`
- `CodDuplicata` → `ContasReceber.CodInterno`
- **Campos:**
- `CodInterno`: código interno PK
- `CodBaixaWake`: código da baixa
- `CodDuplicata`: código da duplicata
- `ValorBaixa`: valor da baixa
- `DataBaixa`: data da baixa
- `Baixado`: se baixou
- `ValorRetido`: valor retido pela assessoria

---

### WebHookTransacao
- **Descrição:** São estornos de pagamentos feitos em cartão no PJ Bank (Cashback) alimentados pelo integraservice recebendo por webhook
- **Relacionamento:** 
- `CodBaixaWake` → `WakeUpBaixas.CodInterno`
- `empresa` → `Empresas.CodEmpresa`
- **Campos:**
- `id`: código interno PK
- `operacao`
- `tipo`
- `tid`: TID da operação
- `valor`
- `valor_liquido`
- `pedido_numero`: número da operação que gerou a cobrança
- `autorizada`
- `cancelada`
- `parcelas`
- `data_transacao`
- `data_cancelamento`
- `motivo_cancelamento`
- `previsao_credito`
- `convenio_proprio`
- `tid_conciliacao`
- `msg_erro`
- `msg_erro_estorno`
- `credencial`: credencial PJ
- `chave`: chave PJ
- `empresa`: empresa vinculada
- `Tratada`: se a ocorrência foi tratada
- `TratadoPor`: quem tratou
- `TratadoEm`: quando tratou

---

### WhatsConfigMessageHub
- **Descrição:** manipulado pelo MessageHub

---