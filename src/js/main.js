/**
 * @jsx React.DOM
 */

var React = require('react');
var field = require('./components');

var Main = React.createClass({displayName: 'Main',
  getInitialState: function() {
    return {
      value: 'hello',
      class: '',
      width: 400 
    };
  },
  render: function() {
    var $ = this.state;
    return (
      React.DOM.div({className: "field"}, 
        React.DOM.div({className: "mid text-center"}, 
          React.DOM.p({className: "lead"}, "Modify"), 
          React.DOM.hr(null), 
          "Width: ", field.Input({class: "", style: {width: 100}, value: $.width, change: this.handleWidth})
        ), 
        React.DOM.div({className: "mid text-center"}, 
          React.DOM.p({className: "lead"}, "Form"), 
          React.DOM.hr(null), 
          field.Input({
            class: "form-control "+$.class, 
            style: {width: $.width}, 
            change: this.handleValue, 
            value: $.value})
        )
      )
    );
  },
  handleValue: function(e) {
    this.setState({value: e.target.value});
  },
  handleWidth: function(e) {
    this.setState({width: e.target.value});
  }

});

module.exports = Main;