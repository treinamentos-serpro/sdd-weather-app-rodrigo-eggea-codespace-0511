# Weather App — Backlog de Implementação

Tarefas derivadas de `plans/weather-app-plan.md` e rastreáveis a `specs/weather-app-spec.md`. Execute na ordem apresentada dentro de cada entrega; não inicie uma tarefa enquanto suas dependências não estiverem concluídas.

## Entrega 1 — Contratos e funções de domínio

### T-01 — Definir contratos TypeScript do domínio
- **Tipo:** Data
- **Descrição:** Criar os tipos compartilhados de cidade, clima atual, dia de previsão, dados meteorológicos, unidade, estado e erro.
- **Critérios de aceite:**
  - `Unit` é `'celsius' | 'fahrenheit'` e `WeatherStatus` contém `idle`, `loading`, `success`, `empty` e `error`.
  - `City.country` e `City.region` aceitam `null`; `CurrentWeather` representa como nullable `time`, temperatura e código; `ForecastDay` representa como nullable código, mínima e máxima e tem estado de disponibilidade.
  - `WeatherData` contém a cidade selecionada, fuso, clima atual e lista diária; o erro tem código e mensagem para usuário.
  - Os tipos compilam em TypeScript strict sem incluir contratos de campos fora do escopo.
- **Dependências:** —
- **Arquivos prováveis:** `src/types/weather.ts`

### T-02 — Implementar conversão e formatação de temperatura
- **Tipo:** Data
- **Descrição:** Criar função pura para converter Celsius/Fahrenheit e formatar valores ao inteiro mais próximo.
- **Critérios de aceite:**
  - A conversão usa `F = C × 9/5 + 32`; `0 °C` resulta em `32 °F`, `100 °C` em `212 °F` e `-40 °C` em `-40 °F`.
  - Converter a mesma temperatura repetidamente não altera o valor canônico em Celsius.
  - Valores ausentes não são formatados como zero; valores exibidos são arredondados ao inteiro mais próximo.
- **Dependências:** T-01
- **Arquivos prováveis:** `src/lib/temperature.ts`

### T-03 — Mapear códigos meteorológicos WMO
- **Tipo:** Data
- **Descrição:** Criar função pura que converte códigos WMO em descrições em pt-BR.
- **Critérios de aceite:**
  - Código WMO `0` retorna `Céu limpo`, `3` retorna `Encoberto` e `61` retorna `Chuva fraca` em pt-BR.
  - Código desconhecido retorna uma descrição de fallback não vazia e não lança erro.
- **Dependências:** —
- **Arquivos prováveis:** `src/lib/weatherCodes.ts`

### T-04 — Formatar datas no calendário da cidade
- **Tipo:** Data
- **Descrição:** Criar função pura para formatar datas do forecast usando o fuso da cidade selecionada.
- **Critérios de aceite:**
  - A data local do primeiro item é rotulada `Hoje`, a seguinte `Amanhã` e as demais com dia da semana em pt-BR.
  - Uma data é formatada no fuso recebido e não muda conforme o fuso do dispositivo.
- **Dependências:** T-01
- **Arquivos prováveis:** `src/lib/format.ts`

## Entrega 2 — Dados e orquestração

### T-05 — Implementar service de geocoding
- **Tipo:** Data
- **Descrição:** Implementar `searchCities(name)` para consultar e mapear resultados do Open-Meteo Geocoding.
- **Critérios de aceite:**
  - Usa HTTPS, `URLSearchParams`, `count=5`, `language=pt` e `format=json`.
  - Preserva o termo pesquisado e mapeia `id`, nome, país, região, latitude e longitude para `City`.
  - Resposta sem resultados retorna `[]`; whitespace não dispara requisição.
  - Timeout e falhas de transporte, HTTP ou resposta estrutural inválida geram erro tipado.
- **Dependências:** T-01
- **Arquivos prováveis:** `src/services/weatherService.ts`

