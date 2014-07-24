/**
 * @jsx React.DOM
 */

var React = require('react');

var Input = React.createClass({displayName: 'Input',
  render: function() {
    var _ = this.props;
    return (
      React.DOM.input({type: "text", className: _.class, style: _.style, value: _.value, onChange: _.change})
    );
  }
});

module.exports = Input;