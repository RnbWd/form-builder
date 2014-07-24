/**
 * @jsx React.DOM
 */

var React = require('react');

var Color = React.createClass({displayName: 'Color',

  render: function() {
    var _ = this.props;
    return (
      React.DOM.label({className: "item item-radio"}, 
        _.input, 
        React.DOM.div({className: "item-content item-icon-left text-center"}, 
          React.DOM.i({className: 'icon ion-ios7-pricetags '+_.class}), 
          _.label
        ), 
        React.DOM.i({className: "radio-icon ion-checkmark"})
      )
    );
  }

});

module.exports = Color;