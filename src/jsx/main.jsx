/**
 * @jsx React.DOM
 */

var React = require('react');
var field = require('./components');

var Main = React.createClass({
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
      <div className="field">
        <div className="mid text-center">
          <p className="lead">Modify</p>
          <hr/>
          Width: <field.Input class="" style={{width: 100}} value={$.width} change={this.handleWidth} />
        </div>
        <div className="mid text-center">
          <p className="lead">Form</p>
          <hr/>
          <field.Input 
            class={"form-control "+$.class} 
            style={{width: $.width}} 
            change={this.handleValue} 
            value={$.value} />
        </div>
      </div>
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