### T-06 — Implementar service de forecast
- **Tipo:** Data
- **Descrição:** Implementar `getForecast(city)` com as coordenadas selecionadas e mapear a resposta atual e diária.
- **Critérios de aceite:**
  - Requisita `current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m,precipitation,surface_pressure` e `daily=weather_code,temperature_2m_min,temperature_2m_max,precipitation_probability_max`, em Celsius, vento km/h, precipitação mm, cinco dias e `timezone=auto`.
  - Mapeia `current` e arrays diários para `WeatherData`, `CurrentWeather` e `ForecastDay[]` por índice.
  - Produz hoje e os quatro dias seguintes no fuso retornado; campos ausentes ficam indisponíveis, nunca substituídos por zero.
  - Erros HTTP, rede, timeout e envelope inválido geram erro tipado; resposta parcialmente preenchida preserva os itens válidos.
- **Dependências:** T-01, T-05
- **Arquivos prováveis:** `src/services/weatherService.ts`

### T-07 — Implementar hook `useWeather`
- **Tipo:** Data
- **Descrição:** Orquestrar busca, seleção, consulta, retry e os cinco estados de domínio.
- **Critérios de aceite:**
  - Expõe `idle`, `loading`, `success`, `empty` e `error`, termo, cidades, cidade selecionada, dados e ações.
  - Busca com resultados deixa as opções selecionáveis; geocoding sem resultados resulta em `empty`.
  - Selecionar cidade chama forecast com suas coordenadas; retry mantém termo ou cidade.
  - Respostas de buscas antigas não substituem os resultados da busca mais recente.
- **Dependências:** T-05, T-06
- **Arquivos prováveis:** `src/hooks/useWeather.ts`

## Entrega 3 — Interface

### T-08 — Criar busca de cidade
- **Tipo:** UI
- **Descrição:** Criar `SearchBar` acessível, ligado à ação de busca.
- **Critérios de aceite:**
  - Campo tem label acessível e pode ser usado por teclado.
  - Envio com campo vazio ou whitespace não dispara busca e apresenta validação.
  - A submissão envia o termo sem perda de acentos.
- **Dependências:** T-07
- **Arquivos prováveis:** `src/components/SearchBar.tsx`

### T-09 — Criar lista e seleção de cidades
- **Tipo:** UI
- **Descrição:** Exibir resultados de geocoding e permitir selecionar uma cidade.
- **Critérios de aceite:**
  - Cada resultado mostra nome, país e região quando disponíveis.
  - Para homônimos sem região diferenciadora, mostra coordenadas com duas casas decimais.
  - Seleção por teclado ou ponteiro envia a cidade selecionada ao hook.
- **Dependências:** T-01, T-07
- **Arquivos prováveis:** `src/components/CityResults.tsx`

### T-10 — Criar indicador de carregamento
- **Tipo:** UI
- **Descrição:** Criar estado de carregamento acessível para geocoding e forecast.
- **Critérios de aceite:**
  - Indicador aparece enquanto `status` é `loading` e deixa de aparecer em outro estado.
  - Texto/status de carregamento é anunciado por tecnologia assistiva.
- **Dependências:** —
- **Arquivos prováveis:** `src/components/states/LoadingState.tsx`

### T-11 — Criar estado vazio
- **Tipo:** UI
- **Descrição:** Criar mensagem para geocoding concluído sem resultados.
- **Critérios de aceite:**
  - Exibe `Nenhuma cidade encontrada` sem apresentar erro técnico.
  - A busca permanece disponível para novo termo.
- **Dependências:** —
- **Arquivos prováveis:** `src/components/states/EmptyState.tsx`

### T-12 — Criar estado de erro e retry
- **Tipo:** UI
- **Descrição:** Criar apresentação de erro com ação de recuperação.
- **Critérios de aceite:**
  - Para falha de rede, HTTP, timeout ou resposta inválida, a mensagem não mostra stack, URL ou corpo bruto da resposta.
  - O botão `Tentar novamente` aparece nesses quatro tipos de falha e aciona o callback fornecido pelo hook.
  - Termo ou cidade selecionada permanece preservado após erro.
- **Dependências:** T-07
- **Arquivos prováveis:** `src/components/states/ErrorState.tsx`

