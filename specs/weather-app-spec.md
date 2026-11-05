# Weather App — Especificação do Produto

## Overview

O Weather App atende pessoas que querem consultar a previsão do tempo diariamente. A pessoa pesquisa uma cidade, consulta o clima e a previsão diária para cinco dias e pode alternar temperaturas entre Celsius e Fahrenheit. A primeira versão deve funcionar em telas móveis e maiores e apresenta a interface em português do Brasil.

O provedor é o Open-Meteo, sem API key e sujeito aos limites de uso aberto. Ao enviar o nome de uma cidade, a aplicação consulta o geocoding do Open-Meteo; após a pessoa selecionar um resultado, consulta a previsão usando a latitude e longitude retornadas. A cobertura geográfica limita-se às localizações retornadas pelo geocoding, sem garantia de cobertura universal. O período da previsão é hoje e os quatro dias seguintes no calendário local da cidade. Não haverá autenticação, analytics ou retenção de dados de usuário pela aplicação, nem persistência em servidor.

Os dados meteorológicos apresentados são os mais recentes disponibilizados pelo provedor; a aplicação não promete observações em tempo real nem impõe um limite próprio de idade. Esta especificação registra as validações ainda pendentes em **Open Questions**.

## Functional Requirements

- **FR-01 — Pesquisar cidades:** após a pessoa informar um nome de cidade e acionar a busca, o sistema deve consultar o geocoding do Open-Meteo e apresentar as localizações correspondentes.
- **FR-02 — Selecionar uma localização:** o sistema deve apresentar nome, país e região disponíveis para cada resultado e permitir selecionar uma cidade. Se esses campos não distinguirem homônimos, deve mostrar as coordenadas retornadas. Ao selecionar um resultado, deve consultar o endpoint de previsão usando sua latitude e longitude.
- **FR-03 — Consultar clima atual:** para a cidade selecionada, o sistema deve apresentar os dados mais recentes disponibilizados pelo endpoint de previsão do Open-Meteo: temperatura, descrição da condição, umidade relativa, velocidade do vento, precipitação e pressão, sem identificá-los como observações em tempo real.
- **FR-04 — Consultar previsão de cinco dias:** para a cidade selecionada, o sistema deve apresentar a previsão diária para hoje e os quatro dias seguintes, incluindo condição meteorológica, temperaturas mínima/máxima e probabilidade máxima de precipitação.
- **FR-05 — Alternar unidade de temperatura:** a pessoa deve poder alternar entre Celsius e Fahrenheit; todos os valores de temperatura visíveis devem refletir a unidade escolhida.
- **FR-06 — Comunicar estados da consulta:** o sistema deve informar quando uma busca ou consulta está em andamento, quando não há cidades correspondentes e quando uma falha impede a exibição dos dados.
- **FR-07 — Recuperar uma consulta com falha:** quando uma busca ou consulta de clima falhar, a pessoa deve poder tentar novamente sem redigitar os dados que já informou ou selecionar a cidade novamente.
- **FR-08 — Priorizar a busca mais recente:** se houver buscas concorrentes, o sistema deve exibir os resultados da busca enviada mais recentemente e ignorar respostas anteriores que cheguem depois.

## User Stories

- **US-01 (FR-01 — Pesquisar cidades):** Como Pessoa que decide a rotina do dia, quero pesquisar minha cidade pelo nome para consultar rapidamente o clima antes de sair.
- **US-02 (FR-02 — Identificar e selecionar uma cidade):** Como Pessoa viajando entre cidades ou países, quero distinguir cidades com nomes iguais pela região e pelo país para consultar o destino correto.
- **US-03 (FR-03 — Consultar clima atual):** Como Pessoa que decide a rotina do dia, quero ver temperatura, condição, umidade, vento, precipitação e pressão da minha cidade para decidir como me preparar para sair.
- **US-04 (FR-04 — Consultar previsão de cinco dias):** Como Pessoa que planeja uma viagem, quero comparar condição, temperaturas e probabilidade de precipitação de hoje e dos quatro dias seguintes para decidir o que levar e quando viajar.
- **US-05 (FR-05 — Alternar unidade de temperatura):** Como Pessoa viajando entre cidades ou países e acostumada a Fahrenheit, quero alternar a unidade de temperatura para entender os valores sem fazer conversões manualmente.
- **US-06 (FR-06 — Comunicar estados da consulta):** Como Pessoa que planeja uma viagem, quero saber quando a busca está carregando, não encontrou cidades ou falhou para entender o que está acontecendo e escolher como prosseguir.
- **US-07 (FR-07 — Recuperar uma consulta com falha):** Como Pessoa viajando entre cidades ou países em uma rede instável, quero tentar novamente a consulta que falhou sem refazer a busca para obter os dados do meu destino.
- **US-08 (FR-08 — Priorizar a busca mais recente):** Como Pessoa que pesquisa mais de uma cidade, quero ver os resultados da última busca enviada para não confundir dados de consultas anteriores.

