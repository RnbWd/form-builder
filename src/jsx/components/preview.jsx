/**
 * @jsx React.DOM
 */

var React = require('react');

var Preview = React.createClass({

  render: function() {
    var _ = this.props;
    return (
      <div className="tablet content" style={{width: _.width, height: _.height}}>
        <div className={"bar bar-header "+_.color}><h1 className="title">{_.title}</h1></div>
          <div className="list list-inset" style={{marginTop: 40}}>
          <label className="item item-input"> 
            <span className="input-label">First Name</span>
            <input type="text" placeholder="First Name" />
          </label>
          <label className="item item-input"> 
            <span className="input-label">Last Name</span>
            <input type="text" placeholder="Last Name" />
          </label>
        </div>
      </div>
    );
  }

});

module.exports = Preview;