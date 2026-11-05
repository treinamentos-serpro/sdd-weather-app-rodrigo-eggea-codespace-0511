# Discovery — Aplicação de Previsão do Tempo

## Contexto

A empresa solicitou uma aplicação para pessoas que querem consultar a previsão do tempo diariamente. A aplicação permite pesquisar uma cidade, consultar seu clima e previsão, alternar entre Celsius e Fahrenheit e funciona em dispositivos móveis e telas maiores. A cobertura geográfica limita-se às cidades retornadas pelo serviço de geocodificação do Open-Meteo; não há garantia de cobertura exaustiva de todos os países ou localidades.

## Requisitos Funcionais

- **RF1 — Buscar cidades:** após o usuário informar o nome da cidade e acionar a busca, consultar o geocoding do Open-Meteo e apresentar as localizações correspondentes.
- **RF2 — Selecionar uma localização:** permitir escolher um resultado de geocoding e usar sua latitude e longitude para consultar a previsão no Open-Meteo; mostrar informações geográficas disponíveis para distinguir homônimos.
- **RF3 — Consultar clima atual:** exibir os dados mais recentes disponibilizados pelo endpoint de previsão para a cidade selecionada, sem prometer observação em tempo real.
- **RF4 — Consultar previsão:** exibir a previsão para cinco dias da cidade selecionada.
- **RF5 — Alternar unidades:** permitir alternar entre Celsius e Fahrenheit e atualizar os valores de temperatura apresentados.
- **RF6 — Comunicar estados da consulta:** informar quando os dados estão carregando, quando não há correspondências e quando ocorre uma falha que impede a consulta.

## Requisitos Não-Funcionais

- **RNF1 — Responsividade:** a interface deve se adaptar a dispositivos móveis e telas maiores, mantendo legibilidade e acesso às funções principais.
- **RNF2 — Usabilidade:** pesquisa, leitura das condições e alternância de unidades devem ser compreensíveis sem instruções externas.
- **RNF3 — Desempenho:** buscas e atualização das condições devem fornecer retorno ao usuário; a especificação define os limites propostos para aceite.
- **RNF4 — Acessibilidade:** controles devem ser operáveis por teclado, ter nomes acessíveis e apresentar contraste legível.
- **RNF5 — Resiliência:** falhas de conexão ou indisponibilidade da fonte de dados não devem deixar a interface sem feedback ou sem uma forma clara de tentar novamente.
- **RNF6 — Compatibilidade:** a aplicação deve funcionar nos navegadores e versões móveis que a empresa definir como suportados.

## Riscos

| Categoria | Risco | Probabilidade | Impacto | Estratégia de mitigação |
| --- | --- | --- | --- | --- |
| Produto | Público-alvo foi definido de forma ampla, sem perfil prioritário mais específico | Média | O conteúdo pode não atender igualmente a todos os contextos de consulta diária. | Priorizar a consulta diária como tarefa principal e validar personas secundárias antes de expandir o escopo. |
| Produto | “Previsão de 5 dias” e conteúdo de cada dia permanecem ambíguos | Alta | Usuários e equipe podem esperar intervalos ou informações diferentes; aumenta retrabalho e divergência de aceite. | Definir se hoje está incluído, granularidade e variáveis exibidas; registrar exemplos de aceite com datas. |
| Produto | Escopo de localização, favoritos, histórico e persistência não está definido | Média | Funcionalidades esperadas podem ficar de fora ou expandir o escopo e o cronograma sem planejamento. | Priorizar explicitamente o MVP e separar melhorias posteriores; validar necessidade de conta e persistência. |
| Produto | Pesquisa por nome pode retornar cidades homônimas ou cobertura insuficiente em algumas regiões | Alta | A pessoa pode consultar o local errado ou não encontrar sua cidade, comprometendo a confiança no app. | Confirmar regiões atendidas e apresentar país/região nos resultados; validar busca com nomes ambíguos e variantes locais. |
| Técnico | Provedor meteorológico pode ficar indisponível, limitar requisições ou alterar termos | Média | Consultas podem falhar ou degradar. | Usar a API dentro dos limites de uso aberto, acompanhar as condições do provedor e implementar timeout, tratamento de erro e nova tentativa. |
| Técnico | Dados mais recentes disponíveis podem ser interpretados como observações em tempo real | Média | Usuários podem esperar precisão ou imediatismo não garantidos pelo provedor. | Exibir os dados disponibilizados pela API sem alegar que são observações em tempo real. |
| Técnico | Fuso horário da cidade e do dispositivo podem causar datas incorretas | Média | “Hoje” e os dias da previsão podem aparecer deslocados, especialmente em consultas a outras regiões. | Usar o fuso associado à localidade consultada e testar cidades em fusos diferentes e transições de horário. |
| Técnico | Latência ou falha de rede pode tornar a busca lenta ou indisponível | Alta | A experiência pode parecer travada ou impedir a consulta em redes móveis instáveis. | Definir metas de latência, apresentar estado de carregamento, aplicar timeout e oferecer nova tentativa; avaliar cache se fizer sentido. |
| Técnico | Conversão e arredondamento de Celsius/Fahrenheit podem produzir valores inconsistentes | Baixa | Temperaturas incorretas prejudicam a confiança e podem induzir decisões inadequadas. | Manter uma unidade canônica, definir regra de arredondamento e testar conversões e valores extremos. |
| Técnico | Layout pode falhar em telas pequenas ou com recursos de acessibilidade | Média | Controles ou dados podem ficar difíceis de ler e operar, excluindo parte dos usuários. | Validar em larguras móveis representativas, teclado e leitor de tela; adotar critérios de acessibilidade verificáveis. |
| Técnico | Coleta de localização ou histórico sem regras claras pode expor dados pessoais | Baixa | Pode gerar perda de confiança, risco legal e necessidade de retrabalho na arquitetura. | Minimizar coleta, pedir consentimento quando necessário e definir retenção, exclusão e proteção antes de armazenar dados. |

