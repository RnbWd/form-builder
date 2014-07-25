/**
 * @jsx React.DOM
 */

var React = require('react');
var Color = React.createClass({

  render: function() {
    var _ = this.props;
    return (
      <div className={"item item-toggle "+_.class+"-bg "+_.class}>
        {_.label}
        <label className={"toggle toggle-"+_.class}>
           {_.input}
           <div className="track">
             <div className="handle"/>
           </div>
        </label>
      </div>
      );
  }

});

module.exports = Color;