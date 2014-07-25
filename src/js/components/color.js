/**
 * @jsx React.DOM
 */

var React = require('react');
var Color = React.createClass({displayName: 'Color',

  render: function() {
    var _ = this.props;
    return (
      React.DOM.div({className: "item item-toggle "+_.class+"-bg "+_.class}, 
        _.label, 
        React.DOM.label({className: "toggle toggle-"+_.class}, 
           _.input, 
           React.DOM.div({className: "track"}, 
             React.DOM.div({className: "handle"})
           )
        )
      )
      );
  }

});

module.exports = Color;