### T-13 — Apresentar clima atual
- **Tipo:** UI
- **Descrição:** Criar `CurrentWeather` para temperatura, condição e métricas atuais.
- **Critérios de aceite:**
  - Exibe cidade, temperatura com sufixo da unidade e descrição do código WMO.
  - Exibe umidade em `%`, vento em `km/h`, precipitação em `mm` e pressão em `hPa` quando os valores estão disponíveis.
  - Se temperatura ou condição estiver indisponível, identifica somente o bloco como indisponível e não mostra zero ou texto vazio.
  - Métrica individual indisponível exibe `—` sem ocultar as demais métricas disponíveis.
  - Não afirma que os dados são observações em tempo real.
- **Dependências:** T-01, T-02, T-03
- **Arquivos prováveis:** `src/components/CurrentWeather.tsx`

### T-14 — Apresentar previsão de cinco dias
- **Tipo:** UI
- **Descrição:** Criar `ForecastList` e `ForecastCard` com rótulo diário, condição, temperaturas e probabilidade de chuva.
- **Critérios de aceite:**
  - Renderiza cinco datas consecutivas com condição, mínima, máxima e probabilidade máxima de precipitação em cada dia.
  - O rótulo do dia é formatado no fuso local da cidade e temperaturas refletem a unidade selecionada.
  - Dia sem condição, mínima ou máxima é identificado como indisponível; probabilidade ausente mostra `—` sem invalidar o restante do dia.
- **Dependências:** T-01, T-02, T-03, T-04
- **Arquivos prováveis:** `src/components/ForecastList.tsx`, `src/components/ForecastDayCard.tsx`

### T-15 — Criar controle de unidade
- **Tipo:** UI
- **Descrição:** Criar `UnitToggle` para alterar a unidade de apresentação.
- **Critérios de aceite:**
  - Permite selecionar Celsius ou Fahrenheit por teclado e apresenta a opção ativa.
  - Alterar a unidade atualiza temperatura atual, mínimas e máximas sem nova chamada de rede.
  - Nova sessão inicia em Celsius; não persiste a preferência.
- **Dependências:** T-01, T-02
- **Arquivos prováveis:** `src/components/UnitToggle.tsx`

### T-16 — Compor a aplicação no `App`
- **Tipo:** UI
- **Descrição:** Conectar hook, busca, lista de cidades, clima atual, previsão, unidade e componentes de estado.
- **Critérios de aceite:**
  - Fluxo conecta busca → seleção → forecast com estados `loading`, `error`, `empty` e `success`.
  - Unidade começa em Celsius e é mantida apenas durante a sessão.
  - Nenhum componente de apresentação faz chamadas HTTP.
  - Estilos Tailwind seguem o tema dark glassmorphism definido pelas instruções do projeto.
- **Dependências:** T-07, T-08, T-09, T-10, T-11, T-12, T-13, T-14, T-15
- **Arquivos prováveis:** `src/App.tsx`

## Entrega 4 — Testes

### T-17 — Testar conversão de temperatura
- **Tipo:** Test
- **Descrição:** Cobrir a função de conversão e formatação de temperatura.
- **Critérios de aceite:**
  - Testes cobrem os valores de referência de conversão, arredondamento e valor ausente.
  - Converter a mesma temperatura repetidamente não acumula erro.
- **Dependências:** T-02, T-16
- **Arquivos prováveis:** `tests/unit/temperature.test.ts`

### T-18 — Testar mapeamento de códigos WMO
- **Tipo:** Test
- **Descrição:** Verificar códigos meteorológicos conhecidos e o fallback para código desconhecido.
- **Critérios de aceite:**
  - `0` produz `Céu limpo`, `3` produz `Encoberto` e `61` produz `Chuva fraca`.
  - Um código desconhecido produz uma string de fallback não vazia e não lança exceção.
- **Dependências:** T-03, T-16
- **Arquivos prováveis:** `tests/unit/weatherCodes.test.ts`

### T-19 — Testar formatação de datas e fusos
- **Tipo:** Test
- **Descrição:** Verificar rótulos diários e formatação usando o fuso da cidade.
- **Critérios de aceite:**
  - Com data local de referência `2026-11-05`, `2026-11-05` é `Hoje`, `2026-11-06` é `Amanhã` e `2026-11-07` é `sábado`.
  - O rótulo do card continua igual quando o fuso do dispositivo muda e o fuso da cidade permanece igual.
