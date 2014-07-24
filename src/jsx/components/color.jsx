/**
 * @jsx React.DOM
 */

var React = require('react');

var Color = React.createClass({

  render: function() {
    var _ = this.props;
    return (
      <label className={"item item-radio"}>
        {_.input}
        <div className={"item-content item-icon-left text-center"}>
          <i className={'icon ion-ios7-pricetags '+_.class}/> 
          {_.label}
        </div>
        <i className="radio-icon ion-checkmark"/>
      </label>
    );
  }

});

module.exports = Color;