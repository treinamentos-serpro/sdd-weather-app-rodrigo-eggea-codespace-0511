# Weather App — Plano Técnico

## Architecture

SPA React com composição em `App.tsx` e fluxo unidirecional. Cada camada depende de contratos tipados, mantendo apresentação, orquestração, rede e transformações independentes:

- **Apresentação (`components/`):** componentes recebem valores e callbacks por props, renderizam formulários, resultados e estados, e não fazem `fetch` nem orquestram o fluxo.
- **Orquestração/estado (`hooks/`):** `useWeather` coordena busca, seleção, carregamento, vazio, sucesso, erro e retry; descarta respostas de buscas antigas. Não constrói URLs nem transforma dados para apresentação.
- **Acesso a dados (`services/`):** `weatherService` monta requisições Open-Meteo, aplica timeout, valida respostas e mapeia o formato externo para os tipos do domínio. Não conhece componentes ou estado React.
- **Funções puras (`lib/`):** conversão Celsius/Fahrenheit, formatação de datas e tradução de códigos WMO; recebem valores e retornam resultados sem rede, estado ou efeitos colaterais.
- **Contratos (`types/`):** tipos compartilhados de cidade, clima, previsão, unidade e erros; não contêm comportamento.

Essa separação permite testar a UI com props, o hook com o serviço simulado, o serviço com `fetch` interceptado e as funções de `lib/` com entradas e saídas diretas. Não há backend, autenticação, analytics ou persistência.

```text
SearchBar -> useWeather -> weatherService.searchCities -> Open-Meteo Geocoding
                         -> weatherService.getForecast -> Open-Meteo Forecast
                         -> CurrentWeather / ForecastList
UnitToggle ----------------> conversão derivada na apresentação
```

As duas chamadas externas são sequenciais: primeiro geocoding pelo nome; depois de uma seleção explícita, forecast pelas coordenadas do resultado. A aplicação não solicita previsão automaticamente ao digitar.

## Tech Stack

| Área | Decisão | Motivo |
| --- | --- | --- |
| Linguagem | TypeScript strict | Tipar contratos de API e estados para reduzir erros de integração. |
| UI | React com Vite | Alinha-se ao projeto e permite entrega como SPA web estática. |
| Estilos | Tailwind CSS | Stack já adotado no projeto. |
| Dependências de runtime | React e React DOM; sem biblioteca de estado ou cliente HTTP adicional | O fluxo cabe em hooks e `fetch`; evita complexidade e dependências desnecessárias. |
| Testes unitários/componentes | Vitest, Testing Library e `user-event` | Compatíveis com Vite e permitem testar comportamento observável. |
| Testes E2E | Playwright | Valida o fluxo de busca e a experiência mobile em navegador. |
| Qualidade | Biome | Lint e formatação conforme configuração do repositório. |
| Dados | Open-Meteo Geocoding e Forecast, sem API key | Fonte definida na spec; respeitar seus limites de uso aberto. |
| Gerenciador | pnpm | Gerenciador adotado pelo projeto. |

## Project Structure

Estrutura proposta, compatível com as convenções do projeto:

```text
src/
  App.tsx
  components/
    SearchBar.tsx
    CityResults.tsx
    CurrentWeather.tsx
    ForecastList.tsx
    ForecastDayCard.tsx
    UnitToggle.tsx
    states/
      EmptyState.tsx
      ErrorState.tsx
      LoadingState.tsx
  hooks/
    useWeather.ts
  services/
    weatherService.ts
  lib/
    temperature.ts
    weatherCodes.ts
    format.ts
  types/
    weather.ts
```

`App.tsx` compõe a tela e conecta componentes ao hook. Os componentes de `states/` representam loading, erro e vazio sem duplicar regras de rede. Os testes ficam em `tests/` e espelham esses limites: `lib/` é testado com entradas e saídas diretas, o serviço com `fetch` interceptado, o hook com serviço simulado e os componentes com props. Fixtures fixas evitam depender da Open-Meteo real.

## Data Model

Contratos conceituais em TypeScript; não são implementação final:

```ts
type Unit = 'celsius' | 'fahrenheit'; // Unidade usada para apresentar as temperaturas.

type WeatherStatus =
  | 'idle'
  | 'loading'
  | 'success'
  | 'empty'
  | 'error';

interface City {
  id: number; // Identificador da localidade no geocoding.
  name: string; // Nome da cidade retornado pela busca.
  country: string | null; // País, quando fornecido.
  region: string | null; // Estado ou região, quando fornecido.
  latitude: number; // Latitude usada para consultar o forecast.
  longitude: number; // Longitude usada para consultar o forecast.
}

interface CurrentWeather {
  time: string | null; // Horário current.time retornado pela API, no fuso consultado.
  temperatureC: number | null; // current.temperature_2m, normalizada para Celsius.
  weatherCode: number | null; // current.weather_code, código WMO da condição.
  humidityPercent: number | null; // current.relative_humidity_2m, em porcentagem.
  windSpeedKmh: number | null; // current.wind_speed_10m, em km/h.
  precipitationMm: number | null; // current.precipitation, em milímetros.
  pressureHpa: number | null; // current.surface_pressure, em hPa.
  status: 'available' | 'unavailable'; // Indica se temperatura e condição estão disponíveis.
}

interface ForecastDay {
  date: string; // Data local do item daily.time, no formato YYYY-MM-DD.
  weatherCode: number | null; // daily.weather_code para esta data.
  minC: number | null; // daily.temperature_2m_min, normalizada para Celsius.
  maxC: number | null; // daily.temperature_2m_max, normalizada para Celsius.
  precipitationProbability: number | null; // daily.precipitation_probability_max, em porcentagem.
  status: 'complete' | 'unavailable'; // Indica se condição, mínima e máxima estão disponíveis.
}

interface WeatherData {
  city: City; // Localidade selecionada pela pessoa.
  timezone: string; // Fuso retornado pela API e usado para interpretar as datas locais.
  current: CurrentWeather; // Dados atuais retornados pelo bloco current.
  forecast: ForecastDay[]; // Cinco itens: hoje e os quatro dias seguintes.
}

interface WeatherViewState {
  status: WeatherStatus;
  query: string;
  cities: City[];
  selectedCity: City | null;
  data: WeatherData | null;
  error: WeatherServiceError | null;
}
```

Temperaturas ficam em Celsius no modelo e são convertidas apenas para apresentação. `CurrentWeather.status` é `unavailable` se faltar temperatura ou código de condição. Um dia da previsão é `unavailable` se faltar data válida, condição, mínima ou máxima; os outros dias completos continuam disponíveis. Valores ausentes nunca são substituídos por zero.

Erro de serviço:

```ts
type WeatherServiceErrorCode =
  | 'timeout'
  | 'network'
  | 'http'
  | 'invalidResponse';

interface WeatherServiceError {
  code: WeatherServiceErrorCode;
  userMessage: string;
}
```

`searchCities(name: string): Promise<City[]>` retorna lista vazia quando o geocoding responde sem resultados. `getForecast(city: City): Promise<WeatherData>` lança erro tipado para falha de transporte, HTTP ou resposta estruturalmente inválida; campos meteorológicos ausentes são representados como indisponíveis.

## Data Flow

1. A pessoa informa uma cidade e envia a busca. Entrada vazia/whitespace é validada localmente e não gera requisição.
2. `useWeather` guarda o termo, muda para `loading` e chama `searchCities`.
3. O serviço consulta o endpoint de geocoding e mapeia cada resultado para `City`.
4. Sem resultados, o hook muda para `empty`; com resultados, apresenta nome, país/região disponíveis e coordenadas quando necessárias para distinguir homônimos.
5. A pessoa seleciona explicitamente um resultado. O hook mantém `loading` e chama `getForecast(city)` com latitude/longitude.
6. O serviço mapeia a resposta para clima atual e cinco dias no fuso indicado pelo provedor. Campos parciais são marcados indisponíveis sem descartar seções/dias válidos.
7. Em sucesso, `CurrentWeather` e `ForecastList` recebem o modelo tipado. A unidade atual converte temperaturas na apresentação sem novo request.
8. Cada busca recebe uma identidade monotônica. Uma resposta cujo identificador não seja o da busca mais recente é ignorada, mesmo que termine por último.
9. Em falha recuperável, o estado mantém o termo ou a cidade selecionada para permitir retry.

## External APIs

### Geocoding

- **URL:** `https://geocoding-api.open-meteo.com/v1/search?name=S%C3%A3o+Paulo&count=5&language=pt&format=json`
- **Método:** `GET`, sem API key.
- **Parâmetros:** `name` é o termo enviado; `count=5` limita os candidatos; `language=pt` solicita nomes em português quando disponíveis; `format=json` solicita JSON.
- **Resposta resumida:**

```json
{
  "results": [
    {
      "id": 3448439,
      "name": "São Paulo",
      "latitude": -23.5475,
      "longitude": -46.6361,
      "country": "Brazil",
      "admin1": "São Paulo"
    }
  ]
}
```

- **Mapeamento para `City`:** `id`, `name`, `latitude` e `longitude` são mapeados diretamente; `country` e `admin1` tornam-se `country` e `region`, normalizados para `null` quando ausentes. Cada resultado é uma opção; a pessoa precisa selecionar uma antes do forecast. Resposta sem `results` significa `City[]` vazio, não erro técnico.
- **Construção da URL:** usar `URLSearchParams` para codificar o termo e os parâmetros.

### Forecast

