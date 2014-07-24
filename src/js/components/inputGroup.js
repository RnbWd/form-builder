/**
 * @jsx React.DOM
 */

var React = require('react');

var InputGroup = React.createClass({displayName: 'InputGroup',

  render: function() {
    var _ = this.props;
    var before =  React.DOM.div({className: "input-group-addon"}, React.DOM.i({className: "icon ion-"+_.before}));
    var after =  React.DOM.div({className: "input-group-addon"}, React.DOM.i({className: "fa fa-"+_.after}));
    return (
      React.DOM.div({className: "input-group ", style: _.style}, 
        _.before ? before : '', 
        _.children, 
        _.after ? after : ''
      )
    );
  }

});

module.exports = InputGroup;