/**
 * @jsx React.DOM
 */

var React = require('react');

var Range = React.createClass({displayName: 'Range',
  getDefaultProps: function() {
    return {
      input: React.DOM.input({type: "range", name: "volume", min: "0", max: "100"})
    };
  },
  render: function() {
    var _ = this.props;
    var left = React.DOM.i({className: "icon "+_.left});
    var right = React.DOM.i({className: "icon "+_.right});
    return (
      React.DOM.div({className: "item range "+_.class}, 
        _.left ? left : '', 
        _.input, 
        _.right ? right : ''
      )
    );
  }

});

module.exports = Range;