O público prioritário está definido; as personas de planejamento de viagem e deslocamento são hipóteses secundárias e devem ser validadas antes de orientar expansões além deste baseline.

## Acceptance Criteria

Os critérios abaixo são verificáveis por teste funcional ou revisão de interface. Testes automatizados devem usar respostas fixas (fixtures) para não depender da disponibilidade ou da ordenação variável do provedor. Os identificadores FR correspondem aos requisitos funcionais acima.

### FR-01 — Pesquisar cidades

- **AC-01.1:** Given que uma fixture de geocoding retorna uma cidade correspondente a `São Paulo`, When a pessoa informa `São Paulo` e envia a busca, Then o geocoding recebe o termo `São Paulo` e o resultado fica visível na lista.
- **AC-01.2:** Given que o campo contém apenas espaços em branco, When a pessoa envia a busca, Then nenhuma consulta é iniciada e uma validação visível solicita o nome da cidade.
- **AC-01.3:** Given que o campo contém `São Tomé`, When a pessoa envia a busca, Then o termo enviado mantém os caracteres acentuados e a interface não os exibe corrompidos.

### FR-02 — Identificar e selecionar uma cidade

- **AC-02.1:** Given que uma fixture de geocoding retorna nome, país, região e coordenadas, When os resultados são exibidos, Then cada opção mostra nome, país e região quando disponíveis.
- **AC-02.2:** Given uma fixture com duas cidades chamadas `Springfield` sem região diferenciadora, When os resultados são exibidos, Then cada opção mostra suas coordenadas com duas casas decimais.
- **AC-02.3:** Given que a pessoa seleciona um resultado com latitude `38.7223` e longitude `-9.1393`, When a seleção é confirmada, Then o endpoint de previsão é chamado com essas coordenadas e os dados retornados são associados à cidade selecionada.

### FR-03 — Consultar clima atual

- **AC-03.1:** Given que uma cidade selecionada retorna temperatura de `18 °C`, condição `Nublado`, umidade de `68%`, vento de `12 km/h`, precipitação de `0,4 mm` e pressão de `1012 hPa`, When a consulta termina, Then a tela mostra o nome da cidade e cada valor com sua unidade.
- **AC-03.2:** Given que a unidade selecionada é Celsius, When a temperatura atual é exibida, Then o valor tem o sufixo `°C`.
- **AC-03.3:** Given que a resposta não contém temperatura ou código de condição atual, When a consulta termina, Then o bloco principal de clima atual é marcado como indisponível e não mostra `0 °C`, `NaN` ou condição vazia como dado meteorológico; outras seções válidas permanecem visíveis.
- **AC-03.4:** Given que um ou mais valores de umidade, vento, precipitação ou pressão estão ausentes, When o clima atual é exibido, Then somente cada métrica ausente mostra `—` e as métricas disponíveis permanecem visíveis com unidades.

### FR-04 — Consultar previsão de cinco dias

- **AC-04.1:** Given que a cidade selecionada tem data local `2026-11-05` e a consulta retorna previsão válida, When a previsão é exibida, Then aparecem exatamente cinco datas consecutivas: `2026-11-05` até `2026-11-09`, no calendário local da cidade.
- **AC-04.2:** Given uma resposta com condição, mínima, máxima e probabilidade de precipitação para cada dia, When a previsão é exibida, Then cada dia mostra condição, mínima e máxima identificadas e a probabilidade com `%`.
- **AC-04.3:** Given que falta condição, mínima ou máxima de um ou mais dias, When a consulta termina, Then os dias completos continuam visíveis e cada dia incompleto é identificado como indisponível, sem substituir valores ausentes por zero ou por valores inventados.
- **AC-04.5:** Given que a probabilidade de precipitação está ausente para um dia, When a previsão é exibida, Then somente a probabilidade desse dia mostra `—` e as demais informações disponíveis permanecem visíveis.
- **AC-04.4:** Given que o fuso da cidade selecionada difere do fuso do dispositivo, When as cinco datas são exibidas, Then a primeira data corresponde ao dia atual no fuso da cidade, não ao dia do dispositivo.

