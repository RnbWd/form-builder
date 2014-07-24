(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * @jsx React.DOM
 */
/* global window, document */
var React = require('react');

var Main = require('./main');
window.View = React.renderComponent(
  Main(null),
  document.getElementById('view')
);

window.React = React;
},{"./main":4,"react":"M6d2gk"}],2:[function(require,module,exports){
var index = {};

module.exports = index;

index.Input = require('./input');
},{"./input":3}],3:[function(require,module,exports){
/**
 * @jsx React.DOM
 */

var React = require('react');

var Input = React.createClass({displayName: 'Input',
  render: function() {
    var _ = this.props;
    return (
      React.DOM.input({type: "text", className: _.class, style: _.style, value: _.value, onChange: _.change})
    );
  }
});

module.exports = Input;
},{"react":"M6d2gk"}],4:[function(require,module,exports){
/**
 * @jsx React.DOM
 */

var React = require('react');
var field = require('./components');

var Main = React.createClass({displayName: 'Main',
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
      React.DOM.div({className: "field"}, 
        React.DOM.div({className: "mid text-center"}, 
          React.DOM.p({className: "lead"}, "Modify"), 
          React.DOM.hr(null), 
          "Width: ", field.Input({class: "", style: {width: 100}, value: $.width, change: this.handleWidth})
        ), 
        React.DOM.div({className: "mid text-center"}, 
          React.DOM.p({className: "lead"}, "Form"), 
          React.DOM.hr(null), 
          field.Input({
            class: "form-control "+$.class, 
            style: {width: $.width}, 
            change: this.handleValue, 
            value: $.value})
        )
      )
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
},{"./components":2,"react":"M6d2gk"}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9SYWluYm93L2Zvcm0tYnVpbGRlci9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL1JhaW5ib3cvZm9ybS1idWlsZGVyL3NyYy9qcy9hcHAuanMiLCIvVXNlcnMvUmFpbmJvdy9mb3JtLWJ1aWxkZXIvc3JjL2pzL2NvbXBvbmVudHMvaW5kZXguanMiLCIvVXNlcnMvUmFpbmJvdy9mb3JtLWJ1aWxkZXIvc3JjL2pzL2NvbXBvbmVudHMvaW5wdXQuanMiLCIvVXNlcnMvUmFpbmJvdy9mb3JtLWJ1aWxkZXIvc3JjL2pzL21haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICogQGpzeCBSZWFjdC5ET01cbiAqL1xuLyogZ2xvYmFsIHdpbmRvdywgZG9jdW1lbnQgKi9cbnZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5cbnZhciBNYWluID0gcmVxdWlyZSgnLi9tYWluJyk7XG53aW5kb3cuVmlldyA9IFJlYWN0LnJlbmRlckNvbXBvbmVudChcbiAgTWFpbihudWxsKSxcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3ZpZXcnKVxuKTtcblxud2luZG93LlJlYWN0ID0gUmVhY3Q7IiwidmFyIGluZGV4ID0ge307XG5cbm1vZHVsZS5leHBvcnRzID0gaW5kZXg7XG5cbmluZGV4LklucHV0ID0gcmVxdWlyZSgnLi9pbnB1dCcpOyIsIi8qKlxuICogQGpzeCBSZWFjdC5ET01cbiAqL1xuXG52YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuXG52YXIgSW5wdXQgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdJbnB1dCcsXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgdmFyIF8gPSB0aGlzLnByb3BzO1xuICAgIHJldHVybiAoXG4gICAgICBSZWFjdC5ET00uaW5wdXQoe3R5cGU6IFwidGV4dFwiLCBjbGFzc05hbWU6IF8uY2xhc3MsIHN0eWxlOiBfLnN0eWxlLCB2YWx1ZTogXy52YWx1ZSwgb25DaGFuZ2U6IF8uY2hhbmdlfSlcbiAgICApO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBJbnB1dDsiLCIvKipcbiAqIEBqc3ggUmVhY3QuRE9NXG4gKi9cblxudmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcbnZhciBmaWVsZCA9IHJlcXVpcmUoJy4vY29tcG9uZW50cycpO1xuXG52YXIgTWFpbiA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ01haW4nLFxuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICB2YWx1ZTogJ2hlbGxvJyxcbiAgICAgIGNsYXNzOiAnJyxcbiAgICAgIHdpZHRoOiA0MDAgXG4gICAgfTtcbiAgfSxcbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgJCA9IHRoaXMuc3RhdGU7XG4gICAgcmV0dXJuIChcbiAgICAgIFJlYWN0LkRPTS5kaXYoe2NsYXNzTmFtZTogXCJmaWVsZFwifSwgXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoe2NsYXNzTmFtZTogXCJtaWQgdGV4dC1jZW50ZXJcIn0sIFxuICAgICAgICAgIFJlYWN0LkRPTS5wKHtjbGFzc05hbWU6IFwibGVhZFwifSwgXCJNb2RpZnlcIiksIFxuICAgICAgICAgIFJlYWN0LkRPTS5ocihudWxsKSwgXG4gICAgICAgICAgXCJXaWR0aDogXCIsIGZpZWxkLklucHV0KHtjbGFzczogXCJcIiwgc3R5bGU6IHt3aWR0aDogMTAwfSwgdmFsdWU6ICQud2lkdGgsIGNoYW5nZTogdGhpcy5oYW5kbGVXaWR0aH0pXG4gICAgICAgICksIFxuICAgICAgICBSZWFjdC5ET00uZGl2KHtjbGFzc05hbWU6IFwibWlkIHRleHQtY2VudGVyXCJ9LCBcbiAgICAgICAgICBSZWFjdC5ET00ucCh7Y2xhc3NOYW1lOiBcImxlYWRcIn0sIFwiRm9ybVwiKSwgXG4gICAgICAgICAgUmVhY3QuRE9NLmhyKG51bGwpLCBcbiAgICAgICAgICBmaWVsZC5JbnB1dCh7XG4gICAgICAgICAgICBjbGFzczogXCJmb3JtLWNvbnRyb2wgXCIrJC5jbGFzcywgXG4gICAgICAgICAgICBzdHlsZToge3dpZHRoOiAkLndpZHRofSwgXG4gICAgICAgICAgICBjaGFuZ2U6IHRoaXMuaGFuZGxlVmFsdWUsIFxuICAgICAgICAgICAgdmFsdWU6ICQudmFsdWV9KVxuICAgICAgICApXG4gICAgICApXG4gICAgKTtcbiAgfSxcbiAgaGFuZGxlVmFsdWU6IGZ1bmN0aW9uKGUpIHtcbiAgICB0aGlzLnNldFN0YXRlKHt2YWx1ZTogZS50YXJnZXQudmFsdWV9KTtcbiAgfSxcbiAgaGFuZGxlV2lkdGg6IGZ1bmN0aW9uKGUpIHtcbiAgICB0aGlzLnNldFN0YXRlKHt3aWR0aDogZS50YXJnZXQudmFsdWV9KTtcbiAgfVxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBNYWluOyJdfQ==