- **URL:** `https://api.open-meteo.com/v1/forecast?latitude=-23.5475&longitude=-46.6361&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m,precipitation,surface_pressure&daily=weather_code,temperature_2m_min,temperature_2m_max,precipitation_probability_max&temperature_unit=celsius&wind_speed_unit=kmh&precipitation_unit=mm&forecast_days=5&timezone=auto`
- **Método:** `GET`, sem API key.
- **Parâmetros:** `latitude` e `longitude` vêm da cidade selecionada; `current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m,precipitation,surface_pressure` solicita métricas atuais; `daily=weather_code,temperature_2m_min,temperature_2m_max,precipitation_probability_max` solicita os campos diários; `temperature_unit=celsius`, `wind_speed_unit=kmh` e `precipitation_unit=mm` fixam as unidades; `forecast_days=5` pede hoje mais quatro dias; `timezone=auto` solicita o fuso local da coordenada.
- **Resposta resumida:**

```json
{
  "timezone": "America/Sao_Paulo",
  "current": {
    "time": "2026-11-05T08:00",
    "temperature_2m": 18.0,
    "weather_code": 3,
    "relative_humidity_2m": 68,
    "wind_speed_10m": 12.0,
    "precipitation": 0.4,
    "surface_pressure": 1012.0
  },
  "daily": {
    "time": ["2026-11-05", "2026-11-06", "2026-11-07", "2026-11-08", "2026-11-09"],
    "weather_code": [3, 2, 61, 3, 0],
    "temperature_2m_min": [17.0, 18.0, 16.0, 17.0, 19.0],
    "temperature_2m_max": [24.0, 26.0, 22.0, 23.0, 27.0],
    "precipitation_probability_max": [10, 20, 75, 15, 0]
  }
}
```

- **Mapeamento para `WeatherData`:** associar a `City` selecionada à resposta; `timezone` vai para `WeatherData.timezone`. `current.time`, `current.temperature_2m`, `current.weather_code`, `current.relative_humidity_2m`, `current.wind_speed_10m`, `current.precipitation` e `current.surface_pressure` mapeiam para os campos correspondentes de `CurrentWeather`; valores ausentes das métricas são `null`. `status` é `available` quando temperatura e código existem, caso contrário `unavailable`.
- **Mapeamento para `ForecastDay[]`:** percorrer os cinco índices de `daily.time`; em cada índice, mapear `time` para `date`, `weather_code` para `weatherCode`, `temperature_2m_min` para `minC`, `temperature_2m_max` para `maxC` e `precipitation_probability_max` para `precipitationProbability`. Probabilidade ausente é `null` e não altera `status`; condição, mínima ou máxima ausentes tornam somente esse dia `unavailable`. Não preencher ausências com zero.
- **Descrição meteorológica:** `weatherCode` é o código WMO retornado. Uma função pura o converte para a descrição em pt-BR; não solicitar uma descrição textual que o endpoint não retorna.
- **Transporte e frescor:** usar HTTPS e nenhum segredo no cliente. Exibir os dados mais recentes retornados sem prometer tempo real ou aplicar corte local de idade; não adicionar cache offline.

## State Management

O hook `useWeather` é a única fonte do estado de domínio: termo pesquisado, resultados de geocoding, cidade selecionada, dados meteorológicos e erro. Não há store global. Seus estados explícitos são:

- `idle`: nenhuma busca iniciada ou busca vazia validada localmente.
- `loading`: geocoding ou forecast está em andamento.
- `success`: a busca retornou cidades ou o forecast da cidade selecionada foi carregado; `cities` e `data` distinguem qual resultado está disponível.
- `empty`: geocoding terminou com zero resultados; isso não é erro.
- `error`: falha de rede, HTTP, timeout ou envelope de resposta inválido.

`App.tsx` mantém `unit` como estado local da apresentação, inicializado como `celsius` a cada sessão e não persistido. O modelo mantém todas as temperaturas em Celsius. Os componentes recebem `unit` e valores formatados por uma função pura durante a renderização: `F = C × 9/5 + 32`; exibir ao inteiro mais próximo, conforme o baseline da spec. Alternar a unidade não modifica o estado do hook nem dispara novo request.

Cada busca recebe um identificador monotônico mantido pelo hook. Ao concluir, uma operação só pode atualizar a tela se seu identificador ainda corresponder à requisição mais recente.

## Error Handling

