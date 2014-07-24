/**
 * @jsx React.DOM
 */

var React = require('react');

var FormGroup = React.createClass({displayName: 'FormGroup',

  render: function() {
    var _ = this.props;
    return (
      React.DOM.div({className: "form-group "+_.has}, 
        _.children
      )
    );
  }

});

module.exports = FormGroup;