### FR-05 — Alternar unidade de temperatura

- **AC-05.1:** Given que a tela mostra temperaturas atuais e mínimas/máximas em Celsius, When a pessoa seleciona Fahrenheit, Then todos esses valores passam a ter valores Fahrenheit e sufixo `°F`.
- **AC-05.2:** Given que a tela mostra temperaturas em Fahrenheit, When a pessoa seleciona Celsius, Then todos os valores passam a ter valores Celsius e sufixo `°C`.
- **AC-05.3:** Given uma temperatura de `0 °C`, When a pessoa seleciona Fahrenheit, Then o valor exibido é `32 °F`.
- **AC-05.4:** Given uma temperatura de `100 °C`, When a pessoa seleciona Fahrenheit, Then o valor exibido é `212 °F`.
- **AC-05.5:** Given que valores meteorológicos são exibidos em Celsius, When a pessoa alterna para Fahrenheit e retorna a Celsius, Then os valores em Celsius exibidos são iguais aos valores iniciais.
- **AC-05.6:** Given que não há preferência de unidade salva, When uma nova sessão é iniciada, Then Celsius está selecionado e os valores de temperatura são identificados com `°C`.

### FR-06 — Comunicar estados da consulta

- **AC-06.1:** Given que a resposta da busca ou do clima está pendente, When a operação é iniciada, Then um indicador acessível de carregamento fica visível até a resposta ou falha.
- **AC-06.2:** Given que a busca termina com zero resultados, When a resposta é apresentada, Then a mensagem `Nenhuma cidade encontrada` fica visível e o campo de busca continua disponível.
- **AC-06.3:** Given que a rede retorna erro ou resposta inválida, When a consulta falha, Then um alerta de erro fica visível para a seção afetada, dados válidos de outras seções permanecem visíveis e a ação `Tentar novamente` fica disponível.
- **AC-06.4:** Given que uma requisição não recebeu resposta, When dez segundos se passam desde seu início, Then a operação termina, um alerta de timeout é exibido e `Tentar novamente` fica disponível.

### FR-07 — Recuperar uma consulta com falha

- **AC-07.1:** Given que a busca por `Lisboa` falhou, When a pessoa aciona `Tentar novamente`, Then uma nova busca é enviada com o termo `Lisboa`.
- **AC-07.2:** Given que o clima da cidade selecionada `Lisboa` falhou ao carregar, When a pessoa aciona `Tentar novamente`, Then uma nova consulta é feita para `Lisboa` sem exigir nova seleção.
- **AC-07.3:** Given que uma consulta anterior falhou, When a pessoa envia uma nova busca por outra cidade, Then a nova busca é processada e a falha anterior deixa de bloquear o fluxo.

### FR-08 — Priorizar a busca mais recente

- **AC-08.1:** Given que a busca A foi enviada antes da busca B e a resposta B chega primeiro, When a resposta mais lenta da busca A chega depois, Then os resultados e a cidade selecionada continuam correspondendo à busca B.

## Non-Functional Requirements