- **Dependências:** T-04, T-16
- **Arquivos prováveis:** `tests/unit/format.test.ts`

### T-20 — Testar services com `fetch` mockado
- **Tipo:** Test
- **Descrição:** Validar URLs, parâmetros, mapeamento e falhas dos dois endpoints sem chamar a API real.
- **Critérios de aceite:**
  - Fixtures cobrem geocoding com resultados, sem resultados, homônimos e campos geográficos opcionais.
  - Fixtures cobrem forecast completo, cada métrica atual e probabilidade diária ausente individualmente, campos obrigatórios parciais, erro HTTP, JSON inválido, falha de rede e timeout.
  - Testes confirmam que forecast usa latitude/longitude da cidade selecionada e pede cinco dias em Celsius.
- **Dependências:** T-05, T-06, T-16
- **Arquivos prováveis:** `tests/unit/weatherService.test.ts`

### T-21 — Testar estados e concorrência do hook
- **Tipo:** Test
- **Descrição:** Testar `useWeather` com services simulados e respostas controladas.
- **Critérios de aceite:**
  - Testes cobrem idle, loading, success, empty e error.
  - Testes confirmam seleção, coordenadas, retry e preservação do contexto após erro.
  - Duas buscas com respostas fora de ordem mantêm visíveis os resultados da mais recente.
- **Dependências:** T-07, T-16
- **Arquivos prováveis:** `tests/unit/useWeather.test.ts`

### T-22 — Testar componentes nos estados da spec
- **Tipo:** Test
- **Descrição:** Verificar comportamento acessível dos componentes com props e callbacks controlados.
- **Critérios de aceite:**
  - Testes cobrem loading, erro, vazio e sucesso.
  - Testes cobrem validação de busca, desambiguação, temperatura, umidade, vento, precipitação, pressão, probabilidade de chuva por dia, fallbacks `—`, previsão parcial e alternância de unidade.
  - Testes confirmam que o retry chama o callback sem limpar o termo/cidade.
- **Dependências:** T-08, T-09, T-10, T-11, T-12, T-13, T-14, T-15, T-16
- **Arquivos prováveis:** `tests/unit/components.test.tsx`

### T-23 — Cobrir fluxo principal com Playwright
- **Tipo:** Test
- **Descrição:** Testar o fluxo integrado do app com respostas interceptadas e determinísticas.
- **Critérios de aceite:**
  - Teste percorre busca manual, escolha de cidade, clima atual, previsão de cinco dias e alternância C/F.
  - O mesmo fluxo principal é executado em desktop e no projeto mobile Playwright (iPhone 13, viewport 390 × 844 CSS px).
  - Testes cobrem input vazio, geocoding sem resultados, falha e retry.
  - Testes confirmam que alternar unidade não envia novo request e que resposta antiga não sobrescreve busca recente.
  - O app não envia eventos para analytics nem persiste termo, coordenadas ou unidade em storage local.
- **Dependências:** T-16, T-17, T-18, T-19, T-20, T-21, T-22
- **Arquivos prováveis:** `tests/e2e/weather.spec.ts`

## Entrega 5 — Hardening

### T-24 — Validar layout mobile e desktop
- **Tipo:** Test
- **Descrição:** Verificar fluxos essenciais nos tamanhos responsivos definidos na spec.
- **Critérios de aceite:**
  - Em 320, 375, 768, 1024 e 1440 CSS px, os controles de busca, seleção, unidade e retry permanecem visíveis e operáveis.
  - Em cada largura, `document.documentElement.scrollWidth` não excede `document.documentElement.clientWidth`.
  - Busca e seleção completam o fluxo no projeto mobile do Playwright.
- **Dependências:** T-16, T-23
- **Arquivos prováveis:** `tests/e2e/weather.spec.ts`, `playwright.config.ts`

