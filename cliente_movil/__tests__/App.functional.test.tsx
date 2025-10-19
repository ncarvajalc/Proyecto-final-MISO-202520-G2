import { render } from '@testing-library/react-native';
import App, { Greeting } from '../App';

describe('App functional smoke test', () => {
  it('renders without crashing and responds to prop updates', () => {
    const view = render(<App />);
    expect(view.getByTestId('app-container')).toBeTruthy();
  });

  it('updates greeting when props change', () => {
    const { update, getByTestId } = render(<Greeting name="Explorador" />);
    expect(getByTestId('greeting-text')).toHaveTextContent('Hola, Explorador');

    update(<Greeting name="Desarrollador" />);
    expect(getByTestId('greeting-text')).toHaveTextContent('Hola, Desarrollador');
  });
});
