import * as types from './types';

// actions change things in the application, since we're using a unidirectional data flow
// the action creators below are the only way the application interacts with Redux state

export function updateUserInfo(authenticated, user) {
   return { type: types.UPDATE_USER_INFO, authenticated, user };
}
