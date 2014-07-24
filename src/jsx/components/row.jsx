/**
 * @jsx React.DOM
 */

var React = require('react');

var Row = React.createClass({

  render: function() {
    var _ = this.props;
    return (
      <div className={"row "+_.class}>
        {_.children}
      </div>
    );
  }

});

module.exports = Row;