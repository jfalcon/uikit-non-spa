import React from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import * as actions from './actions';
//import { initialize } from 'services/user';

class Widget extends React.Component {
   // doing this requires use of the transform-class-properties plug-in for babel
   static propTypes = {
      actions: PropTypes.object.isRequired,
      thunks: PropTypes.object.isRequired
   };

   constructor(props, context) {
      super(props, context);

      // this is React local state and not the Redux store state
      // this is the only place where you can assign this.state
      this.state = {
         authenticated: false,
         user: initialize,
         errors: {},
         saving: false
      };

      // for performance we bind here rather than every render
      // this allows "this" to point to the component inside
      // these methods rather than the calling input controls
      this.onStateChange = this.onStateChange.bind(this);
      this.onSubmit = this.onSubmit.bind(this);
   }

   // remember this refers to React's local state
   onStateChange(event) {
      const field = event.target.name;

      // this is a deep copy, also by default "this" is the calling
      // control and not the component so that's why we bind() above
      let user = Object.assign({}, this.state.user);

      // setState enqueues changes to tell React to re-render the component
      // and does a shallow merge into the current state
      user[field] = event.target.value;
      return this.setState({ user: user });
   }

   onSubmit() {
      this.setState({ saving: true });

      // this is where we tell Redux to do something, and always only via actions
      // however, since the component should remain ignorant of Redux, call the
      // routine created by mapDispatchToProps below to send along the React
      // local component state updates as a parameter to the wrapper function
      // which will eventually dispatch it back to the Redux store
   }

   render() {
      // returned JSX must be within parenthesis
      return (
         <section>
            <h1>Login Page</h1>
            <LoginForm
               onChange={this.onStateChange}
               onSubmit={this.onSubmit}
               isDisabled={this.state.saving}
            />
            <Link to="/">Temp Link Home</Link>
         </section>
      );
   }
}

// since components aren't meant to know about Redux we connect this component
// to Redux right here and thus make it a container component, as such these
// routines below allow us to take Redux logic and map it over to React logic

// as such, this is the only part of this file that pertains to Redux,
// everything else presented above is strictly specific to React
export default connect (
   // mapStateToProps, this maps the Redux *store* state to React component properties
   // do not confuse this with React local state for the component itself, also this
   // will be called upon component instantiation and after every Redux *store* update
   function(state) {
      return {
         authenticated: state.login.authenticated,
         user: state.user
      };
   },

   // mapDispatchToProps, using this avoids a Redux anti-pattern, if we don't use it then
   // the store's dispatch method gets injected into the React props, but React isn't
   // supposed to know Redux exists, as such we create proxies to use in the component
   function(dispatch) {
      return {
         // bindActionCreators is simply a convenience function that stops us form having to
         // type out "someAction: input => dispatch(someAction(input)) " for every action
         // also we namespace the actions rather than put them on the props root directly
         actions: bindActionCreators(actions, dispatch),
         thunks: bindActionCreators(thunks, dispatch)
      };
   }
)(Widget);
