/**
 * @jsx React.DOM
 */

var React = require('react');

var Preview = React.createClass({displayName: 'Preview',

  render: function() {
    var _ = this.props;
    return (
      React.DOM.div({className: "tablet content", style: {width: _.width, height: _.height}}, 
        React.DOM.div({className: "bar bar-header "+_.color}, React.DOM.h1({className: "title"}, _.title)), 
          React.DOM.div({className: "list list-inset", style: {marginTop: 40}}, 
          React.DOM.label({className: "item item-input"}, 
            React.DOM.span({className: "input-label"}, "First Name"), 
            React.DOM.input({type: "text", placeholder: "First Name"})
          ), 
          React.DOM.label({className: "item item-input"}, 
            React.DOM.span({className: "input-label"}, "Last Name"), 
            React.DOM.input({type: "text", placeholder: "Last Name"})
          )
        )
      )
    );
  }

});

module.exports = Preview;