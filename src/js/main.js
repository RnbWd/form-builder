/**
 * @jsx React.DOM
 */

var React = require('react');
var field = require('./components');
var store = require('store2');

var Main = React.createClass({displayName: 'Main',
  getInitialState: function() {
    return {
      edit: '',
      colors: '',
      width: store('width') || 450,
      height: store('height') || 550,
      title: store('title') || 'Attendee Form',
      color: store('color') || 'light',
    };
  },
  render: function() {
    var $ = this.state;
    return (
      React.DOM.div(null, 
      field.Bar(null, 
        React.DOM.button({className: "button button-icon icon ion-navicon", onClick: this.toggleColors}), 
        React.DOM.div({className: "h1 title"}, "Form Builder"), 
        React.DOM.button({className: "button button-icon icon ion-ios7-settings", onClick: this.toggleEdit})
      ), 
      field.Row({class: $.edit ? "" : "hide"}, 
        field.Col(null, 
          field.Range({class: "range-calm", 
            left: "ion-ios7-arrow-thin-left", right: "ion-ios7-arrow-thin-right", 
            input: React.DOM.input({type: "range", name: "width", min: "300", max: "1200", value: $.width, onChange: this.handleWidth})}
          )
        ), 
        field.Col(null, 
          field.Range({class: "range-calm", 
              left: "ion-ios7-arrow-thin-down", right: "ion-ios7-arrow-thin-up", 
              input: React.DOM.input({type: "range", name: "height", min: "300", max: "1200", value: $.height, onChange: this.handleHeight})}
            )
        )
      ), 
      field.Row(null, 
        field.Col({class: $.colors ? '' : 'hide'}, 
          React.DOM.div({className: "list list-inset"}, 
            React.DOM.label({className: "item item-input"}, 
              React.DOM.span({className: "input-label"}, "Title"), 
              React.DOM.input({type: "text", placeholder: "Title", value: $.title, onChange: this.handleTitle})
            ), 
            field.Color({class: "light stable-bg", 
              input: React.DOM.input({type: "radio", name: "color", value: "light", onChange: this.handleColor}), 
              label: "Light"}
            ), 
            field.Color({class: "stable light-bg", 
              input: React.DOM.input({type: "radio", name: "color", value: "stable", onChange: this.handleColor}), 
              label: "Stable"}
            ), 
            field.Color({class: "positive", 
              input: React.DOM.input({type: "radio", name: "color", value: "positive", onChange: this.handleColor}), 
              label: "Positive"}
            ), 
            field.Color({class: "calm", 
              input: React.DOM.input({type: "radio", name: "color", value: "calm", onChange: this.handleColor}), 
              label: "Calm"}
            ), 
            field.Color({class: "balanced", 
              input: React.DOM.input({type: "radio", name: "color", value: "balanced", onChange: this.handleColor}), 
              label: "Balanced"}
            ), 
            field.Color({class: "energized", 
              input: React.DOM.input({type: "radio", name: "color", value: "energized", onChange: this.handleColor}), 
              label: "Energized"}
            ), 
            field.Color({class: "assertive", 
              input: React.DOM.input({type: "radio", name: "color", value: "assertive", onChange: this.handleColor}), 
              label: "Assertive"}
            ), 
            field.Color({class: "royal", 
              input: React.DOM.input({type: "radio", name: "color", value: "royal", onChange: this.handleColor}), 
              label: "Royal"}
            ), 
            field.Color({class: "dark", 
              input: React.DOM.input({type: "radio", name: "color", value: "dark", onChange: this.handleColor}), 
              label: "Dark"}
            )
              
          )
        ), 
        field.Col(null, 
          field.Preview({
          width: $.width, 
          height: $.height, 
          title: $.title, 
          color: 'bar-'+$.color}
          )
        )
      )
      )
    );
  },
  handleTitle: function(e) {
    this.setState({title: e.target.value});
    store('title', e.target.value);
  },
  toggleEdit: function(e) {
    var toggle = !this.state.edit;
    this.setState({edit: toggle});
  },
  toggleColors: function(e) {
    var toggle = !this.state.colors;
    this.setState({colors: toggle});
  },
  handleWidth: function(e) {
    this.setState({width: e.target.value});
    store('width', e.target.value);
  },
  handleHeight: function(e) {
    this.setState({height: e.target.value});
    store('height', e.target.value);
  },
  handleColor: function(e) {
    this.setState({color: e.target.value});
    store('color', e.target.value);
  }
  

});

module.exports = Main;