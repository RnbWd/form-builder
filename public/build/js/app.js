(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
},{"./main":10,"react":undefined}],3:[function(require,module,exports){
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
},{"react":undefined}],4:[function(require,module,exports){
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
},{"react":undefined}],5:[function(require,module,exports){
/**
 * @jsx React.DOM
 */

var React = require('react');
var Color = React.createClass({displayName: 'Color',

  render: function() {
    var _ = this.props;
    return (
      React.DOM.div({className: "item item-toggle "+_.class+"-bg "+_.class}, 
        _.label, 
        React.DOM.label({className: "toggle toggle-"+_.class}, 
           _.input, 
           React.DOM.div({className: "track"}, 
             React.DOM.div({className: "handle"})
           )
        )
      )
      );
  }

});

module.exports = Color;
},{"react":undefined}],6:[function(require,module,exports){
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
    var forms = _.forms.map(function(form, key) {
      if(form.type === 'checkbox') {
        return (
        React.DOM.div({key: key, className: 'item item-checkbox text-center'}, 
          React.DOM.label({className: form.type}, 
            React.DOM.input({type: form.type})
          ), 
           React.DOM.span({style: {marginLeft: '-20%'}}, form.label)
        )
        );
      } else {
        return (
            React.DOM.label({key: key, className: "item item-input"}, 
              React.DOM.span({className: "input-label"}, form.label), 
              React.DOM.input({type: form.type, placeholder: form.label})
            )
          );
      }
      
    });
    return (
      React.DOM.div({className: "tablet content", style: {width: _.width, height: _.height}}, 
        React.DOM.div({className: "bar bar-header "+_.color}, React.DOM.h1({className: "title"}, _.title)), 
          React.DOM.div({className: "list list-inset", style: {marginTop: 40}}, 
            forms
        )
      )
    );
  }

});

