(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*! store2 - v2.1.6 - 2014-03-10
* Copyright (c) 2014 Nathan Bubna; Licensed MIT, GPL */
;(function(window, define) {
    var _ = {
        version: "2.1.6",
        areas: {},
        apis: {},

        // utilities
        inherit: function(api, o) {
            for (var p in api) {
                if (!o.hasOwnProperty(p)) {
                    o[p] = api[p];
                }
            }
            return o;
        },
        stringify: function(d) {
            return d === undefined || typeof d === "function" ? d+'' : JSON.stringify(d);
        },
        parse: function(s) {
            // if it doesn't parse, return as is
            try{ return JSON.parse(s); }catch(e){ return s; }
        },

        // extension hooks
        fn: function(name, fn) {
            _.storeAPI[name] = fn;
            for (var api in _.apis) {
                _.apis[api][name] = fn;
            }
        },
        get: function(area, key){ return area.getItem(key); },
        set: function(area, key, string){ area.setItem(key, string); },
        remove: function(area, key){ area.removeItem(key); },
        key: function(area, i){ return area.key(i); },
        length: function(area){ return area.length; },
        clear: function(area){ area.clear(); },

        // core functions
        Store: function(id, area, namespace) {
            var store = _.inherit(_.storeAPI, function(key, data, overwrite) {
                if (arguments.length === 0){ return store.getAll(); }
                if (data !== undefined){ return store.set(key, data, overwrite); }
                if (typeof key === "string"){ return store.get(key); }
                if (!key){ return store.clear(); }
                return store.setAll(key, data);// overwrite=data, data=key
            });
            store._id = id;
            store._area = area || _.inherit(_.storageAPI, { items: {}, name: 'fake' });
            store._ns = namespace || '';
            if (!_.areas[id]) {
                _.areas[id] = store._area;
            }
            if (!_.apis[store._ns+store._id]) {
                _.apis[store._ns+store._id] = store;
            }
            return store;
        },
        storeAPI: {
            // admin functions
            area: function(id, area) {
                var store = this[id];
                if (!store || !store.area) {
                    store = _.Store(id, area, this._ns);//new area-specific api in this namespace
                    if (!this[id]){ this[id] = store; }
                }
                return store;
            },
            namespace: function(namespace, noSession) {
                if (!namespace){
                    return this._ns ? this._ns.substring(0,this._ns.length-1) : '';
                }
                var ns = namespace, store = this[ns];
                if (!store || !store.namespace) {
                    store = _.Store(this._id, this._area, this._ns+ns+'.');//new namespaced api
                    if (!this[ns]){ this[ns] = store; }
                    if (!noSession){ store.area('session', _.areas.session); }
                }
                return store;
            },
            isFake: function(){ return this._area.name === 'fake'; },
            toString: function() {
                return 'store'+(this._ns?'.'+this.namespace():'')+'['+this._id+']';
            },

            // storage functions
            has: function(key) {
                if (this._area.has) {
                    return this._area.has(this._in(key));//extension hook
                }
                return !!(this._in(key) in this._area);
            },
            size: function(){ return this.keys().length; },
            each: function(fn, and) {
                for (var i=0, m=_.length(this._area); i<m; i++) {
                    var key = this._out(_.key(this._area, i));
                    if (key !== undefined) {
                        if (fn.call(this, key, and || this.get(key)) === false) {
                            break;
                        }
                    }
                    if (m > _.length(this._area)) { m--; i--; }// in case of removeItem
                }
                return and || this;
            },
            keys: function() {
                return this.each(function(k, list){ list.push(k); }, []);
            },
            get: function(key, alt) {
                var s = _.get(this._area, this._in(key));
                return s !== null ? _.parse(s) : alt || s;// support alt for easy default mgmt
            },
            getAll: function() {
                return this.each(function(k, all){ all[k] = this.get(k); }, {});
            },
            set: function(key, data, overwrite) {
                var d = this.get(key);
                if (d != null && overwrite === false) {
                    return data;
                }
                return _.set(this._area, this._in(key), _.stringify(data), overwrite) || d;
            },
            setAll: function(data, overwrite) {
                var changed, val;
                for (var key in data) {
                    val = data[key];
                    if (this.set(key, val, overwrite) !== val) {
                        changed = true;
                    }
                }
                return changed;
            },
            remove: function(key) {
                var d = this.get(key);
                _.remove(this._area, this._in(key));
                return d;
            },
            clear: function() {
                if (!this._ns) {
                    _.clear(this._area);
                } else {
                    this.each(function(k){ _.remove(this._area, this._in(k)); }, 1);
                }
                return this;
            },
            clearAll: function() {
                var area = this._area;
                for (var id in _.areas) {
                    if (_.areas.hasOwnProperty(id)) {
                        this._area = _.areas[id];
                        this.clear();
                    }
                }
                this._area = area;
                return this;
            },

            // internal use functions
            _in: function(k) {
                if (typeof k !== "string"){ k = _.stringify(k); }
                return this._ns ? this._ns + k : k;
            },
            _out: function(k) {
                return this._ns ?
                    k && k.indexOf(this._ns) === 0 ?
                        k.substring(this._ns.length) :
                        undefined : // so each() knows to skip it
                    k;
            }
        },// end _.storeAPI
        storageAPI: {
            length: 0,
            has: function(k){ return this.items.hasOwnProperty(k); },
            key: function(i) {
                var c = 0;
                for (var k in this.items){
                    if (this.has(k) && i === c++) {
                        return k;
                    }
                }
            },
            setItem: function(k, v) {
                if (!this.has(k)) {
                    this.length++;
                }
                this.items[k] = v;
            },
            removeItem: function(k) {
                if (this.has(k)) {
                    delete this.items[k];
                    this.length--;
                }
            },
            getItem: function(k){ return this.has(k) ? this.items[k] : null; },
            clear: function(){ for (var k in this.list){ this.removeItem(k); } },
            toString: function(){ return this.length+' items in '+this.name+'Storage'; }
        }// end _.storageAPI
    };

    // setup the primary store fn
    if (window.store){ _.conflict = window.store; }
    var store =
        // safely set this up (throws error in IE10/32bit mode for local files)
        _.Store("local", (function(){try{ return localStorage; }catch(e){}})());
    store.local = store;// for completeness
    store._ = _;// for extenders and debuggers...
    // safely setup store.session (throws exception in FF for file:/// urls)
    store.area("session", (function(){try{ return sessionStorage; }catch(e){}})());

    if (typeof define === 'function' && define.amd !== undefined) {
        define(function () {
            return store;
        });
    } else if (typeof module !== 'undefined' && module.exports) {
        module.exports = store;
    } else {
        window.store = store;
    }

})(window, window.define);

},{}],2:[function(require,module,exports){
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
},{"./main":10,"react":"M6d2gk"}],3:[function(require,module,exports){
/**
 * @jsx React.DOM
 */

var React = require('react');

var Header = React.createClass({displayName: 'Header',
  getDefaultProps: function() {
    return {
      class: 'bar-header bar-stable'
    };
  },
  render: function() {
    var _ = this.props;
    return (
      React.DOM.div({className: "bar "+_.class}, 
        _.children
      )
    );
  }

});

module.exports = Header;
},{"react":"M6d2gk"}],4:[function(require,module,exports){
/**
 * @jsx React.DOM
 */

var React = require('react');

var Col = React.createClass({displayName: 'Col',

  render: function() {
    var _ = this.props;
    return (
      React.DOM.div({className: "col "+_.class}, 
        _.children
      )
    );
  }

});

module.exports = Col;
},{"react":"M6d2gk"}],5:[function(require,module,exports){
/**
 * @jsx React.DOM
 */

var React = require('react');

var Color = React.createClass({displayName: 'Color',

  render: function() {
    var _ = this.props;
    return (
      React.DOM.label({className: "item item-radio"}, 
        _.input, 
        React.DOM.div({className: "item-content item-icon-left text-center"}, 
          React.DOM.i({className: 'icon ion-ios7-pricetags '+_.class}), 
          _.label
        ), 
        React.DOM.i({className: "radio-icon ion-checkmark"})
      )
    );
  }

});

module.exports = Color;
},{"react":"M6d2gk"}],6:[function(require,module,exports){
var index = {};

module.exports = index;

index.Bar = require('./bar');
index.Row = require('./row');
index.Col = require('./col');
index.Range = require('./range');
index.Preview = require('./preview');
index.Color = require('./color');
//index.Input = require('./input');
//index.FormGroup = require('./formGroup');
//index.InputGroup = require('./inputGroup');
},{"./bar":3,"./col":4,"./color":5,"./preview":7,"./range":8,"./row":9}],7:[function(require,module,exports){
/**
 * @jsx React.DOM
 */

var React = require('react');

var Preview = React.createClass({displayName: 'Preview',

  render: function() {
    var _ = this.props;
    return (
      React.DOM.div({className: "tablet content", style: {width: _.width, height: _.height}}, 
        React.DOM.div({className: "bar bar-header "+_.color}, React.DOM.h1({className: "title"}, _.title)), 
          React.DOM.div({className: "list list-inset", style: {marginTop: 40}}, 
          React.DOM.label({className: "item item-input"}, 
            React.DOM.span({className: "input-label"}, "First Name"), 
            React.DOM.input({type: "text", placeholder: "First Name"})
          ), 
          React.DOM.label({className: "item item-input"}, 
            React.DOM.span({className: "input-label"}, "Last Name"), 
            React.DOM.input({type: "text", placeholder: "Last Name"})
          )
        )
      )
    );
  }

});

module.exports = Preview;
},{"react":"M6d2gk"}],8:[function(require,module,exports){
/**
 * @jsx React.DOM
 */

var React = require('react');

var Range = React.createClass({displayName: 'Range',
  getDefaultProps: function() {
    return {
      input: React.DOM.input({type: "range", name: "volume", min: "0", max: "100"})
    };
  },
  render: function() {
    var _ = this.props;
    var left = React.DOM.i({className: "icon "+_.left});
    var right = React.DOM.i({className: "icon "+_.right});
    return (
      React.DOM.div({className: "item range "+_.class}, 
        _.left ? left : '', 
        _.input, 
        _.right ? right : ''
      )
    );
  }

});

module.exports = Range;
},{"react":"M6d2gk"}],9:[function(require,module,exports){
/**
 * @jsx React.DOM
 */

var React = require('react');

var Row = React.createClass({displayName: 'Row',

  render: function() {
    var _ = this.props;
    return (
      React.DOM.div({className: "row "+_.class}, 
        _.children
      )
    );
  }

});

module.exports = Row;
},{"react":"M6d2gk"}],10:[function(require,module,exports){
/**
 * @jsx React.DOM
 */

var React = require('react');
var field = require('./components');
var store = require('store2');

var Main = React.createClass({displayName: 'Main',
  getInitialState: function() {
    return {
      edit: '',
      colors: '',
      width: store('width') || 450,
      height: store('height') || 550,
      title: store('title') || 'Attendee Form',
      color: store('color') || 'light',
    };
  },
  render: function() {
    var $ = this.state;
    return (
      React.DOM.div(null, 
      field.Bar(null, 
        React.DOM.button({className: "button button-icon icon ion-navicon", onClick: this.toggleColors}), 
        React.DOM.div({className: "h1 title"}, "Form Builder"), 
        React.DOM.button({className: "button button-icon icon ion-ios7-settings", onClick: this.toggleEdit})
      ), 
      field.Row({class: $.edit ? "" : "hide"}, 
        field.Col(null, 
          field.Range({class: "range-calm", 
            left: "ion-ios7-arrow-thin-left", right: "ion-ios7-arrow-thin-right", 
            input: React.DOM.input({type: "range", name: "width", min: "300", max: "1200", value: $.width, onChange: this.handleWidth})}
          )
        ), 
        field.Col(null, 
          field.Range({class: "range-calm", 
              left: "ion-ios7-arrow-thin-down", right: "ion-ios7-arrow-thin-up", 
              input: React.DOM.input({type: "range", name: "height", min: "300", max: "1200", value: $.height, onChange: this.handleHeight})}
            )
        )
      ), 
      field.Row(null, 
        field.Col({class: $.colors ? '' : 'hide'}, 
          React.DOM.div({className: "list list-inset"}, 
            React.DOM.label({className: "item item-input"}, 
              React.DOM.span({className: "input-label"}, "Title"), 
              React.DOM.input({type: "text", placeholder: "Title", value: $.title, onChange: this.handleTitle})
            ), 
            field.Color({class: "light stable-bg", 
              input: React.DOM.input({type: "radio", name: "color", value: "light", onChange: this.handleColor}), 
              label: "Light"}
            ), 
            field.Color({class: "stable light-bg", 
              input: React.DOM.input({type: "radio", name: "color", value: "stable", onChange: this.handleColor}), 
              label: "Stable"}
            ), 
            field.Color({class: "positive", 
              input: React.DOM.input({type: "radio", name: "color", value: "positive", onChange: this.handleColor}), 
              label: "Positive"}
            ), 
            field.Color({class: "calm", 
              input: React.DOM.input({type: "radio", name: "color", value: "calm", onChange: this.handleColor}), 
              label: "Calm"}
            ), 
            field.Color({class: "balanced", 
              input: React.DOM.input({type: "radio", name: "color", value: "balanced", onChange: this.handleColor}), 
              label: "Balanced"}
            ), 
            field.Color({class: "energized", 
              input: React.DOM.input({type: "radio", name: "color", value: "energized", onChange: this.handleColor}), 
              label: "Energized"}
            ), 
            field.Color({class: "assertive", 
              input: React.DOM.input({type: "radio", name: "color", value: "assertive", onChange: this.handleColor}), 
              label: "Assertive"}
            ), 
            field.Color({class: "royal", 
              input: React.DOM.input({type: "radio", name: "color", value: "royal", onChange: this.handleColor}), 
              label: "Royal"}
            ), 
            field.Color({class: "dark", 
              input: React.DOM.input({type: "radio", name: "color", value: "dark", onChange: this.handleColor}), 
              label: "Dark"}
            )
              
          )
        ), 
        field.Col(null, 
          field.Preview({
          width: $.width, 
          height: $.height, 
          title: $.title, 
          color: 'bar-'+$.color}
          )
        )
      )
      )
    );
  },
  handleTitle: function(e) {
    this.setState({title: e.target.value});
    store('title', e.target.value);
  },
  toggleEdit: function(e) {
    var toggle = !this.state.edit;
    this.setState({edit: toggle});
  },
  toggleColors: function(e) {
    var toggle = !this.state.colors;
    this.setState({colors: toggle});
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
  }
  

});

module.exports = Main;
},{"./components":6,"react":"M6d2gk","store2":1}]},{},[2])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9SYWluYm93L2Zvcm0tYnVpbGRlci9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL1JhaW5ib3cvZm9ybS1idWlsZGVyL25vZGVfbW9kdWxlcy9zdG9yZTIvZGlzdC9zdG9yZTIuanMiLCIvVXNlcnMvUmFpbmJvdy9mb3JtLWJ1aWxkZXIvc3JjL2pzL2FwcC5qcyIsIi9Vc2Vycy9SYWluYm93L2Zvcm0tYnVpbGRlci9zcmMvanMvY29tcG9uZW50cy9iYXIuanMiLCIvVXNlcnMvUmFpbmJvdy9mb3JtLWJ1aWxkZXIvc3JjL2pzL2NvbXBvbmVudHMvY29sLmpzIiwiL1VzZXJzL1JhaW5ib3cvZm9ybS1idWlsZGVyL3NyYy9qcy9jb21wb25lbnRzL2NvbG9yLmpzIiwiL1VzZXJzL1JhaW5ib3cvZm9ybS1idWlsZGVyL3NyYy9qcy9jb21wb25lbnRzL2luZGV4LmpzIiwiL1VzZXJzL1JhaW5ib3cvZm9ybS1idWlsZGVyL3NyYy9qcy9jb21wb25lbnRzL3ByZXZpZXcuanMiLCIvVXNlcnMvUmFpbmJvdy9mb3JtLWJ1aWxkZXIvc3JjL2pzL2NvbXBvbmVudHMvcmFuZ2UuanMiLCIvVXNlcnMvUmFpbmJvdy9mb3JtLWJ1aWxkZXIvc3JjL2pzL2NvbXBvbmVudHMvcm93LmpzIiwiL1VzZXJzL1JhaW5ib3cvZm9ybS1idWlsZGVyL3NyYy9qcy9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyohIHN0b3JlMiAtIHYyLjEuNiAtIDIwMTQtMDMtMTBcbiogQ29weXJpZ2h0IChjKSAyMDE0IE5hdGhhbiBCdWJuYTsgTGljZW5zZWQgTUlULCBHUEwgKi9cbjsoZnVuY3Rpb24od2luZG93LCBkZWZpbmUpIHtcbiAgICB2YXIgXyA9IHtcbiAgICAgICAgdmVyc2lvbjogXCIyLjEuNlwiLFxuICAgICAgICBhcmVhczoge30sXG4gICAgICAgIGFwaXM6IHt9LFxuXG4gICAgICAgIC8vIHV0aWxpdGllc1xuICAgICAgICBpbmhlcml0OiBmdW5jdGlvbihhcGksIG8pIHtcbiAgICAgICAgICAgIGZvciAodmFyIHAgaW4gYXBpKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFvLmhhc093blByb3BlcnR5KHApKSB7XG4gICAgICAgICAgICAgICAgICAgIG9bcF0gPSBhcGlbcF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG87XG4gICAgICAgIH0sXG4gICAgICAgIHN0cmluZ2lmeTogZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgcmV0dXJuIGQgPT09IHVuZGVmaW5lZCB8fCB0eXBlb2YgZCA9PT0gXCJmdW5jdGlvblwiID8gZCsnJyA6IEpTT04uc3RyaW5naWZ5KGQpO1xuICAgICAgICB9LFxuICAgICAgICBwYXJzZTogZnVuY3Rpb24ocykge1xuICAgICAgICAgICAgLy8gaWYgaXQgZG9lc24ndCBwYXJzZSwgcmV0dXJuIGFzIGlzXG4gICAgICAgICAgICB0cnl7IHJldHVybiBKU09OLnBhcnNlKHMpOyB9Y2F0Y2goZSl7IHJldHVybiBzOyB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8gZXh0ZW5zaW9uIGhvb2tzXG4gICAgICAgIGZuOiBmdW5jdGlvbihuYW1lLCBmbikge1xuICAgICAgICAgICAgXy5zdG9yZUFQSVtuYW1lXSA9IGZuO1xuICAgICAgICAgICAgZm9yICh2YXIgYXBpIGluIF8uYXBpcykge1xuICAgICAgICAgICAgICAgIF8uYXBpc1thcGldW25hbWVdID0gZm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGdldDogZnVuY3Rpb24oYXJlYSwga2V5KXsgcmV0dXJuIGFyZWEuZ2V0SXRlbShrZXkpOyB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKGFyZWEsIGtleSwgc3RyaW5nKXsgYXJlYS5zZXRJdGVtKGtleSwgc3RyaW5nKTsgfSxcbiAgICAgICAgcmVtb3ZlOiBmdW5jdGlvbihhcmVhLCBrZXkpeyBhcmVhLnJlbW92ZUl0ZW0oa2V5KTsgfSxcbiAgICAgICAga2V5OiBmdW5jdGlvbihhcmVhLCBpKXsgcmV0dXJuIGFyZWEua2V5KGkpOyB9LFxuICAgICAgICBsZW5ndGg6IGZ1bmN0aW9uKGFyZWEpeyByZXR1cm4gYXJlYS5sZW5ndGg7IH0sXG4gICAgICAgIGNsZWFyOiBmdW5jdGlvbihhcmVhKXsgYXJlYS5jbGVhcigpOyB9LFxuXG4gICAgICAgIC8vIGNvcmUgZnVuY3Rpb25zXG4gICAgICAgIFN0b3JlOiBmdW5jdGlvbihpZCwgYXJlYSwgbmFtZXNwYWNlKSB7XG4gICAgICAgICAgICB2YXIgc3RvcmUgPSBfLmluaGVyaXQoXy5zdG9yZUFQSSwgZnVuY3Rpb24oa2V5LCBkYXRhLCBvdmVyd3JpdGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCl7IHJldHVybiBzdG9yZS5nZXRBbGwoKTsgfVxuICAgICAgICAgICAgICAgIGlmIChkYXRhICE9PSB1bmRlZmluZWQpeyByZXR1cm4gc3RvcmUuc2V0KGtleSwgZGF0YSwgb3ZlcndyaXRlKTsgfVxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiKXsgcmV0dXJuIHN0b3JlLmdldChrZXkpOyB9XG4gICAgICAgICAgICAgICAgaWYgKCFrZXkpeyByZXR1cm4gc3RvcmUuY2xlYXIoKTsgfVxuICAgICAgICAgICAgICAgIHJldHVybiBzdG9yZS5zZXRBbGwoa2V5LCBkYXRhKTsvLyBvdmVyd3JpdGU9ZGF0YSwgZGF0YT1rZXlcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgc3RvcmUuX2lkID0gaWQ7XG4gICAgICAgICAgICBzdG9yZS5fYXJlYSA9IGFyZWEgfHwgXy5pbmhlcml0KF8uc3RvcmFnZUFQSSwgeyBpdGVtczoge30sIG5hbWU6ICdmYWtlJyB9KTtcbiAgICAgICAgICAgIHN0b3JlLl9ucyA9IG5hbWVzcGFjZSB8fCAnJztcbiAgICAgICAgICAgIGlmICghXy5hcmVhc1tpZF0pIHtcbiAgICAgICAgICAgICAgICBfLmFyZWFzW2lkXSA9IHN0b3JlLl9hcmVhO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFfLmFwaXNbc3RvcmUuX25zK3N0b3JlLl9pZF0pIHtcbiAgICAgICAgICAgICAgICBfLmFwaXNbc3RvcmUuX25zK3N0b3JlLl9pZF0gPSBzdG9yZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBzdG9yZTtcbiAgICAgICAgfSxcbiAgICAgICAgc3RvcmVBUEk6IHtcbiAgICAgICAgICAgIC8vIGFkbWluIGZ1bmN0aW9uc1xuICAgICAgICAgICAgYXJlYTogZnVuY3Rpb24oaWQsIGFyZWEpIHtcbiAgICAgICAgICAgICAgICB2YXIgc3RvcmUgPSB0aGlzW2lkXTtcbiAgICAgICAgICAgICAgICBpZiAoIXN0b3JlIHx8ICFzdG9yZS5hcmVhKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0b3JlID0gXy5TdG9yZShpZCwgYXJlYSwgdGhpcy5fbnMpOy8vbmV3IGFyZWEtc3BlY2lmaWMgYXBpIGluIHRoaXMgbmFtZXNwYWNlXG4gICAgICAgICAgICAgICAgICAgIGlmICghdGhpc1tpZF0peyB0aGlzW2lkXSA9IHN0b3JlOyB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBzdG9yZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBuYW1lc3BhY2U6IGZ1bmN0aW9uKG5hbWVzcGFjZSwgbm9TZXNzaW9uKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFuYW1lc3BhY2Upe1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fbnMgPyB0aGlzLl9ucy5zdWJzdHJpbmcoMCx0aGlzLl9ucy5sZW5ndGgtMSkgOiAnJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIG5zID0gbmFtZXNwYWNlLCBzdG9yZSA9IHRoaXNbbnNdO1xuICAgICAgICAgICAgICAgIGlmICghc3RvcmUgfHwgIXN0b3JlLm5hbWVzcGFjZSkge1xuICAgICAgICAgICAgICAgICAgICBzdG9yZSA9IF8uU3RvcmUodGhpcy5faWQsIHRoaXMuX2FyZWEsIHRoaXMuX25zK25zKycuJyk7Ly9uZXcgbmFtZXNwYWNlZCBhcGlcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzW25zXSl7IHRoaXNbbnNdID0gc3RvcmU7IH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFub1Nlc3Npb24peyBzdG9yZS5hcmVhKCdzZXNzaW9uJywgXy5hcmVhcy5zZXNzaW9uKTsgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gc3RvcmU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaXNGYWtlOiBmdW5jdGlvbigpeyByZXR1cm4gdGhpcy5fYXJlYS5uYW1lID09PSAnZmFrZSc7IH0sXG4gICAgICAgICAgICB0b1N0cmluZzogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICdzdG9yZScrKHRoaXMuX25zPycuJyt0aGlzLm5hbWVzcGFjZSgpOicnKSsnWycrdGhpcy5faWQrJ10nO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLy8gc3RvcmFnZSBmdW5jdGlvbnNcbiAgICAgICAgICAgIGhhczogZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2FyZWEuaGFzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9hcmVhLmhhcyh0aGlzLl9pbihrZXkpKTsvL2V4dGVuc2lvbiBob29rXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiAhISh0aGlzLl9pbihrZXkpIGluIHRoaXMuX2FyZWEpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNpemU6IGZ1bmN0aW9uKCl7IHJldHVybiB0aGlzLmtleXMoKS5sZW5ndGg7IH0sXG4gICAgICAgICAgICBlYWNoOiBmdW5jdGlvbihmbiwgYW5kKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaT0wLCBtPV8ubGVuZ3RoKHRoaXMuX2FyZWEpOyBpPG07IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIga2V5ID0gdGhpcy5fb3V0KF8ua2V5KHRoaXMuX2FyZWEsIGkpKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGtleSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZm4uY2FsbCh0aGlzLCBrZXksIGFuZCB8fCB0aGlzLmdldChrZXkpKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAobSA+IF8ubGVuZ3RoKHRoaXMuX2FyZWEpKSB7IG0tLTsgaS0tOyB9Ly8gaW4gY2FzZSBvZiByZW1vdmVJdGVtXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBhbmQgfHwgdGhpcztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBrZXlzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uKGssIGxpc3QpeyBsaXN0LnB1c2goayk7IH0sIFtdKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uKGtleSwgYWx0KSB7XG4gICAgICAgICAgICAgICAgdmFyIHMgPSBfLmdldCh0aGlzLl9hcmVhLCB0aGlzLl9pbihrZXkpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcyAhPT0gbnVsbCA/IF8ucGFyc2UocykgOiBhbHQgfHwgczsvLyBzdXBwb3J0IGFsdCBmb3IgZWFzeSBkZWZhdWx0IG1nbXRcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRBbGw6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmVhY2goZnVuY3Rpb24oaywgYWxsKXsgYWxsW2tdID0gdGhpcy5nZXQoayk7IH0sIHt9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzZXQ6IGZ1bmN0aW9uKGtleSwgZGF0YSwgb3ZlcndyaXRlKSB7XG4gICAgICAgICAgICAgICAgdmFyIGQgPSB0aGlzLmdldChrZXkpO1xuICAgICAgICAgICAgICAgIGlmIChkICE9IG51bGwgJiYgb3ZlcndyaXRlID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGF0YTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIF8uc2V0KHRoaXMuX2FyZWEsIHRoaXMuX2luKGtleSksIF8uc3RyaW5naWZ5KGRhdGEpLCBvdmVyd3JpdGUpIHx8IGQ7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2V0QWxsOiBmdW5jdGlvbihkYXRhLCBvdmVyd3JpdGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgY2hhbmdlZCwgdmFsO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbCA9IGRhdGFba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuc2V0KGtleSwgdmFsLCBvdmVyd3JpdGUpICE9PSB2YWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoYW5nZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBjaGFuZ2VkO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlbW92ZTogZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgICAgICAgICAgdmFyIGQgPSB0aGlzLmdldChrZXkpO1xuICAgICAgICAgICAgICAgIF8ucmVtb3ZlKHRoaXMuX2FyZWEsIHRoaXMuX2luKGtleSkpO1xuICAgICAgICAgICAgICAgIHJldHVybiBkO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNsZWFyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuX25zKSB7XG4gICAgICAgICAgICAgICAgICAgIF8uY2xlYXIodGhpcy5fYXJlYSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lYWNoKGZ1bmN0aW9uKGspeyBfLnJlbW92ZSh0aGlzLl9hcmVhLCB0aGlzLl9pbihrKSk7IH0sIDEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjbGVhckFsbDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIGFyZWEgPSB0aGlzLl9hcmVhO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGlkIGluIF8uYXJlYXMpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKF8uYXJlYXMuaGFzT3duUHJvcGVydHkoaWQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9hcmVhID0gXy5hcmVhc1tpZF07XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNsZWFyKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5fYXJlYSA9IGFyZWE7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvLyBpbnRlcm5hbCB1c2UgZnVuY3Rpb25zXG4gICAgICAgICAgICBfaW46IGZ1bmN0aW9uKGspIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGsgIT09IFwic3RyaW5nXCIpeyBrID0gXy5zdHJpbmdpZnkoayk7IH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fbnMgPyB0aGlzLl9ucyArIGsgOiBrO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF9vdXQ6IGZ1bmN0aW9uKGspIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fbnMgP1xuICAgICAgICAgICAgICAgICAgICBrICYmIGsuaW5kZXhPZih0aGlzLl9ucykgPT09IDAgP1xuICAgICAgICAgICAgICAgICAgICAgICAgay5zdWJzdHJpbmcodGhpcy5fbnMubGVuZ3RoKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICB1bmRlZmluZWQgOiAvLyBzbyBlYWNoKCkga25vd3MgdG8gc2tpcCBpdFxuICAgICAgICAgICAgICAgICAgICBrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LC8vIGVuZCBfLnN0b3JlQVBJXG4gICAgICAgIHN0b3JhZ2VBUEk6IHtcbiAgICAgICAgICAgIGxlbmd0aDogMCxcbiAgICAgICAgICAgIGhhczogZnVuY3Rpb24oayl7IHJldHVybiB0aGlzLml0ZW1zLmhhc093blByb3BlcnR5KGspOyB9LFxuICAgICAgICAgICAga2V5OiBmdW5jdGlvbihpKSB7XG4gICAgICAgICAgICAgICAgdmFyIGMgPSAwO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGsgaW4gdGhpcy5pdGVtcyl7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmhhcyhrKSAmJiBpID09PSBjKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNldEl0ZW06IGZ1bmN0aW9uKGssIHYpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuaGFzKGspKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubGVuZ3RoKys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuaXRlbXNba10gPSB2O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlbW92ZUl0ZW06IGZ1bmN0aW9uKGspIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5oYXMoaykpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMuaXRlbXNba107XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubGVuZ3RoLS07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldEl0ZW06IGZ1bmN0aW9uKGspeyByZXR1cm4gdGhpcy5oYXMoaykgPyB0aGlzLml0ZW1zW2tdIDogbnVsbDsgfSxcbiAgICAgICAgICAgIGNsZWFyOiBmdW5jdGlvbigpeyBmb3IgKHZhciBrIGluIHRoaXMubGlzdCl7IHRoaXMucmVtb3ZlSXRlbShrKTsgfSB9LFxuICAgICAgICAgICAgdG9TdHJpbmc6IGZ1bmN0aW9uKCl7IHJldHVybiB0aGlzLmxlbmd0aCsnIGl0ZW1zIGluICcrdGhpcy5uYW1lKydTdG9yYWdlJzsgfVxuICAgICAgICB9Ly8gZW5kIF8uc3RvcmFnZUFQSVxuICAgIH07XG5cbiAgICAvLyBzZXR1cCB0aGUgcHJpbWFyeSBzdG9yZSBmblxuICAgIGlmICh3aW5kb3cuc3RvcmUpeyBfLmNvbmZsaWN0ID0gd2luZG93LnN0b3JlOyB9XG4gICAgdmFyIHN0b3JlID1cbiAgICAgICAgLy8gc2FmZWx5IHNldCB0aGlzIHVwICh0aHJvd3MgZXJyb3IgaW4gSUUxMC8zMmJpdCBtb2RlIGZvciBsb2NhbCBmaWxlcylcbiAgICAgICAgXy5TdG9yZShcImxvY2FsXCIsIChmdW5jdGlvbigpe3RyeXsgcmV0dXJuIGxvY2FsU3RvcmFnZTsgfWNhdGNoKGUpe319KSgpKTtcbiAgICBzdG9yZS5sb2NhbCA9IHN0b3JlOy8vIGZvciBjb21wbGV0ZW5lc3NcbiAgICBzdG9yZS5fID0gXzsvLyBmb3IgZXh0ZW5kZXJzIGFuZCBkZWJ1Z2dlcnMuLi5cbiAgICAvLyBzYWZlbHkgc2V0dXAgc3RvcmUuc2Vzc2lvbiAodGhyb3dzIGV4Y2VwdGlvbiBpbiBGRiBmb3IgZmlsZTovLy8gdXJscylcbiAgICBzdG9yZS5hcmVhKFwic2Vzc2lvblwiLCAoZnVuY3Rpb24oKXt0cnl7IHJldHVybiBzZXNzaW9uU3RvcmFnZTsgfWNhdGNoKGUpe319KSgpKTtcblxuICAgIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBkZWZpbmUoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHN0b3JlO1xuICAgICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gc3RvcmU7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgd2luZG93LnN0b3JlID0gc3RvcmU7XG4gICAgfVxuXG59KSh3aW5kb3csIHdpbmRvdy5kZWZpbmUpO1xuIiwiLyoqXG4gKiBAanN4IFJlYWN0LkRPTVxuICovXG4vKiBnbG9iYWwgd2luZG93LCBkb2N1bWVudCAqL1xudmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcblxudmFyIE1haW4gPSByZXF1aXJlKCcuL21haW4nKTtcbndpbmRvdy5WaWV3ID0gUmVhY3QucmVuZGVyQ29tcG9uZW50KFxuICBNYWluKG51bGwpLFxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndmlldycpXG4pO1xuXG53aW5kb3cuUmVhY3QgPSBSZWFjdDsiLCIvKipcbiAqIEBqc3ggUmVhY3QuRE9NXG4gKi9cblxudmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcblxudmFyIEhlYWRlciA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0hlYWRlcicsXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNsYXNzOiAnYmFyLWhlYWRlciBiYXItc3RhYmxlJ1xuICAgIH07XG4gIH0sXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgdmFyIF8gPSB0aGlzLnByb3BzO1xuICAgIHJldHVybiAoXG4gICAgICBSZWFjdC5ET00uZGl2KHtjbGFzc05hbWU6IFwiYmFyIFwiK18uY2xhc3N9LCBcbiAgICAgICAgXy5jaGlsZHJlblxuICAgICAgKVxuICAgICk7XG4gIH1cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gSGVhZGVyOyIsIi8qKlxuICogQGpzeCBSZWFjdC5ET01cbiAqL1xuXG52YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuXG52YXIgQ29sID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnQ29sJyxcblxuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBfID0gdGhpcy5wcm9wcztcbiAgICByZXR1cm4gKFxuICAgICAgUmVhY3QuRE9NLmRpdih7Y2xhc3NOYW1lOiBcImNvbCBcIitfLmNsYXNzfSwgXG4gICAgICAgIF8uY2hpbGRyZW5cbiAgICAgIClcbiAgICApO1xuICB9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbDsiLCIvKipcbiAqIEBqc3ggUmVhY3QuRE9NXG4gKi9cblxudmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcblxudmFyIENvbG9yID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnQ29sb3InLFxuXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgdmFyIF8gPSB0aGlzLnByb3BzO1xuICAgIHJldHVybiAoXG4gICAgICBSZWFjdC5ET00ubGFiZWwoe2NsYXNzTmFtZTogXCJpdGVtIGl0ZW0tcmFkaW9cIn0sIFxuICAgICAgICBfLmlucHV0LCBcbiAgICAgICAgUmVhY3QuRE9NLmRpdih7Y2xhc3NOYW1lOiBcIml0ZW0tY29udGVudCBpdGVtLWljb24tbGVmdCB0ZXh0LWNlbnRlclwifSwgXG4gICAgICAgICAgUmVhY3QuRE9NLmkoe2NsYXNzTmFtZTogJ2ljb24gaW9uLWlvczctcHJpY2V0YWdzICcrXy5jbGFzc30pLCBcbiAgICAgICAgICBfLmxhYmVsXG4gICAgICAgICksIFxuICAgICAgICBSZWFjdC5ET00uaSh7Y2xhc3NOYW1lOiBcInJhZGlvLWljb24gaW9uLWNoZWNrbWFya1wifSlcbiAgICAgIClcbiAgICApO1xuICB9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbG9yOyIsInZhciBpbmRleCA9IHt9O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGluZGV4O1xuXG5pbmRleC5CYXIgPSByZXF1aXJlKCcuL2JhcicpO1xuaW5kZXguUm93ID0gcmVxdWlyZSgnLi9yb3cnKTtcbmluZGV4LkNvbCA9IHJlcXVpcmUoJy4vY29sJyk7XG5pbmRleC5SYW5nZSA9IHJlcXVpcmUoJy4vcmFuZ2UnKTtcbmluZGV4LlByZXZpZXcgPSByZXF1aXJlKCcuL3ByZXZpZXcnKTtcbmluZGV4LkNvbG9yID0gcmVxdWlyZSgnLi9jb2xvcicpO1xuLy9pbmRleC5JbnB1dCA9IHJlcXVpcmUoJy4vaW5wdXQnKTtcbi8vaW5kZXguRm9ybUdyb3VwID0gcmVxdWlyZSgnLi9mb3JtR3JvdXAnKTtcbi8vaW5kZXguSW5wdXRHcm91cCA9IHJlcXVpcmUoJy4vaW5wdXRHcm91cCcpOyIsIi8qKlxuICogQGpzeCBSZWFjdC5ET01cbiAqL1xuXG52YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuXG52YXIgUHJldmlldyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1ByZXZpZXcnLFxuXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgdmFyIF8gPSB0aGlzLnByb3BzO1xuICAgIHJldHVybiAoXG4gICAgICBSZWFjdC5ET00uZGl2KHtjbGFzc05hbWU6IFwidGFibGV0IGNvbnRlbnRcIiwgc3R5bGU6IHt3aWR0aDogXy53aWR0aCwgaGVpZ2h0OiBfLmhlaWdodH19LCBcbiAgICAgICAgUmVhY3QuRE9NLmRpdih7Y2xhc3NOYW1lOiBcImJhciBiYXItaGVhZGVyIFwiK18uY29sb3J9LCBSZWFjdC5ET00uaDEoe2NsYXNzTmFtZTogXCJ0aXRsZVwifSwgXy50aXRsZSkpLCBcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KHtjbGFzc05hbWU6IFwibGlzdCBsaXN0LWluc2V0XCIsIHN0eWxlOiB7bWFyZ2luVG9wOiA0MH19LCBcbiAgICAgICAgICBSZWFjdC5ET00ubGFiZWwoe2NsYXNzTmFtZTogXCJpdGVtIGl0ZW0taW5wdXRcIn0sIFxuICAgICAgICAgICAgUmVhY3QuRE9NLnNwYW4oe2NsYXNzTmFtZTogXCJpbnB1dC1sYWJlbFwifSwgXCJGaXJzdCBOYW1lXCIpLCBcbiAgICAgICAgICAgIFJlYWN0LkRPTS5pbnB1dCh7dHlwZTogXCJ0ZXh0XCIsIHBsYWNlaG9sZGVyOiBcIkZpcnN0IE5hbWVcIn0pXG4gICAgICAgICAgKSwgXG4gICAgICAgICAgUmVhY3QuRE9NLmxhYmVsKHtjbGFzc05hbWU6IFwiaXRlbSBpdGVtLWlucHV0XCJ9LCBcbiAgICAgICAgICAgIFJlYWN0LkRPTS5zcGFuKHtjbGFzc05hbWU6IFwiaW5wdXQtbGFiZWxcIn0sIFwiTGFzdCBOYW1lXCIpLCBcbiAgICAgICAgICAgIFJlYWN0LkRPTS5pbnB1dCh7dHlwZTogXCJ0ZXh0XCIsIHBsYWNlaG9sZGVyOiBcIkxhc3QgTmFtZVwifSlcbiAgICAgICAgICApXG4gICAgICAgIClcbiAgICAgIClcbiAgICApO1xuICB9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFByZXZpZXc7IiwiLyoqXG4gKiBAanN4IFJlYWN0LkRPTVxuICovXG5cbnZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5cbnZhciBSYW5nZSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1JhbmdlJyxcbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgaW5wdXQ6IFJlYWN0LkRPTS5pbnB1dCh7dHlwZTogXCJyYW5nZVwiLCBuYW1lOiBcInZvbHVtZVwiLCBtaW46IFwiMFwiLCBtYXg6IFwiMTAwXCJ9KVxuICAgIH07XG4gIH0sXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgdmFyIF8gPSB0aGlzLnByb3BzO1xuICAgIHZhciBsZWZ0ID0gUmVhY3QuRE9NLmkoe2NsYXNzTmFtZTogXCJpY29uIFwiK18ubGVmdH0pO1xuICAgIHZhciByaWdodCA9IFJlYWN0LkRPTS5pKHtjbGFzc05hbWU6IFwiaWNvbiBcIitfLnJpZ2h0fSk7XG4gICAgcmV0dXJuIChcbiAgICAgIFJlYWN0LkRPTS5kaXYoe2NsYXNzTmFtZTogXCJpdGVtIHJhbmdlIFwiK18uY2xhc3N9LCBcbiAgICAgICAgXy5sZWZ0ID8gbGVmdCA6ICcnLCBcbiAgICAgICAgXy5pbnB1dCwgXG4gICAgICAgIF8ucmlnaHQgPyByaWdodCA6ICcnXG4gICAgICApXG4gICAgKTtcbiAgfVxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBSYW5nZTsiLCIvKipcbiAqIEBqc3ggUmVhY3QuRE9NXG4gKi9cblxudmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcblxudmFyIFJvdyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1JvdycsXG5cbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgXyA9IHRoaXMucHJvcHM7XG4gICAgcmV0dXJuIChcbiAgICAgIFJlYWN0LkRPTS5kaXYoe2NsYXNzTmFtZTogXCJyb3cgXCIrXy5jbGFzc30sIFxuICAgICAgICBfLmNoaWxkcmVuXG4gICAgICApXG4gICAgKTtcbiAgfVxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBSb3c7IiwiLyoqXG4gKiBAanN4IFJlYWN0LkRPTVxuICovXG5cbnZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG52YXIgZmllbGQgPSByZXF1aXJlKCcuL2NvbXBvbmVudHMnKTtcbnZhciBzdG9yZSA9IHJlcXVpcmUoJ3N0b3JlMicpO1xuXG52YXIgTWFpbiA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ01haW4nLFxuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICBlZGl0OiAnJyxcbiAgICAgIGNvbG9yczogJycsXG4gICAgICB3aWR0aDogc3RvcmUoJ3dpZHRoJykgfHwgNDUwLFxuICAgICAgaGVpZ2h0OiBzdG9yZSgnaGVpZ2h0JykgfHwgNTUwLFxuICAgICAgdGl0bGU6IHN0b3JlKCd0aXRsZScpIHx8ICdBdHRlbmRlZSBGb3JtJyxcbiAgICAgIGNvbG9yOiBzdG9yZSgnY29sb3InKSB8fCAnbGlnaHQnLFxuICAgIH07XG4gIH0sXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgdmFyICQgPSB0aGlzLnN0YXRlO1xuICAgIHJldHVybiAoXG4gICAgICBSZWFjdC5ET00uZGl2KG51bGwsIFxuICAgICAgZmllbGQuQmFyKG51bGwsIFxuICAgICAgICBSZWFjdC5ET00uYnV0dG9uKHtjbGFzc05hbWU6IFwiYnV0dG9uIGJ1dHRvbi1pY29uIGljb24gaW9uLW5hdmljb25cIiwgb25DbGljazogdGhpcy50b2dnbGVDb2xvcnN9KSwgXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoe2NsYXNzTmFtZTogXCJoMSB0aXRsZVwifSwgXCJGb3JtIEJ1aWxkZXJcIiksIFxuICAgICAgICBSZWFjdC5ET00uYnV0dG9uKHtjbGFzc05hbWU6IFwiYnV0dG9uIGJ1dHRvbi1pY29uIGljb24gaW9uLWlvczctc2V0dGluZ3NcIiwgb25DbGljazogdGhpcy50b2dnbGVFZGl0fSlcbiAgICAgICksIFxuICAgICAgZmllbGQuUm93KHtjbGFzczogJC5lZGl0ID8gXCJcIiA6IFwiaGlkZVwifSwgXG4gICAgICAgIGZpZWxkLkNvbChudWxsLCBcbiAgICAgICAgICBmaWVsZC5SYW5nZSh7Y2xhc3M6IFwicmFuZ2UtY2FsbVwiLCBcbiAgICAgICAgICAgIGxlZnQ6IFwiaW9uLWlvczctYXJyb3ctdGhpbi1sZWZ0XCIsIHJpZ2h0OiBcImlvbi1pb3M3LWFycm93LXRoaW4tcmlnaHRcIiwgXG4gICAgICAgICAgICBpbnB1dDogUmVhY3QuRE9NLmlucHV0KHt0eXBlOiBcInJhbmdlXCIsIG5hbWU6IFwid2lkdGhcIiwgbWluOiBcIjMwMFwiLCBtYXg6IFwiMTIwMFwiLCB2YWx1ZTogJC53aWR0aCwgb25DaGFuZ2U6IHRoaXMuaGFuZGxlV2lkdGh9KX1cbiAgICAgICAgICApXG4gICAgICAgICksIFxuICAgICAgICBmaWVsZC5Db2wobnVsbCwgXG4gICAgICAgICAgZmllbGQuUmFuZ2Uoe2NsYXNzOiBcInJhbmdlLWNhbG1cIiwgXG4gICAgICAgICAgICAgIGxlZnQ6IFwiaW9uLWlvczctYXJyb3ctdGhpbi1kb3duXCIsIHJpZ2h0OiBcImlvbi1pb3M3LWFycm93LXRoaW4tdXBcIiwgXG4gICAgICAgICAgICAgIGlucHV0OiBSZWFjdC5ET00uaW5wdXQoe3R5cGU6IFwicmFuZ2VcIiwgbmFtZTogXCJoZWlnaHRcIiwgbWluOiBcIjMwMFwiLCBtYXg6IFwiMTIwMFwiLCB2YWx1ZTogJC5oZWlnaHQsIG9uQ2hhbmdlOiB0aGlzLmhhbmRsZUhlaWdodH0pfVxuICAgICAgICAgICAgKVxuICAgICAgICApXG4gICAgICApLCBcbiAgICAgIGZpZWxkLlJvdyhudWxsLCBcbiAgICAgICAgZmllbGQuQ29sKHtjbGFzczogJC5jb2xvcnMgPyAnJyA6ICdoaWRlJ30sIFxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYoe2NsYXNzTmFtZTogXCJsaXN0IGxpc3QtaW5zZXRcIn0sIFxuICAgICAgICAgICAgUmVhY3QuRE9NLmxhYmVsKHtjbGFzc05hbWU6IFwiaXRlbSBpdGVtLWlucHV0XCJ9LCBcbiAgICAgICAgICAgICAgUmVhY3QuRE9NLnNwYW4oe2NsYXNzTmFtZTogXCJpbnB1dC1sYWJlbFwifSwgXCJUaXRsZVwiKSwgXG4gICAgICAgICAgICAgIFJlYWN0LkRPTS5pbnB1dCh7dHlwZTogXCJ0ZXh0XCIsIHBsYWNlaG9sZGVyOiBcIlRpdGxlXCIsIHZhbHVlOiAkLnRpdGxlLCBvbkNoYW5nZTogdGhpcy5oYW5kbGVUaXRsZX0pXG4gICAgICAgICAgICApLCBcbiAgICAgICAgICAgIGZpZWxkLkNvbG9yKHtjbGFzczogXCJsaWdodCBzdGFibGUtYmdcIiwgXG4gICAgICAgICAgICAgIGlucHV0OiBSZWFjdC5ET00uaW5wdXQoe3R5cGU6IFwicmFkaW9cIiwgbmFtZTogXCJjb2xvclwiLCB2YWx1ZTogXCJsaWdodFwiLCBvbkNoYW5nZTogdGhpcy5oYW5kbGVDb2xvcn0pLCBcbiAgICAgICAgICAgICAgbGFiZWw6IFwiTGlnaHRcIn1cbiAgICAgICAgICAgICksIFxuICAgICAgICAgICAgZmllbGQuQ29sb3Ioe2NsYXNzOiBcInN0YWJsZSBsaWdodC1iZ1wiLCBcbiAgICAgICAgICAgICAgaW5wdXQ6IFJlYWN0LkRPTS5pbnB1dCh7dHlwZTogXCJyYWRpb1wiLCBuYW1lOiBcImNvbG9yXCIsIHZhbHVlOiBcInN0YWJsZVwiLCBvbkNoYW5nZTogdGhpcy5oYW5kbGVDb2xvcn0pLCBcbiAgICAgICAgICAgICAgbGFiZWw6IFwiU3RhYmxlXCJ9XG4gICAgICAgICAgICApLCBcbiAgICAgICAgICAgIGZpZWxkLkNvbG9yKHtjbGFzczogXCJwb3NpdGl2ZVwiLCBcbiAgICAgICAgICAgICAgaW5wdXQ6IFJlYWN0LkRPTS5pbnB1dCh7dHlwZTogXCJyYWRpb1wiLCBuYW1lOiBcImNvbG9yXCIsIHZhbHVlOiBcInBvc2l0aXZlXCIsIG9uQ2hhbmdlOiB0aGlzLmhhbmRsZUNvbG9yfSksIFxuICAgICAgICAgICAgICBsYWJlbDogXCJQb3NpdGl2ZVwifVxuICAgICAgICAgICAgKSwgXG4gICAgICAgICAgICBmaWVsZC5Db2xvcih7Y2xhc3M6IFwiY2FsbVwiLCBcbiAgICAgICAgICAgICAgaW5wdXQ6IFJlYWN0LkRPTS5pbnB1dCh7dHlwZTogXCJyYWRpb1wiLCBuYW1lOiBcImNvbG9yXCIsIHZhbHVlOiBcImNhbG1cIiwgb25DaGFuZ2U6IHRoaXMuaGFuZGxlQ29sb3J9KSwgXG4gICAgICAgICAgICAgIGxhYmVsOiBcIkNhbG1cIn1cbiAgICAgICAgICAgICksIFxuICAgICAgICAgICAgZmllbGQuQ29sb3Ioe2NsYXNzOiBcImJhbGFuY2VkXCIsIFxuICAgICAgICAgICAgICBpbnB1dDogUmVhY3QuRE9NLmlucHV0KHt0eXBlOiBcInJhZGlvXCIsIG5hbWU6IFwiY29sb3JcIiwgdmFsdWU6IFwiYmFsYW5jZWRcIiwgb25DaGFuZ2U6IHRoaXMuaGFuZGxlQ29sb3J9KSwgXG4gICAgICAgICAgICAgIGxhYmVsOiBcIkJhbGFuY2VkXCJ9XG4gICAgICAgICAgICApLCBcbiAgICAgICAgICAgIGZpZWxkLkNvbG9yKHtjbGFzczogXCJlbmVyZ2l6ZWRcIiwgXG4gICAgICAgICAgICAgIGlucHV0OiBSZWFjdC5ET00uaW5wdXQoe3R5cGU6IFwicmFkaW9cIiwgbmFtZTogXCJjb2xvclwiLCB2YWx1ZTogXCJlbmVyZ2l6ZWRcIiwgb25DaGFuZ2U6IHRoaXMuaGFuZGxlQ29sb3J9KSwgXG4gICAgICAgICAgICAgIGxhYmVsOiBcIkVuZXJnaXplZFwifVxuICAgICAgICAgICAgKSwgXG4gICAgICAgICAgICBmaWVsZC5Db2xvcih7Y2xhc3M6IFwiYXNzZXJ0aXZlXCIsIFxuICAgICAgICAgICAgICBpbnB1dDogUmVhY3QuRE9NLmlucHV0KHt0eXBlOiBcInJhZGlvXCIsIG5hbWU6IFwiY29sb3JcIiwgdmFsdWU6IFwiYXNzZXJ0aXZlXCIsIG9uQ2hhbmdlOiB0aGlzLmhhbmRsZUNvbG9yfSksIFxuICAgICAgICAgICAgICBsYWJlbDogXCJBc3NlcnRpdmVcIn1cbiAgICAgICAgICAgICksIFxuICAgICAgICAgICAgZmllbGQuQ29sb3Ioe2NsYXNzOiBcInJveWFsXCIsIFxuICAgICAgICAgICAgICBpbnB1dDogUmVhY3QuRE9NLmlucHV0KHt0eXBlOiBcInJhZGlvXCIsIG5hbWU6IFwiY29sb3JcIiwgdmFsdWU6IFwicm95YWxcIiwgb25DaGFuZ2U6IHRoaXMuaGFuZGxlQ29sb3J9KSwgXG4gICAgICAgICAgICAgIGxhYmVsOiBcIlJveWFsXCJ9XG4gICAgICAgICAgICApLCBcbiAgICAgICAgICAgIGZpZWxkLkNvbG9yKHtjbGFzczogXCJkYXJrXCIsIFxuICAgICAgICAgICAgICBpbnB1dDogUmVhY3QuRE9NLmlucHV0KHt0eXBlOiBcInJhZGlvXCIsIG5hbWU6IFwiY29sb3JcIiwgdmFsdWU6IFwiZGFya1wiLCBvbkNoYW5nZTogdGhpcy5oYW5kbGVDb2xvcn0pLCBcbiAgICAgICAgICAgICAgbGFiZWw6IFwiRGFya1wifVxuICAgICAgICAgICAgKVxuICAgICAgICAgICAgICBcbiAgICAgICAgICApXG4gICAgICAgICksIFxuICAgICAgICBmaWVsZC5Db2wobnVsbCwgXG4gICAgICAgICAgZmllbGQuUHJldmlldyh7XG4gICAgICAgICAgd2lkdGg6ICQud2lkdGgsIFxuICAgICAgICAgIGhlaWdodDogJC5oZWlnaHQsIFxuICAgICAgICAgIHRpdGxlOiAkLnRpdGxlLCBcbiAgICAgICAgICBjb2xvcjogJ2Jhci0nKyQuY29sb3J9XG4gICAgICAgICAgKVxuICAgICAgICApXG4gICAgICApXG4gICAgICApXG4gICAgKTtcbiAgfSxcbiAgaGFuZGxlVGl0bGU6IGZ1bmN0aW9uKGUpIHtcbiAgICB0aGlzLnNldFN0YXRlKHt0aXRsZTogZS50YXJnZXQudmFsdWV9KTtcbiAgICBzdG9yZSgndGl0bGUnLCBlLnRhcmdldC52YWx1ZSk7XG4gIH0sXG4gIHRvZ2dsZUVkaXQ6IGZ1bmN0aW9uKGUpIHtcbiAgICB2YXIgdG9nZ2xlID0gIXRoaXMuc3RhdGUuZWRpdDtcbiAgICB0aGlzLnNldFN0YXRlKHtlZGl0OiB0b2dnbGV9KTtcbiAgfSxcbiAgdG9nZ2xlQ29sb3JzOiBmdW5jdGlvbihlKSB7XG4gICAgdmFyIHRvZ2dsZSA9ICF0aGlzLnN0YXRlLmNvbG9ycztcbiAgICB0aGlzLnNldFN0YXRlKHtjb2xvcnM6IHRvZ2dsZX0pO1xuICB9LFxuICBoYW5kbGVXaWR0aDogZnVuY3Rpb24oZSkge1xuICAgIHRoaXMuc2V0U3RhdGUoe3dpZHRoOiBlLnRhcmdldC52YWx1ZX0pO1xuICAgIHN0b3JlKCd3aWR0aCcsIGUudGFyZ2V0LnZhbHVlKTtcbiAgfSxcbiAgaGFuZGxlSGVpZ2h0OiBmdW5jdGlvbihlKSB7XG4gICAgdGhpcy5zZXRTdGF0ZSh7aGVpZ2h0OiBlLnRhcmdldC52YWx1ZX0pO1xuICAgIHN0b3JlKCdoZWlnaHQnLCBlLnRhcmdldC52YWx1ZSk7XG4gIH0sXG4gIGhhbmRsZUNvbG9yOiBmdW5jdGlvbihlKSB7XG4gICAgdGhpcy5zZXRTdGF0ZSh7Y29sb3I6IGUudGFyZ2V0LnZhbHVlfSk7XG4gICAgc3RvcmUoJ2NvbG9yJywgZS50YXJnZXQudmFsdWUpO1xuICB9XG4gIFxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBNYWluOyJdfQ==