### T-25 — Verificar acessibilidade
- **Tipo:** Test
- **Descrição:** Validar operação por teclado, nomes acessíveis e contraste nos fluxos principais.
- **Critérios de aceite:**
  - Todos os controles do fluxo principal são alcançáveis e operáveis por teclado, com foco visível.
  - Cada controle interativo tem role e nome acessível consultáveis por Testing Library/Playwright.
  - Contraste medido atende 4,5:1 para texto normal e 3:1 para texto grande.
- **Dependências:** T-16, T-23
- **Arquivos prováveis:** `tests/e2e/weather.spec.ts`, relatório de validação de acessibilidade

### T-26 — Medir o orçamento de desempenho
- **Tipo:** Test
- **Descrição:** Medir consulta ponta a ponta e Core Web Vitals no perfil de rede/dispositivo da spec.
- **Critérios de aceite:**
  - Com perfil móvel de 10 Mbps e RTT de 100 ms, p95 do envio da busca até clima atual e previsão fica em até 5 segundos.
  - Em pelo menos 20 execuções controladas, p75 de LCP é até 2,5 s, INP até 200 ms e CLS até 0,1.
  - Registrar navegador, dispositivo simulado, perfil de rede e resultados; se os alvos não tiverem aprovação, marcar como pendente de sign-off sem alterar os limites.
- **Dependências:** T-16, T-23
- **Arquivos prováveis:** `tests/e2e/performance.spec.ts`, relatório de validação de release

### T-27 — Configurar e testar matriz de navegadores
- **Tipo:** Test
- **Descrição:** Adicionar projetos Playwright e um teste de compatibilidade para a matriz de navegadores da spec.
- **Critérios de aceite:**
  - A configuração inclui projetos Chromium, Edge, Firefox e WebKit para desktop, além de WebKit/iOS e Chromium/Android para mobile.
  - O teste de compatibilidade executa busca, seleção, forecast e alternância C/F em cada projeto configurado.
  - A matriz documenta versões atuais/anterior de desktop exigidas pela spec e registra a versão executada em cada release.
- **Dependências:** T-16, T-23
- **Arquivos prováveis:** `playwright.config.ts`, `tests/e2e/compatibility.spec.ts`

### T-28 — Executar gates de qualidade e navegadores no CI
- **Tipo:** Infra
- **Descrição:** Atualizar o workflow existente para executar os gates definidos e a matriz Playwright.
- **Critérios de aceite:**
  - `pnpm lint`, `pnpm build`, `pnpm test` e `pnpm test:e2e` executam no CI.
  - CI instala os navegadores requeridos pelos projetos Playwright e falha quando algum gate falha.
  - Nenhuma credencial/API key é necessária no build ou runtime.
- **Dependências:** T-17, T-18, T-19, T-20, T-21, T-22, T-23, T-24, T-25, T-26, T-27
- **Arquivos prováveis:** `.github/workflows/ci.yml`

## Entrega 6 — Build e release

### T-29 — Validar build estático no GitHub Pages
- **Tipo:** Infra
- **Descrição:** Validar a publicação estática sob o subcaminho do repositório no GitHub Pages.
- **Critérios de aceite:**
  - Com `VITE_BASE=/weather-app/`, os caminhos dos scripts e estilos do build começam com `/weather-app/` e retornam HTTP 200 no preview local.
  - Deploy usa o build estático existente e não exige backend, credenciais ou API key.
- **Dependências:** T-16, T-28
- **Arquivos prováveis:** `.github/workflows/pages.yml`, `vite.config.ts`

## Rastreabilidade

