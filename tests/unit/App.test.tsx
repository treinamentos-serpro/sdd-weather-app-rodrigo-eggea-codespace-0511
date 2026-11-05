import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App';
import { useWeather } from '../../src/hooks/useWeather';
import { mockWeatherData } from '../../src/mocks/weatherData';

vi.mock('../../src/hooks/useWeather', () => ({
  useWeather: vi.fn(),
}));

const mockedUseWeather = vi.mocked(useWeather);
const search = vi.fn(async (_name: string) => {});
const selectCity = vi.fn(async (_city: (typeof mockWeatherData)['city']) => {});
const retry = vi.fn(async () => {});

function setWeatherState(overrides: Partial<ReturnType<typeof useWeather>> = {}): void {
  mockedUseWeather.mockReturnValue({
    status: 'idle',
    query: '',
    cities: [],
    selectedCity: null,
    data: null,
    error: null,
    search,
    selectCity,
    retry,
    ...overrides,
  });
}

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setWeatherState();
  });

  it('renderiza o estado idle e permite iniciar uma busca', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByText('Consulte o clima da sua cidade')).toBeInTheDocument();
    await user.type(screen.getByRole('searchbox', { name: 'Buscar cidade' }), 'São Paulo');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(search).toHaveBeenCalledWith('São Paulo');
  });

  it('renderiza o estado loading', () => {
    setWeatherState({ status: 'loading' });
    render(<App />);

    expect(screen.getByRole('status')).toHaveTextContent('Carregando previsão do tempo');
  });

  it('renderiza o estado empty para o termo pesquisado', () => {
    setWeatherState({ status: 'empty', query: 'Nárnia' });
    render(<App />);

    expect(screen.getByText('Nenhuma cidade encontrada para “Nárnia”')).toBeInTheDocument();
  });

  it('renderiza o erro e encaminha retry ao hook', async () => {
    const user = userEvent.setup();
    setWeatherState({
      status: 'error',
      error: { code: 'network', userMessage: 'Falha de rede.' },
    });
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Falha de rede.');
    expect(retry).toHaveBeenCalledOnce();
  });

  it('renderiza clima atual e cinco dias no estado success', () => {
    setWeatherState({
      status: 'success',
      cities: [mockWeatherData.city],
      selectedCity: mockWeatherData.city,
      data: mockWeatherData,
    });
    render(<App />);

    expect(screen.getByRole('heading', { name: 'São Paulo' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Próximos 5 dias' })).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(5);
  });
});
