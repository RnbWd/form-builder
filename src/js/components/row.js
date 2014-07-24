/**
 * @jsx React.DOM
 */

var React = require('react');

var Row = React.createClass({displayName: 'Row',

  render: function() {
    var _ = this.props;
    return (
      React.DOM.div({className: "row "+_.class}, 
        _.children
      )
    );
  }

});

module.exports = Row;