| Requisito funcional | Tarefas de implementação | Tarefas de verificação | Cobertura |
| --- | --- | --- | --- |
| FR-01 — Pesquisar cidades | T-05, T-07, T-08, T-09 | T-20, T-21, T-22, T-23 | Completa |
| FR-02 — Selecionar uma localização | T-05, T-06, T-07, T-09 | T-20, T-21, T-22, T-23 | Completa |
| FR-03 — Consultar clima atual | T-06, T-07, T-13 | T-20, T-22, T-23 | Completa |
| FR-04 — Consultar previsão de cinco dias | T-04, T-06, T-07, T-14 | T-19, T-20, T-22, T-23 | Completa |
| FR-05 — Alternar unidade de temperatura | T-02, T-15 | T-17, T-22, T-23 | Completa |
| FR-06 — Comunicar estados da consulta | T-07, T-10, T-11, T-12, T-16 | T-21, T-22, T-23 | Completa |
| FR-07 — Recuperar uma consulta com falha | T-07, T-12 | T-21, T-22, T-23 | Completa |
| FR-08 — Priorizar a busca mais recente | T-07 | T-21, T-23 | Completa |
| NFR-01 — Responsividade | T-24 |
| NFR-02 — Acessibilidade | T-08, T-09, T-10, T-11, T-12, T-15, T-24, T-25 |
| NFR-03 — Desempenho | T-26 |
| NFR-04 — Resiliência | T-05, T-06, T-07, T-12, T-20, T-21, T-23 |
| NFR-05 — Disponibilidade sem SLA formal | T-23, T-29 |
| NFR-06 — Compatibilidade | T-27, T-28 |
| NFR-07 — pt-BR e fuso local | T-03, T-04, T-13, T-14 |
| NFR-08 — Privacidade | T-23 |
| NFR-09 — HTTPS sem segredo | T-05, T-06, T-28, T-29 |
| NFR-10 — Frescor sem promessa de tempo real | T-06, T-13, T-14 |

### Rastreabilidade por tarefa

| Tarefa | Requisito(s) e critério(s) relacionados |
| --- | --- |
| T-01 | FR-01–FR-08: contratos do domínio usados pelos fluxos funcionais. |
| T-02 | FR-05; AC-05.1–AC-05.5; NFR-07. |
| T-03 | FR-03, FR-04; AC-03.1, AC-04.2; NFR-07. |
| T-04 | FR-04; AC-04.1, AC-04.4; NFR-07. |
| T-05 | FR-01, FR-02; AC-01.1–AC-01.3, AC-02.1–AC-02.3; NFR-09. |
| T-06 | FR-02–FR-04; AC-02.3, AC-03.1–AC-03.4, AC-04.1–AC-04.5; NFR-04, NFR-09, NFR-10. |
| T-07 | FR-01, FR-02, FR-06–FR-08; AC-01.1–AC-01.3, AC-06.2, AC-07.1–AC-07.3, AC-08.1. |
| T-08 | FR-01; AC-01.1–AC-01.3; NFR-02. |
| T-09 | FR-02; AC-02.1–AC-02.3; NFR-02. |
| T-10 | FR-06; AC-06.1; NFR-02. |
| T-11 | FR-06; AC-06.2. |
| T-12 | FR-06, FR-07; AC-06.3–AC-06.4, AC-07.1–AC-07.2; NFR-04. |
| T-13 | FR-03; AC-03.1–AC-03.3; NFR-10. |
| T-14 | FR-04; AC-04.1–AC-04.5; NFR-07, NFR-10. |
| T-15 | FR-05; AC-05.1–AC-05.6. |
| T-16 | FR-01–FR-08; critérios de integração de busca, seleção, consulta, erro, retry e unidade; NFR-08. |
| T-17 | FR-05; AC-05.3–AC-05.5. |
| T-18 | FR-03, FR-04; AC-03.1, AC-04.2; NFR-07. |
| T-19 | FR-04; AC-04.1, AC-04.4; NFR-07. |
| T-20 | FR-01–FR-04; AC-01.1, AC-02.3, AC-03.3–AC-03.4, AC-04.3, AC-04.5; NFR-04, NFR-09. |
| T-21 | FR-06–FR-08; AC-06.1–AC-06.4, AC-07.1–AC-07.3, AC-08.1. |
| T-22 | FR-01–FR-07; critérios de comportamento dos componentes e estados. |
| T-23 | FR-01–FR-08; NFR-08. |
| T-24 | NFR-01. |
| T-25 | NFR-02. |
| T-26 | NFR-03. |
| T-27 | NFR-06. |
| T-28 | NFR-04, NFR-06, NFR-09 e gates de qualidade do projeto. |
| T-29 | NFR-05, NFR-09 e pressuposto de publicação como SPA estática. |