- **NFR-01 — Responsividade:** os fluxos de busca, consulta e troca de unidade devem funcionar sem rolagem horizontal em larguras de 320, 375, 768, 1024 e 1440 CSS px.
- **NFR-02 — Acessibilidade:** a interface deve atender WCAG 2.2 nível AA. Todos os fluxos devem ser operáveis por teclado, ter foco visível e nomes acessíveis; contraste de texto deve ser de pelo menos 4,5:1 para texto normal e 3:1 para texto grande.
- **NFR-03 — Desempenho:** em perfil móvel com 10 Mbps e RTT de 100 ms, p95 do envio da busca até a exibição do clima atual e previsão deve ser de até 5 segundos. No campo, p75 de LCP deve ser até 2,5 s, INP até 200 ms e CLS até 0,1. Uma requisição sem resposta deve expirar em 10 segundos.
- **NFR-04 — Resiliência:** nenhuma falha de rede ou do provedor pode deixar a tela em branco ou manter carregamento por mais de 10 segundos; a seção afetada deve exibir erro e ação de recuperação.
- **NFR-05 — Disponibilidade:** não há meta formal de uptime ou SLA de 99,5%. Quando a aplicação não conseguir acessar o Open-Meteo, deve cumprir os estados de erro e recuperação definidos em FR-06 e FR-07; a disponibilidade do provedor está fora da garantia da aplicação.
- **NFR-06 — Compatibilidade:** suportar a versão atual e a anterior de Chrome, Edge, Firefox e Safari em desktop, além de Safari em iOS e Chrome em Android. A matriz deve ser executada antes de cada release.
- **NFR-07 — Idioma e localização:** textos em pt-BR; números e unidades formatados em pt-BR; datas e horas meteorológicas no fuso da cidade selecionada.
- **NFR-08 — Privacidade:** não exigir conta, acessar localização do dispositivo, executar analytics, reter histórico de buscas ou persistir dados de usuário em servidor. Informar que a cidade pesquisada e as coordenadas selecionadas são enviadas ao Open-Meteo. A aplicação não deve registrar esses dados em logs próprios.
- **NFR-09 — Segurança de transporte:** todas as comunicações com o provedor devem usar HTTPS; nenhum segredo ou credencial deve ser solicitado ou armazenado no cliente.
- **NFR-10 — Frescor dos dados:** apresentar os dados retornados pela API sem impor um limite próprio de idade ou rotulá-los como observações em tempo real.

## Edge Cases

| Caso | Comportamento esperado |
| --- | --- |
| Cidade inexistente | Se a busca for concluída sem correspondências, exibir o estado `Nenhuma cidade encontrada`, manter o termo pesquisado e permitir nova busca; não apresentar isso como falha técnica. |
| Campo de busca vazio ou contendo apenas espaços | Não chamar o serviço de geocodificação; exibir validação para informar uma cidade e manter o campo disponível. |
| Cidade com acentos, apóstrofos ou caracteres especiais | Enviar a busca sem corromper o termo e exibir os caracteres corretamente nos resultados; não gerar erro somente por esses caracteres. |
| Falha de API (erro HTTP, resposta inválida ou falha de rede) | Exibir alerta de erro, não tratar a resposta como dados meteorológicos válidos e oferecer `Tentar novamente`, preservando o termo ou a cidade selecionada. |
| Timeout da API | Encerrar a espera, exibir mensagem de demora/falha e oferecer `Tentar novamente` com o mesmo termo ou cidade; não deixar indicador de carregamento infinito. |
| Geocoding concluído sem resultados | Exibir estado vazio `Nenhuma cidade encontrada`, sem alerta de erro técnico; permitir editar o termo e iniciar outra busca. A aplicação não deve afirmar que a cidade não existe, apenas que não houve correspondência. |
| Várias cidades com o mesmo nome | Exibir contexto geográfico disponível para que a pessoa escolha a opção correta. |
| Busca submetida repetidamente enquanto está em andamento | Não deixar a interface em estado inconsistente; manter feedback e apresentar resultados da busca vigente. |
| Resposta parcial do clima atual | Se faltar temperatura ou condição, identificar o bloco de clima atual como indisponível e não mostrar valores substitutos; manter visíveis outras seções com dados válidos. |
| Resposta parcial da previsão | Exibir os dias completos; marcar cada dia que não tenha condição, mínima ou máxima como indisponível; não ocultar dias válidos nem preencher lacunas com valores inventados. |
| Resposta de busca antiga chega depois da mais recente | Ignorar a resposta antiga e manter resultados e seleção da busca mais recente, conforme FR-08. |
| Datas da cidade selecionada diferem das datas no dispositivo | Usar o calendário local da cidade selecionada para delimitar os cinco dias. |
| Conversão de temperatura resulta em valor fracionário ou negativo | Aplicar uma regra de arredondamento consistente; a regra final ainda precisa ser confirmada. |
| Falha ao carregar clima após selecionar cidade | Preservar a cidade selecionada e permitir tentar novamente para ela. |
| Conexão lenta em dispositivo móvel | Manter feedback de carregamento até concluir ou falhar; não deixar a tela sem resposta visível. |

## Assumptions

