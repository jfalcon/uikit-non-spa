import * as types from './types';
import { initialize } from 'services/user';

// this is passing data from the LOCAL COMPONENT STATE as a parameter in the action
// payload to be put into the immutable REDUX STORE SATE, also the default Redux
// store state of state = initialize can be overridden when calling createStore()

export default function(state = { authenticated: false, user: initialize }, action) {
   // store state is immutable so we use the spread operator in every action
   // to take all of the properties in the existing Redux store state, along
   // with the new data, and pass them them all into a new object we create
   // a deep copy of before updating the Redux store state
   switch (action.type) {
      // this syntax requires the transform-object-rest-spread plug-in for babel
      case types.UPDATE_USER_INFO:
         return { ...state, authenticated: action.authenticated, user: action.user };

      default:
         return state;
   }
}
