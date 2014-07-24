/**
 * @jsx React.DOM
 */
/* global window, document */
var React = require('react');

var Main = require('./main');
window.View = React.renderComponent(
  <Main />,
  document.getElementById('view')
);

window.React = React;