- A primeira entrega será somente uma aplicação web responsiva acessada em navegador; PWA instalável e aplicativos nativos estão fora da versão inicial.
- O fluxo principal é pesquisa manual de cidade; não haverá detecção automática da localização do dispositivo.
- O clima atual inclui temperatura, condição, umidade relativa, velocidade do vento, precipitação e pressão; cada métrica pode estar indisponível individualmente. A previsão diária inclui data, condição e temperaturas mínima/máxima; a probabilidade de precipitação pode estar indisponível por dia.
- A definição de cinco dias usa o calendário local da cidade: hoje e os quatro dias seguintes.
- Celsius é a unidade inicial em cada sessão; nenhuma preferência de unidade será persistida localmente ou em servidor.
- Valores de temperatura são apresentados arredondados ao inteiro mais próximo.
- A aplicação necessita de conexão com a internet para pesquisar cidades e atualizar dados meteorológicos.
- O idioma inicial é pt-BR, mas as localidades pesquisáveis limitam-se aos resultados retornados pelo geocoding do Open-Meteo.
- A aplicação não coleta analytics nem retém dados de pesquisa, preferência ou localização; o provedor recebe cidade e coordenadas conforme seu serviço.
- A busca é enviada somente após ação explícita da pessoa; sugestões enquanto digita não fazem parte do MVP.
- Não existe meta formal de disponibilidade ou SLA de 99,5%; falhas do provedor são tratadas com erro e ação de nova tentativa.

## Risks

| Risco | Probabilidade | Impacto | Mitigação |
| --- | --- | --- | --- |
| Indisponibilidade, limite de uso ou mudança de termos do Open-Meteo | Média | Buscas ou consultas podem falhar; cobertura ou continuidade do produto pode ser afetada. | Validar cobertura, limites e termos antes do lançamento; monitorar falhas e manter fluxo de erro e nova tentativa. |
| Cidade homônima ou cobertura geográfica insuficiente | Alta | A pessoa pode consultar local errado ou não encontrar sua cidade. | Exibir região e país disponíveis; validar a cobertura com localidades prioritárias e testar homônimos. |
| Dados mais recentes disponíveis podem ser interpretados como observações em tempo real | Média | Usuários podem esperar precisão ou imediatismo não garantidos pelo provedor. | Exibir os dados disponibilizados pela API sem alegar que são observações em tempo real. |
| Fuso horário incorreto na definição de hoje e dos cinco dias | Média | A previsão pode exibir datas que não correspondem à cidade consultada. | Usar calendário local da cidade e validar cidades em diferentes fusos e transições de horário. |
| Erro de conversão ou arredondamento entre Celsius e Fahrenheit | Baixa | Temperaturas inconsistentes prejudicam a confiança e a utilidade da consulta. | Definir regra de arredondamento e validar conversão com valores de referência e testes de ida e volta. |
| Metas de desempenho, acessibilidade e compatibilidade ainda sem aprovação | Média | A equipe pode considerar o produto pronto com níveis de qualidade diferentes dos esperados. | Aprovar limites, padrões e matriz de suporte antes dos critérios finais de aceite. |
| Conteúdo meteorológico além da consulta diária básica não validado | Média | A aplicação pode omitir informações esperadas ou exigir retrabalho na interface. | Manter o conjunto mínimo definido no MVP e validar campos adicionais antes de expandir o escopo. |
| Coleta não planejada de localização ou histórico | Baixa | Pode criar riscos de privacidade, conformidade e confiança. | Não coletar localização automaticamente; definir e comunicar qualquer coleta adicional antes de sua introdução. |

## Out of Scope

- Autenticação, contas de usuário e sincronização entre dispositivos.
- Persistência de dados de usuário em servidor.
- Persistência local de preferências, incluindo a unidade selecionada.
- Favoritos, histórico de buscas e lista de cidades salvas na primeira versão.
- Analytics, publicidade comportamental e retenção de dados de usuário ou buscas.
- Detecção automática da localização do dispositivo.
- Sugestões de busca enquanto a pessoa digita.
- Aplicativos nativos e PWA instalável, até confirmação de plataforma.
- Campos meteorológicos além de temperatura, condição, umidade, vento, precipitação e pressão atuais e data, condição, mín./máx. e probabilidade de precipitação diárias.
- Previsão por hora, mapas, radar, qualidade do ar, alertas meteorológicos e notificações.
- Uso offline ou garantia de disponibilidade dos dados quando o provedor estiver indisponível.
- Garantia de cobertura para qualquer cidade ou país antes de validar a cobertura do Open-Meteo.

## Open Questions

1. As metas propostas de desempenho, acessibilidade e compatibilidade são aprovadas pelos responsáveis de produto e operação? Os valores estão definidos nesta spec, mas precisam de aprovação antes de serem usados como compromisso de lançamento.