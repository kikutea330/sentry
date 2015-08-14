import jQuery from "jquery";
import React from "react";
import Reflux from "reflux";
import Router from "react-router";
import api from "../api";
import Count from "../components/count";
import LoadingError from "../components/loadingError";
import LoadingIndicator from "../components/loadingIndicator";
import Pagination from "../components/pagination";
import RouteMixin from "../mixins/routeMixin";
import TimeSince from "../components/timeSince";
import utils from "../utils";
import Version from "../components/version";
import SearchBar from "../views/stream/searchBar.jsx";

var ReleaseList = React.createClass({
  contextTypes: {
    router: React.PropTypes.func
  },

  render() {
    var params = this.context.router.getCurrentParams();

    return (
      <ul className="release-list">
          {this.props.releaseList.map((release) => {
            return (
              <li className="release">
                <div className="row">
                  <div className="col-sm-8 col-xs-6">
                    <h4><Version version={release.version} /></h4>
                    <div className="release-meta">
                      <span className="icon icon-clock"></span> <TimeSince date={release.dateCreated} />
                    </div>
                  </div>
                  <div className="col-sm-2 col-xs-3 release-stats stream-count">
                    <Count className="release-count" value={release.newGroups} />
                  </div>
                  <div className="col-sm-2 col-xs-3 release-stats">
                    {release.lastEvent ?
                      <TimeSince date={release.lastEvent} />
                    :
                      <span>&mdash;</span>
                    }
                  </div>
                </div>
              </li>
            );
          })}
      </ul>
    );
  }
});

var ProjectReleases = React.createClass({
  mixins: [
    RouteMixin
  ],

  getDefaultProps() {
    return {
      defaultQuery: ""
    };
  },

  contextTypes: {
    router: React.PropTypes.func
  },

  propTypes: {
    setProjectNavSection: React.PropTypes.func.isRequired
  },

  getInitialState() {
    return {
      releaseList: [],
      loading: true,
      error: false,
      query: this.props.defaultQuery
    };
  },

  onQueryChange(query, callback) {
    this.setState({
      query: query
    }, callback);
  },

  onSearch(query) {
    this.fetchData();
  },

  componentWillMount() {
    this.props.setProjectNavSection('releases');
    this.fetchData();
  },

  routeDidChange() {
    this.fetchData();
  },

  fetchData() {
    this.setState({
      loading: true,
      error: false
    });

    api.request(this.getProjectReleasesEndpoint(), {
      success: (data, _, jqXHR) => {
        this.setState({
          error: false,
          loading: false,
          releaseList: data,
          pageLinks: jqXHR.getResponseHeader('Link')
        });
      },
      error: () => {
        this.setState({
          error: true,
          loading: false
        });
      }
    });
  },

  getProjectReleasesEndpoint() {
    var router = this.context.router;
    var params = router.getCurrentParams();
    var queryParams = $.extend({}, router.getCurrentQuery());
    queryParams.limit = 50;
    queryParams.query = this.state.query;

    return '/projects/' + params.orgId + '/' + params.projectId + '/releases/?' + jQuery.param(queryParams);
  },

  onPage(cursor) {
    var router = this.context.router;
    var params = router.getCurrentParams();
    var queryParams = $.extend({}, router.getCurrentQuery());
    queryParams.cursor = cursor;

    router.transitionTo('projectReleases', params, queryParams);
  },

  getReleaseTrackingUrl() {
    var router = this.context.router;
    var params = router.getCurrentParams();

    return '/' + params.orgId + '/' + params.projectId + '/settings/release-tracking/';
  },

  render() {
    var router = this.context.router;
    var params = router.getCurrentParams();

    return (
      <div>
        {this.state.loading ?
          <LoadingIndicator />
        : (this.state.error ?
          <LoadingError onRetry={this.fetchData} />
        :
          <div>
            <div className="row">
              <div className="col-sm-7">
                <h3>Releases</h3>
              </div>
              <div className="col-sm-5">
                <SearchBar defaultQuery=""
                  placeholder="Search for a release."
                  query={this.state.query}
                  onQueryChange={this.onQueryChange}
                  onSearch={this.onSearch}
                />
              </div>
            </div>
            <div className="release-header">
              <div className="row">
                <div className="col-sm-8 col-xs-6">Version</div>
                <div className="col-sm-2 col-xs-3 release-stats align-right">
                  New Events
                </div>
                <div className="col-sm-2 col-xs-3 release-stats align-right">
                  Last Event
                </div>
              </div>
            </div>
            {this.state.releaseList.length ?
              <ReleaseList releaseList={this.state.releaseList} />
            :
              <div className="box empty-stream">
                <span className="icon icon-exclamation" />
                <p>There don't seem to be any releases yet.</p>
                <p><a href={this.getReleaseTrackingUrl()}>Learn how to integrate Release Tracking</a></p>
              </div>
            }
          </div>
        )}
        <Pagination pageLinks={this.state.pageLinks} onPage={this.onPage} />
      </div>
    );
  }
});

export default ProjectReleases;