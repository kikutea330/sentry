import React from "react";
import $ from "jquery";
require("bootstrap/js/tooltip");

var TooltipTrigger = React.createClass({
  propTypes: {
    title: React.PropTypes.node.isRequired,
    placement: React.PropTypes.string,
    viewport: React.PropTypes.shape({
      selector: React.PropTypes.string,
      padding: React.PropTypes.number
    })
  },

  getDefaultProps() {
    return {
      placement: "left",
      viewport: {
        selector: "body",
        padding: 5
      }
    };
  },

  componentDidMount() {
    // These can be configured via options; this is just a demo
    $(this.getDOMNode()).tooltip({
      html: true,
      placement: this.props.placement,
      title: React.renderToString(this.props.title),
      viewport: this.props.viewport
    });
  },

  componentWillUnmount() {
    var node = $(this.getDOMNode());
    node.tooltip("destroy");
    node.unbind();
  },

  render() {
    return this.props.children;
  }
});

export default TooltipTrigger;

