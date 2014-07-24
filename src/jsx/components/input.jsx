/**
 * @jsx React.DOM
 */

var React = require('react');

var Input = React.createClass({
  render: function() {
    var _ = this.props;
    return (
      <input type="text" className={_.class} style={_.style} value={_.value} onChange={_.change}/>
    );
  }
});

module.exports = Input;