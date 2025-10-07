import { render } from '@testing-library/react-native';
import App from '../App';

describe('App integration smoke test', () => {
  it('combines core UI elements together', () => {
    const { getByTestId, getByText } = render(<App />);

    const container = getByTestId('app-container');
    expect(container).toBeTruthy();
    expect(getByTestId('greeting-text')).toHaveTextContent('Hola, MISO');
    expect(getByText('Bienvenido al cliente móvil')).toBeTruthy();
  });
});
