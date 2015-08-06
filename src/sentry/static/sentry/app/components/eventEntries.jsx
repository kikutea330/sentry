import React from "react";
import Sticky from "react-sticky";
import EventDataSection from "./eventDataSection";
import PropTypes from "../proptypes";
import utils from "../utils";
import ContextData from "./contextData";

var EventExtraData = React.createClass({
  propTypes: {
    group: PropTypes.Group.isRequired,
    event: PropTypes.Event.isRequired
  },

  shouldComponentUpdate(nextProps, nextState) {
    return this.props.event.id !== nextProps.event.id;
  },

  render() {
    var children = [];
    var context = this.props.event.context;
    for (var key in context) {
      children.push(<dt key={'dt-' + key}>{key}</dt>);
      children.push((
        <dd key={'dd-' + key}>
          <ContextData data={context[key]} />
        </dd>
      ));
    }

    return (
      <EventDataSection
          group={this.props.group}
          event={this.props.event}
          type="extra"
          title="Additional Data">
        <dl className="vars">
          {children}
        </dl>
      </EventDataSection>
    );
  }
});

var EventPackageData = React.createClass({
  propTypes: {
    group: PropTypes.Group.isRequired,
    event: PropTypes.Event.isRequired
  },

  shouldComponentUpdate(nextProps, nextState) {
    return this.props.event.id !== nextProps.event.id;
  },

  render() {
    var packages = this.props.event.packages;
    var packageKeys = [];
    for (var key in packages) {
      packageKeys.push(key);
    }
    packageKeys.sort();

    var children = [];
    packageKeys.forEach((key) => {
      children.push(<dt key={'dt-' + key}>{key}</dt>);
      children.push(<dd key={'dd-' + key}><pre>{packages[key]}</pre></dd>);
    });

    return (
      <EventDataSection
          group={this.props.group}
          event={this.props.event}
          type="packages"
          title="Packages">
        <dl className="vars">
          {children}
        </dl>
      </EventDataSection>
    );
  }
});

var EventEntries = React.createClass({
  propTypes: {
    group: PropTypes.Group.isRequired,
    event: PropTypes.Event.isRequired,
    // TODO(dcramer): ideally isShare would be replaced with simple permission
    // checks
    isShare: React.PropTypes.bool
  },

  getDefaultProps() {
    return {
      isShare: false
    };
  },

  // TODO(dcramer): make this extensible
  interfaces: {
    exception: require("./interfaces/exception"),
    request: require("./interfaces/request"),
    stacktrace: require("./interfaces/stacktrace")
  },

  shouldComponentUpdate(nextProps, nextState) {
    return this.props.event.id !== nextProps.event.id;
  },

  render(){
    var group = this.props.group;
    var evt = this.props.event;
    var isShare = this.props.isShare;

    var entries = evt.entries.map((entry, entryIdx) => {
      try {
        var Component = this.interfaces[entry.type];
        if (!Component) {
          console.error('Unregistered interface: ' + entry.type);
          return;
        }
        return <Component
                  key={"entry-" + entryIdx}
                  group={group}
                  event={evt}
                  type={entry.type}
                  data={entry.data}
                  isShare={isShare} />;
      } catch (ex) {
        // TODO(dcramer): this should log to Sentry
        return (
          <EventDataSection
              group={group}
              event={evt}
              type={entry.type}
              title={entry.type}>
            <p>There was an error rendering this data.</p>
          </EventDataSection>
        );
      }
    });

    return (
      <div>
        {entries}
        {!utils.objectIsEmpty(evt.context) &&
          <EventExtraData
              group={group}
              event={evt} />
        }
        {!utils.objectIsEmpty(evt.packages) &&
          <EventPackageData
              group={group}
              event={evt} />
        }
      </div>
    );
  }
});

export default EventEntries;

