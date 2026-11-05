import { afterEach, describe, expect, it, vi } from 'vitest';
import { getWeather, searchCities, WeatherServiceError } from '../../src/services/weatherService';
import type { City } from '../../src/types/weather';

const sampleCity: City = {
  id: 3448439,
  name: 'São Paulo',
  country: 'Brasil',
  region: 'São Paulo',
  latitude: -23.5475,
  longitude: -46.6361,
};

const forecastDates = ['2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08', '2026-11-09'];

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('searchCities', () => {
  it('retorna lista vazia e não chama a rede para input vazio', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(searchCities('   ')).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('codifica o nome e mapeia resultados para City', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          results: [
            {
              id: 3448439,
              name: 'São Paulo',
              country: 'Brasil',
              admin1: 'São Paulo',
              latitude: -23.5475,
              longitude: -46.6361,
            },
            {
              id: 123,
              name: 'Lisboa',
              latitude: 38.7223,
              longitude: -9.1393,
            },
          ],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const cities = await searchCities(' São Paulo & região ');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://geocoding-api.open-meteo.com/v1/search?name=S%C3%A3o%20Paulo%20%26%20regi%C3%A3o&count=5&language=pt&format=json',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(cities).toEqual([
      {
        id: 3448439,
        name: 'São Paulo',
        country: 'Brasil',
        region: 'São Paulo',
        latitude: -23.5475,
        longitude: -46.6361,
      },
      {
        id: 123,
        name: 'Lisboa',
        country: null,
        region: null,
        latitude: 38.7223,
        longitude: -9.1393,
      },
    ]);
  });

  it('retorna lista vazia quando o geocoding não encontra resultados', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 200 })));

    await expect(searchCities('Cidade inexistente')).resolves.toEqual([]);
  });

  it('lança WeatherServiceError quando a resposta HTTP não é ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 503 })));
    const request = searchCities('Lisboa');

    await expect(request).rejects.toBeInstanceOf(WeatherServiceError);
    await expect(request).rejects.toMatchObject({ code: 'http' });
  });

  it('lança WeatherServiceError para falha de rede', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Network error')));

    await expect(searchCities('Lisboa')).rejects.toMatchObject({
      name: 'WeatherServiceError',
      code: 'network',
      userMessage: 'Falha de rede.',
    });
  });

  it.each([
    ['geocoding', () => searchCities('Lisboa')],
    ['forecast', () => getWeather(sampleCity)],
  ])('converte AbortError em WeatherServiceError de timeout no %s', async (_endpoint, request) => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(
      (_url: string, options?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          options?.signal?.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'));
          });
        }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = request();
    const assertion = expect(result).rejects.toMatchObject({
      name: 'WeatherServiceError',
      code: 'timeout',
      userMessage: 'A requisição demorou demais.',
    });
    await vi.advanceTimersByTimeAsync(10_000);
    await assertion;
  });

  it('limpa o timeout após respostas bem-sucedidas nos dois endpoints', async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ results: [] }), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            timezone: 'America/Sao_Paulo',
            current: {},
            daily: { time: forecastDates },
          }),
          { status: 200 },
        ),
      );
    vi.stubGlobal('fetch', fetchMock);

    await searchCities('Lisboa');
    expect(vi.getTimerCount()).toBe(0);

    await getWeather(sampleCity);
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('getWeather', () => {
  it('mapeia current e os cinco itens diários para WeatherData', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          timezone: 'America/Sao_Paulo',
          current: {
            time: '2026-11-05T08:00',
            temperature_2m: 18,
            weather_code: 3,
            relative_humidity_2m: 68,
            wind_speed_10m: 12,
            precipitation: 0.4,
            surface_pressure: 1012,
          },
          daily: {
            time: forecastDates,
            weather_code: [3, 2, 61, 3, 0],
            temperature_2m_min: [17, 18, 16, 17, 19],
            temperature_2m_max: [24, 26, 22, 23, 27],
            precipitation_probability_max: [10, 20, 75, 15, 0],
          },
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const weather = await getWeather(sampleCity);
    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    const requestUrl = new URL(url);

    expect(requestUrl.searchParams.get('latitude')).toBe(String(sampleCity.latitude));
    expect(requestUrl.searchParams.get('longitude')).toBe(String(sampleCity.longitude));
    expect(requestUrl.searchParams.get('current')).toContain('relative_humidity_2m');
    expect(requestUrl.searchParams.get('daily')).toContain('precipitation_probability_max');
    expect(requestUrl.searchParams.get('forecast_days')).toBe('5');
    expect(requestUrl.searchParams.get('temperature_unit')).toBe('celsius');
    expect(weather).toEqual({
      city: sampleCity,
      timezone: 'America/Sao_Paulo',
      current: {
        time: '2026-11-05T08:00',
        temperatureC: 18,
        weatherCode: 3,
        humidityPercent: 68,
        windSpeedKmh: 12,
        precipitationMm: 0.4,
        pressureHpa: 1012,
        status: 'available',
      },
      forecast: [
        {
          date: forecastDates[0],
          weatherCode: 3,
          minC: 17,
          maxC: 24,
          precipitationProbability: 10,
          status: 'complete',
        },
        {
          date: forecastDates[1],
          weatherCode: 2,
          minC: 18,
          maxC: 26,
          precipitationProbability: 20,
          status: 'complete',
        },
        {
          date: forecastDates[2],
          weatherCode: 61,
          minC: 16,
          maxC: 22,
          precipitationProbability: 75,
          status: 'complete',
        },
        {
          date: forecastDates[3],
          weatherCode: 3,
          minC: 17,
          maxC: 23,
          precipitationProbability: 15,
          status: 'complete',
        },
        {
          date: forecastDates[4],
          weatherCode: 0,
          minC: 19,
          maxC: 27,
          precipitationProbability: 0,
          status: 'complete',
        },
      ],
    });
  });

  it.each([
    'current',
    'daily',
  ] as const)('lança erro tipado quando %s está ausente', async (missingBlock) => {
    const payload = {
      timezone: 'America/Sao_Paulo',
      current: {
        time: '2026-11-05T08:00',
        temperature_2m: 18,
        weather_code: 3,
      },
      daily: { time: forecastDates },
    };
    delete payload[missingBlock];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(payload))));

    await expect(getWeather(sampleCity)).rejects.toMatchObject({
      name: 'WeatherServiceError',
      code: 'invalidResponse',
    });
  });

  it('lança WeatherServiceError quando a API de forecast retorna HTTP não-ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 503 })));

    await expect(getWeather(sampleCity)).rejects.toMatchObject({
      name: 'WeatherServiceError',
      code: 'http',
      userMessage: 'Não foi possível carregar o clima. Tente novamente.',
    });
  });

  it('lança WeatherServiceError quando a chamada de forecast falha na rede', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Network error')));

    await expect(getWeather(sampleCity)).rejects.toMatchObject({
      name: 'WeatherServiceError',
      code: 'network',
      userMessage: 'Falha de rede.',
    });
  });

  it('lança erro tipado quando a resposta não contém exatamente cinco datas', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            timezone: 'America/Sao_Paulo',
            current: { temperature_2m: 18, weather_code: 3 },
            daily: { time: forecastDates.slice(0, 4) },
          }),
        ),
      ),
    );

    await expect(getWeather(sampleCity)).rejects.toMatchObject({
      name: 'WeatherServiceError',
      code: 'invalidResponse',
    });
  });

  it('preserva o forecast quando uma métrica opcional está ausente', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            timezone: 'America/Sao_Paulo',
            current: { temperature_2m: 18, weather_code: 3, precipitation: null },
            daily: {
              time: forecastDates,
              weather_code: [3, 2, 61, 3, 0],
              temperature_2m_min: [17, 18, 16, 17, 19],
              temperature_2m_max: [24, 26, 22, 23, 27],
              precipitation_probability_max: [10, null, 75, 15, 0],
            },
          }),
        ),
      ),
    );

    const weather = await getWeather(sampleCity);

    expect(weather.current.precipitationMm).toBeNull();
    expect(weather.current.status).toBe('available');
    expect(weather.forecast).toHaveLength(5);
    expect(weather.forecast[1]).toMatchObject({
      precipitationProbability: null,
      status: 'complete',
    });
  });

  it.each([
    'temperature_2m',
    'weather_code',
  ] as const)('marca clima atual unavailable quando falta %s sem descartar a previsão', async (missingField) => {
    const current: Record<string, unknown> = {
      temperature_2m: 18,
      weather_code: 3,
      relative_humidity_2m: 68,
      wind_speed_10m: 12,
      precipitation: 0,
      surface_pressure: 1012,
    };
    current[missingField] = null;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            timezone: 'America/Sao_Paulo',
            current,
            daily: {
              time: forecastDates,
              weather_code: [3, 2, 61, 3, 0],
              temperature_2m_min: [17, 18, 16, 17, 19],
              temperature_2m_max: [24, 26, 22, 23, 27],
              precipitation_probability_max: [10, 20, 75, 15, 0],
            },
          }),
        ),
      ),
    );

    const weather = await getWeather(sampleCity);

    expect(weather.current.status).toBe('unavailable');
    expect(weather.forecast).toHaveLength(5);
    expect(weather.forecast.every((day) => day.status === 'complete')).toBe(true);
  });

  it('marca indisponível somente o dia com mínima obrigatória ausente', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            timezone: 'America/Sao_Paulo',
            current: { temperature_2m: 18, weather_code: 3 },
            daily: {
              time: forecastDates,
              weather_code: [3, 2, 61, 3, 0],
              temperature_2m_min: [17, null, 16, 17, 19],
              temperature_2m_max: [24, 26, 22, 23, 27],
              precipitation_probability_max: [10, 20, 75, 15, 0],
            },
          }),
        ),
      ),
    );

    const weather = await getWeather(sampleCity);

    expect(weather.forecast).toHaveLength(5);
    expect(weather.forecast[0]?.status).toBe('complete');
    expect(weather.forecast[1]).toMatchObject({ minC: null, status: 'unavailable' });
    expect(weather.forecast[2]?.status).toBe('complete');
  });
});