module.exports = Preview;
},{"react":undefined}],8:[function(require,module,exports){
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
},{"react":undefined}],9:[function(require,module,exports){
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
},{"react":undefined}],10:[function(require,module,exports){
/**
 * @jsx React.DOM
 */

var React = require('react');
var field = require('./components');
var store = require('store2');
var _colors = ['light', 'stable', 'positive', 'calm', 'balanced', 'energized', 'assertive', 'royal', 'dark'];
var Main = React.createClass({displayName: 'Main',
  getInitialState: function() {
    return {
      edit: store('edit') || '',
      width: store('width') || 450,
      height: store('height') || 550,
      title: store('title') || 'Attendee Form',
      color: store('color') || 'light',
      forms: store('forms') || [{"type":"text","title":"First Name","label":"First Name"},{"type":"text","title":"Last Name","label":"Last Name"},{"type":"checkbox","label":"Checked in?"}] 
    };
  },
  render: function() {
    var $ = this.state;
    console.log(JSON.stringify($.forms));
    var self = this;
    var colors = _colors.map(function(color) {
      return (
        React.DOM.button({className: "button button-"+color, value: color, onClick: self.handleColor}, color)
      );
    });
    var changeTitle = (
      field.Bar({class: "bar-header item-input-inset bar-stable"}, 
          React.DOM.label({className: "item item-input-wrapper"}, 
             React.DOM.span({class: "input-label", style: {marginLeft: '30%', marginRight: 40}}, React.DOM.i({className: "icon ion-edit"}), " Form Title:"), 
            React.DOM.input({type: "text", style: {textAlign: 'center', marginRight: 'auto', borderBottom: '2px dotted black', width: 200}, placeholder: "Title", value: $.title, onChange: self.handleTitle})
          ), 
          React.DOM.button({className: "button button-clear", onClick: self.toggleEdit}, React.DOM.i({className: "icon ion-android-mixer balanced rainbow"}))
        )
        );
    var origtitle = (
      field.Bar({class: "bar-header bar-stable"}, 
        React.DOM.div({className: "h1 title"}, "Form Builder"), 
        React.DOM.button({className: "button button-icon icon ion-ios7-settings", onClick: this.toggleEdit})
      )
    );
    var hwidth = (
      field.Row(null, 
        field.Col(null, 
          field.Range({class: "range-calm rainbow", 
              left: "ion-ios7-arrow-thin-down", right: "ion-ios7-arrow-thin-up", 
              input: React.DOM.input({type: "range", name: "height", min: "250", max: "1000", value: $.height, onChange: this.handleHeight})}
            )
        ), 
        field.Col(null, 
          field.Range({class: "range-calm rainbow", 
            left: "ion-ios7-arrow-thin-left", right: "ion-ios7-arrow-thin-right", 
            input: React.DOM.input({type: "range", name: "width", min: "300", max: "1200", value: $.width, onChange: this.handleWidth})}
          )
        )
      )
    );
    var formFields = $.forms.map(function(form, key) {
      return (
          React.DOM.label({className: "item-input", style: {paddingLeft: 10}}, 
            React.DOM.i({className: "icon ion-wineglass"}), 
            React.DOM.input({type: "text", className: "sample-input", 
            placeholder: "Label", value: form.label, 
            onChange: self.handleForm.bind(null, key), style: {paddingLeft: 20}})
          )
      );
    });
    return (
      React.DOM.div({className: "has-header"}, 
        $.edit ? changeTitle : origtitle, 
      React.DOM.div({className: "button-bar", style: {marginTop: $.edit ? 0 : 44}}, 
        $.edit ? hwidth : colors
      ), 
      
      field.Row(null, 
        field.Col({class: 'col-33'}, 
          React.DOM.div({className: "list card"}, 
            formFields
          ), 
          React.DOM.div({className: "text-center"}, 
          React.DOM.button({className: "button button-outline icon-right ion-ios7-plus-outline button-balanced", onClick: this.addField}, "Add Text Field"), 
          React.DOM.button({className: "button button-outline icon-right ion-ios7-plus-outline button-positive", onClick: this.addCheckbox}, "Add Check Box"), 
          React.DOM.button({className: "button button-outline icon-right ion-sad button-assertive", onClick: this.remove}, "Remove Last Item")
          )
        ), 
        field.Col(null, 
          field.Preview({
          width: $.width, 
          height: $.height, 
          title: $.title, 
          color: 'bar-'+$.color, 
          forms: $.forms}
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
    store('edit', toggle);
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
  },
  handleForm: function(key, e) {
    var newForms = this.state.forms;
    newForms[key].label = e.target.value;
    this.setState({forms: newForms});
    store('forms', newForms);
  },
  addField: function(e) {
    var newForms = this.state.forms;
    newForms.push({type: 'text', label: ''});
    this.setState({forms: newForms});
    store('forms', newForms);
  },
  addCheckbox: function(e) {
    var newForms = this.state.forms;
    newForms.push({type: 'checkbox', label: ''});
    this.setState({forms: newForms});
    store('forms', newForms);
  },
  remove: function() {
    var newForms = this.state.forms;
    newForms.pop();
    this.setState({forms: newForms});
    store('forms', newForms);
  }
  

});

module.exports = Main;
},{"./components":6,"react":undefined,"store2":1}]},{},[2])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9SYWluYm93L2Zvcm0tYnVpbGRlci9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL1JhaW5ib3cvZm9ybS1idWlsZGVyL25vZGVfbW9kdWxlcy9zdG9yZTIvZGlzdC9zdG9yZTIuanMiLCIvVXNlcnMvUmFpbmJvdy9mb3JtLWJ1aWxkZXIvc3JjL2pzL2FwcC5qcyIsIi9Vc2Vycy9SYWluYm93L2Zvcm0tYnVpbGRlci9zcmMvanMvY29tcG9uZW50cy9iYXIuanMiLCIvVXNlcnMvUmFpbmJvdy9mb3JtLWJ1aWxkZXIvc3JjL2pzL2NvbXBvbmVudHMvY29sLmpzIiwiL1VzZXJzL1JhaW5ib3cvZm9ybS1idWlsZGVyL3NyYy9qcy9jb21wb25lbnRzL2NvbG9yLmpzIiwiL1VzZXJzL1JhaW5ib3cvZm9ybS1idWlsZGVyL3NyYy9qcy9jb21wb25lbnRzL2luZGV4LmpzIiwiL1VzZXJzL1JhaW5ib3cvZm9ybS1idWlsZGVyL3NyYy9qcy9jb21wb25lbnRzL3ByZXZpZXcuanMiLCIvVXNlcnMvUmFpbmJvdy9mb3JtLWJ1aWxkZXIvc3JjL2pzL2NvbXBvbmVudHMvcmFuZ2UuanMiLCIvVXNlcnMvUmFpbmJvdy9mb3JtLWJ1aWxkZXIvc3JjL2pzL2NvbXBvbmVudHMvcm93LmpzIiwiL1VzZXJzL1JhaW5ib3cvZm9ybS1idWlsZGVyL3NyYy9qcy9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKiEgc3RvcmUyIC0gdjIuMS42IC0gMjAxNC0wMy0xMFxuKiBDb3B5cmlnaHQgKGMpIDIwMTQgTmF0aGFuIEJ1Ym5hOyBMaWNlbnNlZCBNSVQsIEdQTCAqL1xuOyhmdW5jdGlvbih3aW5kb3csIGRlZmluZSkge1xuICAgIHZhciBfID0ge1xuICAgICAgICB2ZXJzaW9uOiBcIjIuMS42XCIsXG4gICAgICAgIGFyZWFzOiB7fSxcbiAgICAgICAgYXBpczoge30sXG5cbiAgICAgICAgLy8gdXRpbGl0aWVzXG4gICAgICAgIGluaGVyaXQ6IGZ1bmN0aW9uKGFwaSwgbykge1xuICAgICAgICAgICAgZm9yICh2YXIgcCBpbiBhcGkpIHtcbiAgICAgICAgICAgICAgICBpZiAoIW8uaGFzT3duUHJvcGVydHkocCkpIHtcbiAgICAgICAgICAgICAgICAgICAgb1twXSA9IGFwaVtwXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbztcbiAgICAgICAgfSxcbiAgICAgICAgc3RyaW5naWZ5OiBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICByZXR1cm4gZCA9PT0gdW5kZWZpbmVkIHx8IHR5cGVvZiBkID09PSBcImZ1bmN0aW9uXCIgPyBkKycnIDogSlNPTi5zdHJpbmdpZnkoZCk7XG4gICAgICAgIH0sXG4gICAgICAgIHBhcnNlOiBmdW5jdGlvbihzKSB7XG4gICAgICAgICAgICAvLyBpZiBpdCBkb2Vzbid0IHBhcnNlLCByZXR1cm4gYXMgaXNcbiAgICAgICAgICAgIHRyeXsgcmV0dXJuIEpTT04ucGFyc2Uocyk7IH1jYXRjaChlKXsgcmV0dXJuIHM7IH1cbiAgICAgICAgfSxcblxuICAgICAgICAvLyBleHRlbnNpb24gaG9va3NcbiAgICAgICAgZm46IGZ1bmN0aW9uKG5hbWUsIGZuKSB7XG4gICAgICAgICAgICBfLnN0b3JlQVBJW25hbWVdID0gZm47XG4gICAgICAgICAgICBmb3IgKHZhciBhcGkgaW4gXy5hcGlzKSB7XG4gICAgICAgICAgICAgICAgXy5hcGlzW2FwaV1bbmFtZV0gPSBmbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgZ2V0OiBmdW5jdGlvbihhcmVhLCBrZXkpeyByZXR1cm4gYXJlYS5nZXRJdGVtKGtleSk7IH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24oYXJlYSwga2V5LCBzdHJpbmcpeyBhcmVhLnNldEl0ZW0oa2V5LCBzdHJpbmcpOyB9LFxuICAgICAgICByZW1vdmU6IGZ1bmN0aW9uKGFyZWEsIGtleSl7IGFyZWEucmVtb3ZlSXRlbShrZXkpOyB9LFxuICAgICAgICBrZXk6IGZ1bmN0aW9uKGFyZWEsIGkpeyByZXR1cm4gYXJlYS5rZXkoaSk7IH0sXG4gICAgICAgIGxlbmd0aDogZnVuY3Rpb24oYXJlYSl7IHJldHVybiBhcmVhLmxlbmd0aDsgfSxcbiAgICAgICAgY2xlYXI6IGZ1bmN0aW9uKGFyZWEpeyBhcmVhLmNsZWFyKCk7IH0sXG5cbiAgICAgICAgLy8gY29yZSBmdW5jdGlvbnNcbiAgICAgICAgU3RvcmU6IGZ1bmN0aW9uKGlkLCBhcmVhLCBuYW1lc3BhY2UpIHtcbiAgICAgICAgICAgIHZhciBzdG9yZSA9IF8uaW5oZXJpdChfLnN0b3JlQVBJLCBmdW5jdGlvbihrZXksIGRhdGEsIG92ZXJ3cml0ZSkge1xuICAgICAgICAgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKXsgcmV0dXJuIHN0b3JlLmdldEFsbCgpOyB9XG4gICAgICAgICAgICAgICAgaWYgKGRhdGEgIT09IHVuZGVmaW5lZCl7IHJldHVybiBzdG9yZS5zZXQoa2V5LCBkYXRhLCBvdmVyd3JpdGUpOyB9XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIpeyByZXR1cm4gc3RvcmUuZ2V0KGtleSk7IH1cbiAgICAgICAgICAgICAgICBpZiAoIWtleSl7IHJldHVybiBzdG9yZS5jbGVhcigpOyB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0b3JlLnNldEFsbChrZXksIGRhdGEpOy8vIG92ZXJ3cml0ZT1kYXRhLCBkYXRhPWtleVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBzdG9yZS5faWQgPSBpZDtcbiAgICAgICAgICAgIHN0b3JlLl9hcmVhID0gYXJlYSB8fCBfLmluaGVyaXQoXy5zdG9yYWdlQVBJLCB7IGl0ZW1zOiB7fSwgbmFtZTogJ2Zha2UnIH0pO1xuICAgICAgICAgICAgc3RvcmUuX25zID0gbmFtZXNwYWNlIHx8ICcnO1xuICAgICAgICAgICAgaWYgKCFfLmFyZWFzW2lkXSkge1xuICAgICAgICAgICAgICAgIF8uYXJlYXNbaWRdID0gc3RvcmUuX2FyZWE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIV8uYXBpc1tzdG9yZS5fbnMrc3RvcmUuX2lkXSkge1xuICAgICAgICAgICAgICAgIF8uYXBpc1tzdG9yZS5fbnMrc3RvcmUuX2lkXSA9IHN0b3JlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHN0b3JlO1xuICAgICAgICB9LFxuICAgICAgICBzdG9yZUFQSToge1xuICAgICAgICAgICAgLy8gYWRtaW4gZnVuY3Rpb25zXG4gICAgICAgICAgICBhcmVhOiBmdW5jdGlvbihpZCwgYXJlYSkge1xuICAgICAgICAgICAgICAgIHZhciBzdG9yZSA9IHRoaXNbaWRdO1xuICAgICAgICAgICAgICAgIGlmICghc3RvcmUgfHwgIXN0b3JlLmFyZWEpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RvcmUgPSBfLlN0b3JlKGlkLCBhcmVhLCB0aGlzLl9ucyk7Ly9uZXcgYXJlYS1zcGVjaWZpYyBhcGkgaW4gdGhpcyBuYW1lc3BhY2VcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzW2lkXSl7IHRoaXNbaWRdID0gc3RvcmU7IH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0b3JlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG5hbWVzcGFjZTogZnVuY3Rpb24obmFtZXNwYWNlLCBub1Nlc3Npb24pIHtcbiAgICAgICAgICAgICAgICBpZiAoIW5hbWVzcGFjZSl7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9ucyA/IHRoaXMuX25zLnN1YnN0cmluZygwLHRoaXMuX25zLmxlbmd0aC0xKSA6ICcnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgbnMgPSBuYW1lc3BhY2UsIHN0b3JlID0gdGhpc1tuc107XG4gICAgICAgICAgICAgICAgaWYgKCFzdG9yZSB8fCAhc3RvcmUubmFtZXNwYWNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0b3JlID0gXy5TdG9yZSh0aGlzLl9pZCwgdGhpcy5fYXJlYSwgdGhpcy5fbnMrbnMrJy4nKTsvL25ldyBuYW1lc3BhY2VkIGFwaVxuICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXNbbnNdKXsgdGhpc1tuc10gPSBzdG9yZTsgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoIW5vU2Vzc2lvbil7IHN0b3JlLmFyZWEoJ3Nlc3Npb24nLCBfLmFyZWFzLnNlc3Npb24pOyB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBzdG9yZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpc0Zha2U6IGZ1bmN0aW9uKCl7IHJldHVybiB0aGlzLl9hcmVhLm5hbWUgPT09ICdmYWtlJzsgfSxcbiAgICAgICAgICAgIHRvU3RyaW5nOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJ3N0b3JlJysodGhpcy5fbnM/Jy4nK3RoaXMubmFtZXNwYWNlKCk6JycpKydbJyt0aGlzLl9pZCsnXSc7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvLyBzdG9yYWdlIGZ1bmN0aW9uc1xuICAgICAgICAgICAgaGFzOiBmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fYXJlYS5oYXMpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2FyZWEuaGFzKHRoaXMuX2luKGtleSkpOy8vZXh0ZW5zaW9uIGhvb2tcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuICEhKHRoaXMuX2luKGtleSkgaW4gdGhpcy5fYXJlYSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2l6ZTogZnVuY3Rpb24oKXsgcmV0dXJuIHRoaXMua2V5cygpLmxlbmd0aDsgfSxcbiAgICAgICAgICAgIGVhY2g6IGZ1bmN0aW9uKGZuLCBhbmQpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpPTAsIG09Xy5sZW5ndGgodGhpcy5fYXJlYSk7IGk8bTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBrZXkgPSB0aGlzLl9vdXQoXy5rZXkodGhpcy5fYXJlYSwgaSkpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoa2V5ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmbi5jYWxsKHRoaXMsIGtleSwgYW5kIHx8IHRoaXMuZ2V0KGtleSkpID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChtID4gXy5sZW5ndGgodGhpcy5fYXJlYSkpIHsgbS0tOyBpLS07IH0vLyBpbiBjYXNlIG9mIHJlbW92ZUl0ZW1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFuZCB8fCB0aGlzO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGtleXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmVhY2goZnVuY3Rpb24oaywgbGlzdCl7IGxpc3QucHVzaChrKTsgfSwgW10pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24oa2V5LCBhbHQpIHtcbiAgICAgICAgICAgICAgICB2YXIgcyA9IF8uZ2V0KHRoaXMuX2FyZWEsIHRoaXMuX2luKGtleSkpO1xuICAgICAgICAgICAgICAgIHJldHVybiBzICE9PSBudWxsID8gXy5wYXJzZShzKSA6IGFsdCB8fCBzOy8vIHN1cHBvcnQgYWx0IGZvciBlYXN5IGRlZmF1bHQgbWdtdFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldEFsbDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbihrLCBhbGwpeyBhbGxba10gPSB0aGlzLmdldChrKTsgfSwge30pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNldDogZnVuY3Rpb24oa2V5LCBkYXRhLCBvdmVyd3JpdGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgZCA9IHRoaXMuZ2V0KGtleSk7XG4gICAgICAgICAgICAgICAgaWYgKGQgIT0gbnVsbCAmJiBvdmVyd3JpdGUgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkYXRhO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gXy5zZXQodGhpcy5fYXJlYSwgdGhpcy5faW4oa2V5KSwgXy5zdHJpbmdpZnkoZGF0YSksIG92ZXJ3cml0ZSkgfHwgZDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzZXRBbGw6IGZ1bmN0aW9uKGRhdGEsIG92ZXJ3cml0ZSkge1xuICAgICAgICAgICAgICAgIHZhciBjaGFuZ2VkLCB2YWw7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIGRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsID0gZGF0YVtrZXldO1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5zZXQoa2V5LCB2YWwsIG92ZXJ3cml0ZSkgIT09IHZhbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hhbmdlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNoYW5nZWQ7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVtb3ZlOiBmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgICAgICAgICB2YXIgZCA9IHRoaXMuZ2V0KGtleSk7XG4gICAgICAgICAgICAgICAgXy5yZW1vdmUodGhpcy5fYXJlYSwgdGhpcy5faW4oa2V5KSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGQ7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY2xlYXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5fbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgXy5jbGVhcih0aGlzLl9hcmVhKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVhY2goZnVuY3Rpb24oayl7IF8ucmVtb3ZlKHRoaXMuX2FyZWEsIHRoaXMuX2luKGspKTsgfSwgMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNsZWFyQWxsOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgYXJlYSA9IHRoaXMuX2FyZWE7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaWQgaW4gXy5hcmVhcykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoXy5hcmVhcy5oYXNPd25Qcm9wZXJ0eShpZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2FyZWEgPSBfLmFyZWFzW2lkXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2xlYXIoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLl9hcmVhID0gYXJlYTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8vIGludGVybmFsIHVzZSBmdW5jdGlvbnNcbiAgICAgICAgICAgIF9pbjogZnVuY3Rpb24oaykge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgayAhPT0gXCJzdHJpbmdcIil7IGsgPSBfLnN0cmluZ2lmeShrKTsgfVxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9ucyA/IHRoaXMuX25zICsgayA6IGs7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgX291dDogZnVuY3Rpb24oaykge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9ucyA/XG4gICAgICAgICAgICAgICAgICAgIGsgJiYgay5pbmRleE9mKHRoaXMuX25zKSA9PT0gMCA/XG4gICAgICAgICAgICAgICAgICAgICAgICBrLnN1YnN0cmluZyh0aGlzLl9ucy5sZW5ndGgpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgIHVuZGVmaW5lZCA6IC8vIHNvIGVhY2goKSBrbm93cyB0byBza2lwIGl0XG4gICAgICAgICAgICAgICAgICAgIGs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sLy8gZW5kIF8uc3RvcmVBUElcbiAgICAgICAgc3RvcmFnZUFQSToge1xuICAgICAgICAgICAgbGVuZ3RoOiAwLFxuICAgICAgICAgICAgaGFzOiBmdW5jdGlvbihrKXsgcmV0dXJuIHRoaXMuaXRlbXMuaGFzT3duUHJvcGVydHkoayk7IH0sXG4gICAgICAgICAgICBrZXk6IGZ1bmN0aW9uKGkpIHtcbiAgICAgICAgICAgICAgICB2YXIgYyA9IDA7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgayBpbiB0aGlzLml0ZW1zKXtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuaGFzKGspICYmIGkgPT09IGMrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2V0SXRlbTogZnVuY3Rpb24oaywgdikge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5oYXMoaykpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sZW5ndGgrKztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5pdGVtc1trXSA9IHY7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVtb3ZlSXRlbTogZnVuY3Rpb24oaykge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmhhcyhrKSkge1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5pdGVtc1trXTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sZW5ndGgtLTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0SXRlbTogZnVuY3Rpb24oayl7IHJldHVybiB0aGlzLmhhcyhrKSA/IHRoaXMuaXRlbXNba10gOiBudWxsOyB9LFxuICAgICAgICAgICAgY2xlYXI6IGZ1bmN0aW9uKCl7IGZvciAodmFyIGsgaW4gdGhpcy5saXN0KXsgdGhpcy5yZW1vdmVJdGVtKGspOyB9IH0sXG4gICAgICAgICAgICB0b1N0cmluZzogZnVuY3Rpb24oKXsgcmV0dXJuIHRoaXMubGVuZ3RoKycgaXRlbXMgaW4gJyt0aGlzLm5hbWUrJ1N0b3JhZ2UnOyB9XG4gICAgICAgIH0vLyBlbmQgXy5zdG9yYWdlQVBJXG4gICAgfTtcblxuICAgIC8vIHNldHVwIHRoZSBwcmltYXJ5IHN0b3JlIGZuXG4gICAgaWYgKHdpbmRvdy5zdG9yZSl7IF8uY29uZmxpY3QgPSB3aW5kb3cuc3RvcmU7IH1cbiAgICB2YXIgc3RvcmUgPVxuICAgICAgICAvLyBzYWZlbHkgc2V0IHRoaXMgdXAgKHRocm93cyBlcnJvciBpbiBJRTEwLzMyYml0IG1vZGUgZm9yIGxvY2FsIGZpbGVzKVxuICAgICAgICBfLlN0b3JlKFwibG9jYWxcIiwgKGZ1bmN0aW9uKCl7dHJ5eyByZXR1cm4gbG9jYWxTdG9yYWdlOyB9Y2F0Y2goZSl7fX0pKCkpO1xuICAgIHN0b3JlLmxvY2FsID0gc3RvcmU7Ly8gZm9yIGNvbXBsZXRlbmVzc1xuICAgIHN0b3JlLl8gPSBfOy8vIGZvciBleHRlbmRlcnMgYW5kIGRlYnVnZ2Vycy4uLlxuICAgIC8vIHNhZmVseSBzZXR1cCBzdG9yZS5zZXNzaW9uICh0aHJvd3MgZXhjZXB0aW9uIGluIEZGIGZvciBmaWxlOi8vLyB1cmxzKVxuICAgIHN0b3JlLmFyZWEoXCJzZXNzaW9uXCIsIChmdW5jdGlvbigpe3RyeXsgcmV0dXJuIHNlc3Npb25TdG9yYWdlOyB9Y2F0Y2goZSl7fX0pKCkpO1xuXG4gICAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGRlZmluZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gc3RvcmU7XG4gICAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBzdG9yZTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB3aW5kb3cuc3RvcmUgPSBzdG9yZTtcbiAgICB9XG5cbn0pKHdpbmRvdywgd2luZG93LmRlZmluZSk7XG4iLCIvKipcbiAqIEBqc3ggUmVhY3QuRE9NXG4gKi9cbi8qIGdsb2JhbCB3aW5kb3csIGRvY3VtZW50ICovXG52YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuXG52YXIgTWFpbiA9IHJlcXVpcmUoJy4vbWFpbicpO1xud2luZG93LlZpZXcgPSBSZWFjdC5yZW5kZXJDb21wb25lbnQoXG4gIE1haW4obnVsbCksXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd2aWV3Jylcbik7XG5cbndpbmRvdy5SZWFjdCA9IFJlYWN0OyIsIi8qKlxuICogQGpzeCBSZWFjdC5ET01cbiAqL1xuXG52YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuXG52YXIgSGVhZGVyID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnSGVhZGVyJyxcbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgY2xhc3M6ICdiYXItaGVhZGVyIGJhci1zdGFibGUnXG4gICAgfTtcbiAgfSxcbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgXyA9IHRoaXMucHJvcHM7XG4gICAgcmV0dXJuIChcbiAgICAgIFJlYWN0LkRPTS5kaXYoe2NsYXNzTmFtZTogXCJiYXIgXCIrXy5jbGFzc30sIFxuICAgICAgICBfLmNoaWxkcmVuXG4gICAgICApXG4gICAgKTtcbiAgfVxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBIZWFkZXI7IiwiLyoqXG4gKiBAanN4IFJlYWN0LkRPTVxuICovXG5cbnZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5cbnZhciBDb2wgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdDb2wnLFxuXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgdmFyIF8gPSB0aGlzLnByb3BzO1xuICAgIHJldHVybiAoXG4gICAgICBSZWFjdC5ET00uZGl2KHtjbGFzc05hbWU6IFwiY29sIFwiK18uY2xhc3N9LCBcbiAgICAgICAgXy5jaGlsZHJlblxuICAgICAgKVxuICAgICk7XG4gIH1cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ29sOyIsIi8qKlxuICogQGpzeCBSZWFjdC5ET01cbiAqL1xuXG52YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xudmFyIENvbG9yID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnQ29sb3InLFxuXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgdmFyIF8gPSB0aGlzLnByb3BzO1xuICAgIHJldHVybiAoXG4gICAgICBSZWFjdC5ET00uZGl2KHtjbGFzc05hbWU6IFwiaXRlbSBpdGVtLXRvZ2dsZSBcIitfLmNsYXNzK1wiLWJnIFwiK18uY2xhc3N9LCBcbiAgICAgICAgXy5sYWJlbCwgXG4gICAgICAgIFJlYWN0LkRPTS5sYWJlbCh7Y2xhc3NOYW1lOiBcInRvZ2dsZSB0b2dnbGUtXCIrXy5jbGFzc30sIFxuICAgICAgICAgICBfLmlucHV0LCBcbiAgICAgICAgICAgUmVhY3QuRE9NLmRpdih7Y2xhc3NOYW1lOiBcInRyYWNrXCJ9LCBcbiAgICAgICAgICAgICBSZWFjdC5ET00uZGl2KHtjbGFzc05hbWU6IFwiaGFuZGxlXCJ9KVxuICAgICAgICAgICApXG4gICAgICAgIClcbiAgICAgIClcbiAgICAgICk7XG4gIH1cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ29sb3I7IiwidmFyIGluZGV4ID0ge307XG5cbm1vZHVsZS5leHBvcnRzID0gaW5kZXg7XG5cbmluZGV4LkJhciA9IHJlcXVpcmUoJy4vYmFyJyk7XG5pbmRleC5Sb3cgPSByZXF1aXJlKCcuL3JvdycpO1xuaW5kZXguQ29sID0gcmVxdWlyZSgnLi9jb2wnKTtcbmluZGV4LlJhbmdlID0gcmVxdWlyZSgnLi9yYW5nZScpO1xuaW5kZXguUHJldmlldyA9IHJlcXVpcmUoJy4vcHJldmlldycpO1xuaW5kZXguQ29sb3IgPSByZXF1aXJlKCcuL2NvbG9yJyk7XG4vL2luZGV4LklucHV0ID0gcmVxdWlyZSgnLi9pbnB1dCcpO1xuLy9pbmRleC5Gb3JtR3JvdXAgPSByZXF1aXJlKCcuL2Zvcm1Hcm91cCcpO1xuLy9pbmRleC5JbnB1dEdyb3VwID0gcmVxdWlyZSgnLi9pbnB1dEdyb3VwJyk7IiwiLyoqXG4gKiBAanN4IFJlYWN0LkRPTVxuICovXG5cbnZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5cbnZhciBQcmV2aWV3ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnUHJldmlldycsXG5cbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgXyA9IHRoaXMucHJvcHM7XG4gICAgdmFyIGZvcm1zID0gXy5mb3Jtcy5tYXAoZnVuY3Rpb24oZm9ybSwga2V5KSB7XG4gICAgICBpZihmb3JtLnR5cGUgPT09ICdjaGVja2JveCcpIHtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgUmVhY3QuRE9NLmRpdih7a2V5OiBrZXksIGNsYXNzTmFtZTogJ2l0ZW0gaXRlbS1jaGVja2JveCB0ZXh0LWNlbnRlcid9LCBcbiAgICAgICAgICBSZWFjdC5ET00ubGFiZWwoe2NsYXNzTmFtZTogZm9ybS50eXBlfSwgXG4gICAgICAgICAgICBSZWFjdC5ET00uaW5wdXQoe3R5cGU6IGZvcm0udHlwZX0pXG4gICAgICAgICAgKSwgXG4gICAgICAgICAgIFJlYWN0LkRPTS5zcGFuKHtzdHlsZToge21hcmdpbkxlZnQ6ICctMjAlJ319LCBmb3JtLmxhYmVsKVxuICAgICAgICApXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgUmVhY3QuRE9NLmxhYmVsKHtrZXk6IGtleSwgY2xhc3NOYW1lOiBcIml0ZW0gaXRlbS1pbnB1dFwifSwgXG4gICAgICAgICAgICAgIFJlYWN0LkRPTS5zcGFuKHtjbGFzc05hbWU6IFwiaW5wdXQtbGFiZWxcIn0sIGZvcm0ubGFiZWwpLCBcbiAgICAgICAgICAgICAgUmVhY3QuRE9NLmlucHV0KHt0eXBlOiBmb3JtLnR5cGUsIHBsYWNlaG9sZGVyOiBmb3JtLmxhYmVsfSlcbiAgICAgICAgICAgIClcbiAgICAgICAgICApO1xuICAgICAgfVxuICAgICAgXG4gICAgfSk7XG4gICAgcmV0dXJuIChcbiAgICAgIFJlYWN0LkRPTS5kaXYoe2NsYXNzTmFtZTogXCJ0YWJsZXQgY29udGVudFwiLCBzdHlsZToge3dpZHRoOiBfLndpZHRoLCBoZWlnaHQ6IF8uaGVpZ2h0fX0sIFxuICAgICAgICBSZWFjdC5ET00uZGl2KHtjbGFzc05hbWU6IFwiYmFyIGJhci1oZWFkZXIgXCIrXy5jb2xvcn0sIFJlYWN0LkRPTS5oMSh7Y2xhc3NOYW1lOiBcInRpdGxlXCJ9LCBfLnRpdGxlKSksIFxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYoe2NsYXNzTmFtZTogXCJsaXN0IGxpc3QtaW5zZXRcIiwgc3R5bGU6IHttYXJnaW5Ub3A6IDQwfX0sIFxuICAgICAgICAgICAgZm9ybXNcbiAgICAgICAgKVxuICAgICAgKVxuICAgICk7XG4gIH1cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUHJldmlldzsiLCIvKipcbiAqIEBqc3ggUmVhY3QuRE9NXG4gKi9cblxudmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcblxudmFyIFJhbmdlID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnUmFuZ2UnLFxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICBpbnB1dDogUmVhY3QuRE9NLmlucHV0KHt0eXBlOiBcInJhbmdlXCIsIG5hbWU6IFwidm9sdW1lXCIsIG1pbjogXCIwXCIsIG1heDogXCIxMDBcIn0pXG4gICAgfTtcbiAgfSxcbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgXyA9IHRoaXMucHJvcHM7XG4gICAgdmFyIGxlZnQgPSBSZWFjdC5ET00uaSh7Y2xhc3NOYW1lOiBcImljb24gXCIrXy5sZWZ0fSk7XG4gICAgdmFyIHJpZ2h0ID0gUmVhY3QuRE9NLmkoe2NsYXNzTmFtZTogXCJpY29uIFwiK18ucmlnaHR9KTtcbiAgICByZXR1cm4gKFxuICAgICAgUmVhY3QuRE9NLmRpdih7Y2xhc3NOYW1lOiBcIml0ZW0gcmFuZ2UgXCIrXy5jbGFzc30sIFxuICAgICAgICBfLmxlZnQgPyBsZWZ0IDogJycsIFxuICAgICAgICBfLmlucHV0LCBcbiAgICAgICAgXy5yaWdodCA/IHJpZ2h0IDogJydcbiAgICAgIClcbiAgICApO1xuICB9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJhbmdlOyIsIi8qKlxuICogQGpzeCBSZWFjdC5ET01cbiAqL1xuXG52YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuXG52YXIgUm93ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnUm93JyxcblxuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBfID0gdGhpcy5wcm9wcztcbiAgICByZXR1cm4gKFxuICAgICAgUmVhY3QuRE9NLmRpdih7Y2xhc3NOYW1lOiBcInJvdyBcIitfLmNsYXNzfSwgXG4gICAgICAgIF8uY2hpbGRyZW5cbiAgICAgIClcbiAgICApO1xuICB9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJvdzsiLCIvKipcbiAqIEBqc3ggUmVhY3QuRE9NXG4gKi9cblxudmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcbnZhciBmaWVsZCA9IHJlcXVpcmUoJy4vY29tcG9uZW50cycpO1xudmFyIHN0b3JlID0gcmVxdWlyZSgnc3RvcmUyJyk7XG52YXIgX2NvbG9ycyA9IFsnbGlnaHQnLCAnc3RhYmxlJywgJ3Bvc2l0aXZlJywgJ2NhbG0nLCAnYmFsYW5jZWQnLCAnZW5lcmdpemVkJywgJ2Fzc2VydGl2ZScsICdyb3lhbCcsICdkYXJrJ107XG52YXIgTWFpbiA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ01haW4nLFxuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICBlZGl0OiBzdG9yZSgnZWRpdCcpIHx8ICcnLFxuICAgICAgd2lkdGg6IHN0b3JlKCd3aWR0aCcpIHx8IDQ1MCxcbiAgICAgIGhlaWdodDogc3RvcmUoJ2hlaWdodCcpIHx8IDU1MCxcbiAgICAgIHRpdGxlOiBzdG9yZSgndGl0bGUnKSB8fCAnQXR0ZW5kZWUgRm9ybScsXG4gICAgICBjb2xvcjogc3RvcmUoJ2NvbG9yJykgfHwgJ2xpZ2h0JyxcbiAgICAgIGZvcm1zOiBzdG9yZSgnZm9ybXMnKSB8fCBbe1widHlwZVwiOlwidGV4dFwiLFwidGl0bGVcIjpcIkZpcnN0IE5hbWVcIixcImxhYmVsXCI6XCJGaXJzdCBOYW1lXCJ9LHtcInR5cGVcIjpcInRleHRcIixcInRpdGxlXCI6XCJMYXN0IE5hbWVcIixcImxhYmVsXCI6XCJMYXN0IE5hbWVcIn0se1widHlwZVwiOlwiY2hlY2tib3hcIixcImxhYmVsXCI6XCJDaGVja2VkIGluP1wifV0gXG4gICAgfTtcbiAgfSxcbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgJCA9IHRoaXMuc3RhdGU7XG4gICAgY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkoJC5mb3JtcykpO1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgY29sb3JzID0gX2NvbG9ycy5tYXAoZnVuY3Rpb24oY29sb3IpIHtcbiAgICAgIHJldHVybiAoXG4gICAgICAgIFJlYWN0LkRPTS5idXR0b24oe2NsYXNzTmFtZTogXCJidXR0b24gYnV0dG9uLVwiK2NvbG9yLCB2YWx1ZTogY29sb3IsIG9uQ2xpY2s6IHNlbGYuaGFuZGxlQ29sb3J9LCBjb2xvcilcbiAgICAgICk7XG4gICAgfSk7XG4gICAgdmFyIGNoYW5nZVRpdGxlID0gKFxuICAgICAgZmllbGQuQmFyKHtjbGFzczogXCJiYXItaGVhZGVyIGl0ZW0taW5wdXQtaW5zZXQgYmFyLXN0YWJsZVwifSwgXG4gICAgICAgICAgUmVhY3QuRE9NLmxhYmVsKHtjbGFzc05hbWU6IFwiaXRlbSBpdGVtLWlucHV0LXdyYXBwZXJcIn0sIFxuICAgICAgICAgICAgIFJlYWN0LkRPTS5zcGFuKHtjbGFzczogXCJpbnB1dC1sYWJlbFwiLCBzdHlsZToge21hcmdpbkxlZnQ6ICczMCUnLCBtYXJnaW5SaWdodDogNDB9fSwgUmVhY3QuRE9NLmkoe2NsYXNzTmFtZTogXCJpY29uIGlvbi1lZGl0XCJ9KSwgXCIgRm9ybSBUaXRsZTpcIiksIFxuICAgICAgICAgICAgUmVhY3QuRE9NLmlucHV0KHt0eXBlOiBcInRleHRcIiwgc3R5bGU6IHt0ZXh0QWxpZ246ICdjZW50ZXInLCBtYXJnaW5SaWdodDogJ2F1dG8nLCBib3JkZXJCb3R0b206ICcycHggZG90dGVkIGJsYWNrJywgd2lkdGg6IDIwMH0sIHBsYWNlaG9sZGVyOiBcIlRpdGxlXCIsIHZhbHVlOiAkLnRpdGxlLCBvbkNoYW5nZTogc2VsZi5oYW5kbGVUaXRsZX0pXG4gICAgICAgICAgKSwgXG4gICAgICAgICAgUmVhY3QuRE9NLmJ1dHRvbih7Y2xhc3NOYW1lOiBcImJ1dHRvbiBidXR0b24tY2xlYXJcIiwgb25DbGljazogc2VsZi50b2dnbGVFZGl0fSwgUmVhY3QuRE9NLmkoe2NsYXNzTmFtZTogXCJpY29uIGlvbi1hbmRyb2lkLW1peGVyIGJhbGFuY2VkIHJhaW5ib3dcIn0pKVxuICAgICAgICApXG4gICAgICAgICk7XG4gICAgdmFyIG9yaWd0aXRsZSA9IChcbiAgICAgIGZpZWxkLkJhcih7Y2xhc3M6IFwiYmFyLWhlYWRlciBiYXItc3RhYmxlXCJ9LCBcbiAgICAgICAgUmVhY3QuRE9NLmRpdih7Y2xhc3NOYW1lOiBcImgxIHRpdGxlXCJ9LCBcIkZvcm0gQnVpbGRlclwiKSwgXG4gICAgICAgIFJlYWN0LkRPTS5idXR0b24oe2NsYXNzTmFtZTogXCJidXR0b24gYnV0dG9uLWljb24gaWNvbiBpb24taW9zNy1zZXR0aW5nc1wiLCBvbkNsaWNrOiB0aGlzLnRvZ2dsZUVkaXR9KVxuICAgICAgKVxuICAgICk7XG4gICAgdmFyIGh3aWR0aCA9IChcbiAgICAgIGZpZWxkLlJvdyhudWxsLCBcbiAgICAgICAgZmllbGQuQ29sKG51bGwsIFxuICAgICAgICAgIGZpZWxkLlJhbmdlKHtjbGFzczogXCJyYW5nZS1jYWxtIHJhaW5ib3dcIiwgXG4gICAgICAgICAgICAgIGxlZnQ6IFwiaW9uLWlvczctYXJyb3ctdGhpbi1kb3duXCIsIHJpZ2h0OiBcImlvbi1pb3M3LWFycm93LXRoaW4tdXBcIiwgXG4gICAgICAgICAgICAgIGlucHV0OiBSZWFjdC5ET00uaW5wdXQoe3R5cGU6IFwicmFuZ2VcIiwgbmFtZTogXCJoZWlnaHRcIiwgbWluOiBcIjI1MFwiLCBtYXg6IFwiMTAwMFwiLCB2YWx1ZTogJC5oZWlnaHQsIG9uQ2hhbmdlOiB0aGlzLmhhbmRsZUhlaWdodH0pfVxuICAgICAgICAgICAgKVxuICAgICAgICApLCBcbiAgICAgICAgZmllbGQuQ29sKG51bGwsIFxuICAgICAgICAgIGZpZWxkLlJhbmdlKHtjbGFzczogXCJyYW5nZS1jYWxtIHJhaW5ib3dcIiwgXG4gICAgICAgICAgICBsZWZ0OiBcImlvbi1pb3M3LWFycm93LXRoaW4tbGVmdFwiLCByaWdodDogXCJpb24taW9zNy1hcnJvdy10aGluLXJpZ2h0XCIsIFxuICAgICAgICAgICAgaW5wdXQ6IFJlYWN0LkRPTS5pbnB1dCh7dHlwZTogXCJyYW5nZVwiLCBuYW1lOiBcIndpZHRoXCIsIG1pbjogXCIzMDBcIiwgbWF4OiBcIjEyMDBcIiwgdmFsdWU6ICQud2lkdGgsIG9uQ2hhbmdlOiB0aGlzLmhhbmRsZVdpZHRofSl9XG4gICAgICAgICAgKVxuICAgICAgICApXG4gICAgICApXG4gICAgKTtcbiAgICB2YXIgZm9ybUZpZWxkcyA9ICQuZm9ybXMubWFwKGZ1bmN0aW9uKGZvcm0sIGtleSkge1xuICAgICAgcmV0dXJuIChcbiAgICAgICAgICBSZWFjdC5ET00ubGFiZWwoe2NsYXNzTmFtZTogXCJpdGVtLWlucHV0XCIsIHN0eWxlOiB7cGFkZGluZ0xlZnQ6IDEwfX0sIFxuICAgICAgICAgICAgUmVhY3QuRE9NLmkoe2NsYXNzTmFtZTogXCJpY29uIGlvbi13aW5lZ2xhc3NcIn0pLCBcbiAgICAgICAgICAgIFJlYWN0LkRPTS5pbnB1dCh7dHlwZTogXCJ0ZXh0XCIsIGNsYXNzTmFtZTogXCJzYW1wbGUtaW5wdXRcIiwgXG4gICAgICAgICAgICBwbGFjZWhvbGRlcjogXCJMYWJlbFwiLCB2YWx1ZTogZm9ybS5sYWJlbCwgXG4gICAgICAgICAgICBvbkNoYW5nZTogc2VsZi5oYW5kbGVGb3JtLmJpbmQobnVsbCwga2V5KSwgc3R5bGU6IHtwYWRkaW5nTGVmdDogMjB9fSlcbiAgICAgICAgICApXG4gICAgICApO1xuICAgIH0pO1xuICAgIHJldHVybiAoXG4gICAgICBSZWFjdC5ET00uZGl2KHtjbGFzc05hbWU6IFwiaGFzLWhlYWRlclwifSwgXG4gICAgICAgICQuZWRpdCA/IGNoYW5nZVRpdGxlIDogb3JpZ3RpdGxlLCBcbiAgICAgIFJlYWN0LkRPTS5kaXYoe2NsYXNzTmFtZTogXCJidXR0b24tYmFyXCIsIHN0eWxlOiB7bWFyZ2luVG9wOiAkLmVkaXQgPyAwIDogNDR9fSwgXG4gICAgICAgICQuZWRpdCA/IGh3aWR0aCA6IGNvbG9yc1xuICAgICAgKSwgXG4gICAgICBcbiAgICAgIGZpZWxkLlJvdyhudWxsLCBcbiAgICAgICAgZmllbGQuQ29sKHtjbGFzczogJ2NvbC0zMyd9LCBcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KHtjbGFzc05hbWU6IFwibGlzdCBjYXJkXCJ9LCBcbiAgICAgICAgICAgIGZvcm1GaWVsZHNcbiAgICAgICAgICApLCBcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KHtjbGFzc05hbWU6IFwidGV4dC1jZW50ZXJcIn0sIFxuICAgICAgICAgIFJlYWN0LkRPTS5idXR0b24oe2NsYXNzTmFtZTogXCJidXR0b24gYnV0dG9uLW91dGxpbmUgaWNvbi1yaWdodCBpb24taW9zNy1wbHVzLW91dGxpbmUgYnV0dG9uLWJhbGFuY2VkXCIsIG9uQ2xpY2s6IHRoaXMuYWRkRmllbGR9LCBcIkFkZCBUZXh0IEZpZWxkXCIpLCBcbiAgICAgICAgICBSZWFjdC5ET00uYnV0dG9uKHtjbGFzc05hbWU6IFwiYnV0dG9uIGJ1dHRvbi1vdXRsaW5lIGljb24tcmlnaHQgaW9uLWlvczctcGx1cy1vdXRsaW5lIGJ1dHRvbi1wb3NpdGl2ZVwiLCBvbkNsaWNrOiB0aGlzLmFkZENoZWNrYm94fSwgXCJBZGQgQ2hlY2sgQm94XCIpLCBcbiAgICAgICAgICBSZWFjdC5ET00uYnV0dG9uKHtjbGFzc05hbWU6IFwiYnV0dG9uIGJ1dHRvbi1vdXRsaW5lIGljb24tcmlnaHQgaW9uLXNhZCBidXR0b24tYXNzZXJ0aXZlXCIsIG9uQ2xpY2s6IHRoaXMucmVtb3ZlfSwgXCJSZW1vdmUgTGFzdCBJdGVtXCIpXG4gICAgICAgICAgKVxuICAgICAgICApLCBcbiAgICAgICAgZmllbGQuQ29sKG51bGwsIFxuICAgICAgICAgIGZpZWxkLlByZXZpZXcoe1xuICAgICAgICAgIHdpZHRoOiAkLndpZHRoLCBcbiAgICAgICAgICBoZWlnaHQ6ICQuaGVpZ2h0LCBcbiAgICAgICAgICB0aXRsZTogJC50aXRsZSwgXG4gICAgICAgICAgY29sb3I6ICdiYXItJyskLmNvbG9yLCBcbiAgICAgICAgICBmb3JtczogJC5mb3Jtc31cbiAgICAgICAgICApXG4gICAgICAgIClcbiAgICAgIClcbiAgICAgIClcbiAgICApO1xuICB9LFxuICBoYW5kbGVUaXRsZTogZnVuY3Rpb24oZSkge1xuICAgIHRoaXMuc2V0U3RhdGUoe3RpdGxlOiBlLnRhcmdldC52YWx1ZX0pO1xuICAgIHN0b3JlKCd0aXRsZScsIGUudGFyZ2V0LnZhbHVlKTtcbiAgfSxcbiAgdG9nZ2xlRWRpdDogZnVuY3Rpb24oZSkge1xuICAgIHZhciB0b2dnbGUgPSAhdGhpcy5zdGF0ZS5lZGl0O1xuICAgIHRoaXMuc2V0U3RhdGUoe2VkaXQ6IHRvZ2dsZX0pO1xuICAgIHN0b3JlKCdlZGl0JywgdG9nZ2xlKTtcbiAgfSxcbiAgaGFuZGxlV2lkdGg6IGZ1bmN0aW9uKGUpIHtcbiAgICB0aGlzLnNldFN0YXRlKHt3aWR0aDogZS50YXJnZXQudmFsdWV9KTtcbiAgICBzdG9yZSgnd2lkdGgnLCBlLnRhcmdldC52YWx1ZSk7XG4gIH0sXG4gIGhhbmRsZUhlaWdodDogZnVuY3Rpb24oZSkge1xuICAgIHRoaXMuc2V0U3RhdGUoe2hlaWdodDogZS50YXJnZXQudmFsdWV9KTtcbiAgICBzdG9yZSgnaGVpZ2h0JywgZS50YXJnZXQudmFsdWUpO1xuICB9LFxuICBoYW5kbGVDb2xvcjogZnVuY3Rpb24oZSkge1xuICAgIHRoaXMuc2V0U3RhdGUoe2NvbG9yOiBlLnRhcmdldC52YWx1ZX0pO1xuICAgIHN0b3JlKCdjb2xvcicsIGUudGFyZ2V0LnZhbHVlKTtcbiAgfSxcbiAgaGFuZGxlRm9ybTogZnVuY3Rpb24oa2V5LCBlKSB7XG4gICAgdmFyIG5ld0Zvcm1zID0gdGhpcy5zdGF0ZS5mb3JtcztcbiAgICBuZXdGb3Jtc1trZXldLmxhYmVsID0gZS50YXJnZXQudmFsdWU7XG4gICAgdGhpcy5zZXRTdGF0ZSh7Zm9ybXM6IG5ld0Zvcm1zfSk7XG4gICAgc3RvcmUoJ2Zvcm1zJywgbmV3Rm9ybXMpO1xuICB9LFxuICBhZGRGaWVsZDogZnVuY3Rpb24oZSkge1xuICAgIHZhciBuZXdGb3JtcyA9IHRoaXMuc3RhdGUuZm9ybXM7XG4gICAgbmV3Rm9ybXMucHVzaCh7dHlwZTogJ3RleHQnLCBsYWJlbDogJyd9KTtcbiAgICB0aGlzLnNldFN0YXRlKHtmb3JtczogbmV3Rm9ybXN9KTtcbiAgICBzdG9yZSgnZm9ybXMnLCBuZXdGb3Jtcyk7XG4gIH0sXG4gIGFkZENoZWNrYm94OiBmdW5jdGlvbihlKSB7XG4gICAgdmFyIG5ld0Zvcm1zID0gdGhpcy5zdGF0ZS5mb3JtcztcbiAgICBuZXdGb3Jtcy5wdXNoKHt0eXBlOiAnY2hlY2tib3gnLCBsYWJlbDogJyd9KTtcbiAgICB0aGlzLnNldFN0YXRlKHtmb3JtczogbmV3Rm9ybXN9KTtcbiAgICBzdG9yZSgnZm9ybXMnLCBuZXdGb3Jtcyk7XG4gIH0sXG4gIHJlbW92ZTogZnVuY3Rpb24oKSB7XG4gICAgdmFyIG5ld0Zvcm1zID0gdGhpcy5zdGF0ZS5mb3JtcztcbiAgICBuZXdGb3Jtcy5wb3AoKTtcbiAgICB0aGlzLnNldFN0YXRlKHtmb3JtczogbmV3Rm9ybXN9KTtcbiAgICBzdG9yZSgnZm9ybXMnLCBuZXdGb3Jtcyk7XG4gIH1cbiAgXG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1haW47Il19
