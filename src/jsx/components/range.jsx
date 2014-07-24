/**
 * @jsx React.DOM
 */

var React = require('react');

var Range = React.createClass({
  getDefaultProps: function() {
    return {
      input: <input type="range" name="volume" min="0" max="100" />
    };
  },
  render: function() {
    var _ = this.props;
    var left = <i className={"icon "+_.left}/>;
    var right = <i className={"icon "+_.right}/>;
    return (
      <div className={"item range "+_.class}>
        {_.left ? left : ''}
        {_.input}
        {_.right ? right : ''}
      </div>
    );
  }

});

module.exports = Range;