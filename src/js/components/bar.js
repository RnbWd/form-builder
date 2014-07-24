/**
 * @jsx React.DOM
 */

var React = require('react');

var Header = React.createClass({displayName: 'Header',
  getDefaultProps: function() {
    return {
      class: 'bar-header bar-stable'
    };
  },
  render: function() {
    var _ = this.props;
    return (
      React.DOM.div({className: "bar "+_.class}, 
        _.children
      )
    );
  }

});

module.exports = Header;