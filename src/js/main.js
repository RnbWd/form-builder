/**
 * @jsx React.DOM
 */

var React = require('react');
var field = require('./components');
var store = require('store2');
var _colors = ['light', 'stable', 'positive', 'calm', 'balanced', 'energized', 'assertive', 'royal', 'dark'];
var Main = React.createClass({displayName: 'Main',
  getInitialState: function() {
    return {
      edit: store('edit') || '',
      width: store('width') || 450,
      height: store('height') || 550,
      title: store('title') || 'Attendee Form',
      color: store('color') || 'light',
      forms: store('forms') || [{"type":"text","title":"First Name","label":"First Name"},{"type":"text","title":"Last Name","label":"Last Name"},{"type":"checkbox","label":"Checked in?"}] 
    };
  },
  render: function() {
    var $ = this.state;
    console.log(JSON.stringify($.forms));
    var self = this;
    var colors = _colors.map(function(color) {
      return (
        React.DOM.button({className: "button button-"+color, value: color, onClick: self.handleColor}, color)
      );
    });
    var changeTitle = (
      field.Bar({class: "bar-header item-input-inset bar-stable"}, 
          React.DOM.label({className: "item item-input-wrapper"}, 
             React.DOM.span({class: "input-label", style: {marginLeft: '30%', marginRight: 40}}, React.DOM.i({className: "icon ion-edit"}), " Form Title:"), 
            React.DOM.input({type: "text", style: {textAlign: 'center', marginRight: 'auto', borderBottom: '2px dotted black', width: 200}, placeholder: "Title", value: $.title, onChange: self.handleTitle})
          ), 
          React.DOM.button({className: "button button-clear", onClick: self.toggleEdit}, React.DOM.i({className: "icon ion-android-mixer balanced rainbow"}))
        )
        );
    var origtitle = (
      field.Bar({class: "bar-header bar-stable"}, 
        React.DOM.div({className: "h1 title"}, "Form Builder"), 
        React.DOM.button({className: "button button-icon icon ion-ios7-settings", onClick: this.toggleEdit})
      )
    );
    var hwidth = (
      field.Row(null, 
        field.Col(null, 
          field.Range({class: "range-calm rainbow", 
              left: "ion-ios7-arrow-thin-down", right: "ion-ios7-arrow-thin-up", 
              input: React.DOM.input({type: "range", name: "height", min: "250", max: "1000", value: $.height, onChange: this.handleHeight})}
            )
        ), 
        field.Col(null, 
          field.Range({class: "range-calm rainbow", 
            left: "ion-ios7-arrow-thin-left", right: "ion-ios7-arrow-thin-right", 
            input: React.DOM.input({type: "range", name: "width", min: "300", max: "1200", value: $.width, onChange: this.handleWidth})}
          )
        )
      )
    );
    var formFields = $.forms.map(function(form, key) {
      return (
          React.DOM.label({className: "item-input", style: {paddingLeft: 10}}, 
            React.DOM.i({className: "icon ion-wineglass"}), 
            React.DOM.input({type: "text", className: "sample-input", 
            placeholder: "Label", value: form.label, 
            onChange: self.handleForm.bind(null, key), style: {paddingLeft: 20}})
          )
      );
    });
    return (
      React.DOM.div({className: "has-header"}, 
        $.edit ? changeTitle : origtitle, 
      React.DOM.div({className: "button-bar", style: {marginTop: $.edit ? 0 : 44}}, 
        $.edit ? hwidth : colors
      ), 
      
      field.Row(null, 
        field.Col({class: 'col-33'}, 
          React.DOM.div({className: "list card"}, 
            formFields
          ), 
          React.DOM.div({className: "text-center"}, 
          React.DOM.button({className: "button button-outline icon-right ion-ios7-plus-outline button-balanced", onClick: this.addField}, "Add Text Field"), 
          React.DOM.button({className: "button button-outline icon-right ion-ios7-plus-outline button-positive", onClick: this.addCheckbox}, "Add Check Box"), 
          React.DOM.button({className: "button button-outline icon-right ion-sad button-assertive", onClick: this.remove}, "Remove Last Item")
          )
        ), 
        field.Col(null, 
          field.Preview({
          width: $.width, 
          height: $.height, 
          title: $.title, 
          color: 'bar-'+$.color, 
          forms: $.forms}
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
    store('edit', toggle);
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
  },
  handleForm: function(key, e) {
    var newForms = this.state.forms;
    newForms[key].label = e.target.value;
    this.setState({forms: newForms});
    store('forms', newForms);
  },
  addField: function(e) {
    var newForms = this.state.forms;
    newForms.push({type: 'text', label: ''});
    this.setState({forms: newForms});
    store('forms', newForms);
  },
  addCheckbox: function(e) {
    var newForms = this.state.forms;
    newForms.push({type: 'checkbox', label: ''});
    this.setState({forms: newForms});
    store('forms', newForms);
  },
  remove: function() {
    var newForms = this.state.forms;
    newForms.pop();
    this.setState({forms: newForms});
    store('forms', newForms);
  }
  

});

module.exports = Main;