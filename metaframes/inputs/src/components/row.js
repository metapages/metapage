import { h, Component } from 'preact';

export default class Row extends Component {
    render() {
        let name = this.props.name;
        let value = this.props.value;
        return (
            <tr>
				<td className="box-name">
					{name}
				</td>
				<td className="box-value">
					{value}
				</td>
			</tr>
        );
    }
}
