import { EventEmitter } from 'events';

// This is a simple event emitter that can be used to broadcast errors
// from anywhere in the application. It is used by the FirebaseErrorListener
// to display error toasts to the user.
export const errorEmitter = new EventEmitter();
