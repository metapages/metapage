import { h, Component } from 'preact';
import Hello from './hello';
import Row from './row';
// import styles from '../../css/bulma-0.7.1.css';
import bulma from 'bulma/bulma';

import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import faCoffee from '@fortawesome/fontawesome-free-solid/faCoffee'

export default class App extends Component {
	// state = { inputs: {}, inputsOrder = [] };
	render() {
		return (
			<div class="app">
				<a id="add-input-button" class="button is-success is-outlined">
			    <span>Input</span>
			    <span class="icon is-small">
			      <i class="fas fa-plus"></i>
			    </span>
			  </a>

				<table class="table is-bordered is-fullwidth">
					<tbody id="tablebody">
						<Row name="testname" value="somevalue" />
					</tbody>

				</table>
				<h1>Should be font awesome:</h1>
				<FontAwesomeIcon icon={faCoffee} />
				<h1>Hello!</h1>
				<Hello />
			</div>
		);
	}
}
