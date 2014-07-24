/**
 * @jsx React.DOM
 */

var React = require('react');

var Header = React.createClass({displayName: 'Header',

  render: function() {
    var _ = this.props;
    return (
      React.DOM.div({className: "bar "+_.class}, 
        React.DOM.h1({className: "title"}, _.title)
      )
    );
  }

});

module.exports = Header;