- **Entrada vazia:** validar localmente, manter `idle` e não chamar geocoding.
- **Geocoding sem resultados:** transicionar para `empty`, mostrar `Nenhuma cidade encontrada` e manter o campo disponível; não afirmar que a cidade inexiste.
- **Falha de rede:** transicionar para `error`, mostrar mensagem recuperável sem detalhes técnicos e oferecer `Tentar novamente`; preservar termo ou cidade selecionada.
- **Erro da API:** para status HTTP não bem-sucedido ou JSON/envelope estruturalmente inválido, transicionar para `error`; não exibir a resposta como dado meteorológico.
- **Timeout:** usar `AbortController` e encerrar cada requisição após 10 segundos; transicionar para `error`, oferecer retry e nunca deixar loading infinito.
- **Resposta parcial:** se faltar temperatura ou código atual, marcar `current.status` como `unavailable`; se faltar uma métrica atual, a UI apresenta `—` somente para ela. Se faltar probabilidade diária, apresentar `—` somente para essa métrica; condição, mínima ou máxima ausentes tornam só aquele dia `unavailable`. Preservar dados válidos e nunca preencher ausências com zero.
- **Respostas fora de ordem:** ignorar qualquer conclusão cujo identificador não seja o da busca mais recente.
- **Retry:** repetir a mesma busca ou forecast usando o termo/cidade preservados; uma nova busca continua habilitada após erro.
- **Dados do provedor:** apresentar os dados retornados sem aplicar corte de idade ou afirmar observação em tempo real.
- **Privacidade:** não registrar termo, coordenadas, histórico ou eventos em logs próprios; não executar analytics nem reter dados de usuário.

## Testing Strategy

- **Vitest — funções puras:** cobrir Celsius→Fahrenheit, limites e arredondamento; testar mapeamento de códigos WMO e formatação de datas/fusos sem rede ou React.
- **Vitest — services com `fetch` mockado:** verificar URLs, parâmetros e codificação do nome; mapear geocoding e coordenadas; tratar lista vazia, respostas válidas e parciais, inclusive métricas atuais e probabilidade diária ausentes, status HTTP não-OK, JSON/envelope inválido, falha de rede e timeout. Validar que o forecast usa as coordenadas selecionadas e produz os cinco dias esperados.
- **Testing Library — componentes e hook:** renderizar os estados `loading`, `error`, `empty` e `success`; verificar conteúdo acessível, campo de nova busca, retry com termo/cidade preservados, métricas e fallback `—` por campo ausente, probabilidade de chuva por dia, dados parciais sem valores inventados e descarte de resposta antiga.
- **Playwright — E2E:** exercitar busca manual → selecionar cidade → ver clima atual e cinco dias → alternar C/F; cobrir input vazio, geocoding sem resultados, erro/timeout com retry e respostas de buscas concorrentes fora de ordem. Verificar que alternar unidade não envia novo request.
- **Viewport mobile e determinismo:** interceptar endpoints com fixtures; não depender da API real nos testes automatizados. Executar os fluxos essenciais em 320 CSS px e desktop, verificando ausência de rolagem horizontal e controles utilizáveis por teclado.
- **Qualidade não funcional:** validar contraste e nomes acessíveis conforme WCAG 2.2 AA; medir Core Web Vitals e p95 da consulta no perfil de rede definido pela spec. Não há teste de SLA/uptime formal na v1.

## Risks & Trade-offs

| Decisão | Alternativa considerada | Trade-off |
| --- | --- | --- |
| Chamar Open-Meteo diretamente do navegador, sem API key | Criar backend/proxy para intermediar chamadas | Menos infraestrutura e deploy mais simples; a aplicação fica sujeita à rede, CORS, limites e disponibilidade do provedor. Um proxy permitiria controle adicional, mas adicionaria operação, custo e superfície de segurança sem necessidade atual. |
| Estado local em `useWeather` e `App.tsx` | Redux/Zustand ou biblioteca de cache de queries | Menos dependências e fluxo suficiente para uma tela; ao crescerem telas, cache ou sincronização, a solução local exigiria reorganização. |
| Celsius como unidade canônica; converter durante a renderização | Solicitar novamente os dados para cada unidade ou armazenar valores duplicados | Evita requests e estado duplicado; requer conversão e arredondamento consistentes numa função pura. |
| Sem cache e sem persistência | Cache local com TTL ou preferências persistidas | Reduz risco de exibir dados antigos e evita armazenar informação; aumenta chamadas repetidas e a unidade volta a Celsius a cada sessão. |
| Modelar respostas parciais como indisponibilidade por bloco/dia | Falhar toda a consulta ou exibir placeholders em todos os campos | Preserva dados válidos sem inventar valores; exige que UI e testes tratem estados parciais. Falha total é mais simples, mas descarta informação utilizável. |
| `fetch`, timeout próprio e identificador da busca mais recente | Cliente HTTP/query library com retries, cache e deduplicação | Mantém dependências pequenas e comportamento explícito; recursos como cache e políticas automáticas de retry precisariam ser adicionados se o produto crescer. |

Limites e cobertura do Open-Meteo podem variar; os erros são tratados na UI e não há garantia de disponibilidade do provedor nem SLA formal da aplicação nesta versão.