## Perguntas em Aberto

1. As metas propostas de desempenho, acessibilidade e compatibilidade da especificação são aprovadas pelos responsáveis? **Impacto:** sem aprovação, os critérios de lançamento podem não refletir as expectativas do produto e da operação.

As perguntas acima expõem lacunas do briefing; não implicam que todos os recursos devam fazer parte da primeira versão. As respostas devem ser priorizadas com stakeholders antes de fechar escopo e critérios de aceite.

## Suposições

- O público prioritário é composto por pessoas que querem consultar a previsão do tempo diariamente.
- A busca usa o nome da cidade no serviço de geocodificação do Open-Meteo; a seleção usa latitude e longitude retornadas para consultar o endpoint de previsão.
- A cobertura geográfica limita-se às localizações retornadas pelo geocoding; não há garantia de cobertura universal.
- A aplicação apresenta os dados mais recentes disponíveis na API, sem declarar que são observações em tempo real ou impor um limite próprio de idade.
- A alternância de unidade afeta os valores de temperatura, sem alterar a cidade consultada.
- O produto precisa oferecer uma experiência utilizável em telas móveis, além de telas maiores.
- Não há login, analytics nem retenção/persistência de dados do usuário pela aplicação.
- Os detalhes do clima atual e da previsão serão definidos durante a especificação do produto.

## Personas (hipóteses)

- **Pessoa que consulta a previsão diariamente (persona primária):** quer saber as condições do dia para planejar a rotina. **Contexto de uso:** principalmente mobile, com consultas rápidas. **Métrica de sucesso pessoal:** obtém a previsão da cidade correta sem depender de outra fonte. *(Meta inicial a validar.)*
- **Pessoa que planeja uma viagem:** compara as condições dos próximos dias para escolher quando viajar ou o que levar. **Contexto de uso:** principalmente desktop, ao organizar o roteiro; pode voltar ao app pelo celular. **Métrica de sucesso pessoal:** consegue identificar e comparar as condições dos cinco dias da viagem em uma única consulta, sem anotações ou busca paralela. *(Validar se o conteúdo da previsão atende a essa tarefa.)*
- **Pessoa viajando entre cidades ou países:** consulta o clima do destino em movimento e pode preferir Fahrenheit. **Contexto de uso:** principalmente mobile, com atenção dividida e rede variável. **Métrica de sucesso pessoal:** seleciona a cidade correta e entende temperatura e condição local em até um minuto, sem fazer conversões manualmente. *(Meta inicial a validar.)*

## Decisões

| Decisão | Justificativa | Resultado |
| --- | --- | --- |
| Público prioritário: pessoas que consultam a previsão do tempo diariamente. | Direciona a primeira versão para consulta rápida e recorrente do clima. | Define a audiência primária; personas secundárias continuam hipóteses. |
| Cobertura geográfica: cidades retornadas pelo serviço de geocodificação do Open-Meteo. | Usa a cobertura que a fonte efetivamente oferece, sem prometer localidades não retornadas. | Limita a cobertura; cidades representativas ainda devem ser escolhidas para testes. |
| Fonte: Open-Meteo, sem API key, dentro dos limites de uso aberto. | Evita credenciais no cliente e aceita as condições e limitações do serviço de uso aberto. | Define o provedor e as restrições de uso aplicáveis. |
| Fluxo: busca explícita pelo nome da cidade no geocoding; seleção do resultado; consulta de previsão com latitude e longitude. | Descreve a sequência de consultas e evita busca automática a cada tecla. | Define o contrato entre busca de localidade e consulta meteorológica. |
| Frescor: apresentar os dados mais recentes disponíveis na API, sem regra própria de idade máxima ou promessa de tempo real. | Alinha a expectativa ao dado realmente oferecido pelo provedor. | Fecha a semântica de frescor; a interface não impõe limite de idade nem declara observação em tempo real. |
| “5 dias” significa hoje mais os quatro dias seguintes; unidade padrão Celsius; interface pt-BR. | Fecha o horizonte, a unidade inicial e o idioma da primeira versão. | Define decisões de período, unidade e idioma. |
| Sem autenticação, analytics ou retenção de dados do usuário pela aplicação; sem persistência de servidor. | Reduz coleta de dados e escopo na primeira versão. | Exclui conta, analytics, histórico persistente e armazenamento de dados do usuário pela aplicação. |
| Sem meta formal de disponibilidade de 99,5%. | A aplicação informa falhas do provedor, mas não garante uptime do serviço externo nem um SLA próprio. | Não há meta de uptime de 99,5%; indisponibilidade deve ser comunicada e permitir nova tentativa. |
