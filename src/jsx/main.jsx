/**
 * @jsx React.DOM
 */

var React = require('react');
var field = require('./components');
var store = require('store2');
var _colors = ['light', 'stable', 'positive', 'calm', 'balanced', 'energized', 'assertive', 'royal', 'dark'];
var Main = React.createClass({
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
        <button className={"button button-"+color} value={color} onClick={self.handleColor}>{color}</button>
      );
    });
    var changeTitle = (
      <field.Bar class="bar-header item-input-inset bar-stable">
          <label className="item item-input-wrapper">
             <span class="input-label" style={{marginLeft: '30%', marginRight: 40}}><i className="icon ion-edit"/> Form Title:</span>
            <input type="text" style={{textAlign: 'center', marginRight: 'auto', borderBottom: '2px dotted black', width: 200}} placeholder="Title" value={$.title} onChange={self.handleTitle}/>
          </label>
          <button className="button button-clear" onClick={self.toggleEdit}><i className="icon ion-android-mixer balanced rainbow"/></button>
        </field.Bar>
        );
    var origtitle = (
      <field.Bar class={"bar-header bar-stable"}>
        <div className="h1 title">Form Builder</div>
        <button className="button button-icon icon ion-ios7-settings" onClick={this.toggleEdit}/>
      </field.Bar>
    );
    var hwidth = (
      <field.Row>
        <field.Col>
          <field.Range class="range-calm rainbow"
              left="ion-ios7-arrow-thin-down" right="ion-ios7-arrow-thin-up"
              input= {<input type="range" name="height" min="250" max="1000" value={$.height} onChange={this.handleHeight} />}
            />
        </field.Col>
        <field.Col>
          <field.Range class="range-calm rainbow"
            left="ion-ios7-arrow-thin-left" right="ion-ios7-arrow-thin-right"
            input={<input type="range" name="width" min="300" max="1200" value={$.width} onChange={this.handleWidth} />}
          />
        </field.Col>
      </field.Row>
    );
    var formFields = $.forms.map(function(form, key) {
      return (
          <label className="item-input" style={{paddingLeft: 10}}>
            <i className="icon ion-wineglass"/>
            <input type="text" className="sample-input" 
            placeholder="Label" value={form.label} 
            onChange={self.handleForm.bind(null, key)} style={{paddingLeft: 20}}/>
          </label>
      );
    });
    return (
      <div className="has-header">
        {$.edit ? changeTitle : origtitle}
      <div className="button-bar" style={{marginTop: $.edit ? 0 : 44}}>
        {$.edit ? hwidth : colors}
      </div>
      
      <field.Row>
        <field.Col class={'col-33'}>
          <div className="list card">
            {formFields}
          </div>
          <div className="text-center">
          <button className="button button-outline icon-right ion-ios7-plus-outline button-balanced" onClick={this.addField} >Add Text Field</button>
          <button className="button button-outline icon-right ion-ios7-plus-outline button-positive" onClick={this.addCheckbox} >Add Check Box</button>
          <button className="button button-outline icon-right ion-sad button-assertive" onClick={this.remove} >Remove Last Item</button>
          </div>
        </field.Col>
        <field.Col>
          <field.Preview 
          width={$.width} 
          height={$.height}
          title={$.title}
          color={'bar-'+$.color}
          forms={$.forms}
          />
        </field.Col>
      </field.Row>
      </div>
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