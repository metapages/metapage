import { h, Component } from 'preact';
import Hello from './hello';

import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import faCoffee from '@fortawesome/fontawesome-free-solid/faCoffee'

export default class App extends Component {
	render() {
		return (
			<div class="app">
				<h1>Should be font awesome:</h1>
				<FontAwesomeIcon icon={faCoffee} />
				<h1>Hello!</h1>
				<Hello />
			</div>
		);
	}
}
