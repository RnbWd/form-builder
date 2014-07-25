/**
 * @jsx React.DOM
 */

var React = require('react');

var Preview = React.createClass({displayName: 'Preview',

  render: function() {
    var _ = this.props;
    var forms = _.forms.map(function(form, key) {
      if(form.type === 'checkbox') {
        return (
        React.DOM.div({key: key, className: 'item item-checkbox text-center'}, 
          React.DOM.label({className: form.type}, 
            React.DOM.input({type: form.type})
          ), 
           React.DOM.span({style: {marginLeft: '-20%'}}, form.label)
        )
        );
      } else {
        return (
            React.DOM.label({key: key, className: "item item-input"}, 
              React.DOM.span({className: "input-label"}, form.label), 
              React.DOM.input({type: form.type, placeholder: form.label})
            )
          );
      }
      
    });
    return (
      React.DOM.div({className: "tablet content", style: {width: _.width, height: _.height}}, 
        React.DOM.div({className: "bar bar-header "+_.color}, React.DOM.h1({className: "title"}, _.title)), 
          React.DOM.div({className: "list list-inset", style: {marginTop: 40}}, 
            forms
        )
      )
    );
  }

});

module.exports = Preview;