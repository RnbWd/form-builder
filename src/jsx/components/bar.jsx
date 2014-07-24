/**
 * @jsx React.DOM
 */

var React = require('react');

var Header = React.createClass({
  getDefaultProps: function() {
    return {
      class: 'bar-header bar-stable'
    };
  },
  render: function() {
    var _ = this.props;
    return (
      <div className={"bar "+_.class}>
        {_.children}
      </div>
    );
  }

});

module.exports = Header;