import { render } from '@testing-library/react-native';
import { Greeting } from '../App';

describe('Greeting component - unit smoke test', () => {
  it('renders the provided name', () => {
    const { getByTestId } = render(<Greeting name="Equipo" />);
    expect(getByTestId('greeting-text')).toHaveTextContent('Hola, Equipo');
  });

  it('falls back to default when name is missing', () => {
    const { getByTestId } = render(<Greeting />);
    expect(getByTestId('greeting-text')).toHaveTextContent('Hola, Explorador');
  });
});
