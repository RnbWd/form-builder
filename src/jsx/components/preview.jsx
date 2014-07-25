/**
 * @jsx React.DOM
 */

var React = require('react');

var Preview = React.createClass({

  render: function() {
    var _ = this.props;
    var forms = _.forms.map(function(form, key) {
      if(form.type === 'checkbox') {
        return (
        <div key={key} className={'item item-checkbox text-center'}>
          <label className={form.type}> 
            <input type={form.type}  />
          </label>
           <span style={{marginLeft: '-20%'}}>{form.label}</span>
        </div>
        );
      } else {
        return (
            <label key={key} className='item item-input'> 
              <span className="input-label">{form.label}</span>
              <input type={form.type} placeholder={form.label} />
            </label>
          );
      }
      
    });
    return (
      <div className="tablet content" style={{width: _.width, height: _.height}}>
        <div className={"bar bar-header "+_.color}><h1 className="title">{_.title}</h1></div>
          <div className="list list-inset" style={{marginTop: 40}}>
            {forms}
        </div>
      </div>
    );
  }

});

module.exports = Preview;