/**
 * @jsx React.DOM
 */

var React = require('react');

var Col = React.createClass({

  render: function() {
    var _ = this.props;
    return (
      <div className={"col "+_.class}>
        {_.children}
      </div>
    );
  }

});

module.exports = Col;