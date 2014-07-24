/**
 * @jsx React.DOM
 */

var React = require('react');

var Col = React.createClass({displayName: 'Col',

  render: function() {
    var _ = this.props;
    return (
      React.DOM.div({className: "col "+_.class}, 
        _.children
      )
    );
  }

});

module.exports = Col;