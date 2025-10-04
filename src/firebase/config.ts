import { FirebaseOptions } from 'firebase/app';

// It's safe to expose this configuration to the client.
// It does not contain any sensitive information.
// Security is handled by Firestore Security Rules and App Check.
export const firebaseConfig: FirebaseOptions = {
  projectId: 'studio-3666468923-b204e',
  appId: '1:634207790759:web:92dc942dd48afb89549d82',
  apiKey: 'AIzaSyAwXpz5Anqe8Cc6rZfVEDP74S9RRmFTfrU',
  authDomain: 'studio-3666468923-b204e.firebaseapp.com',
  measurementId: '',
  messagingSenderId: '634207790759',
};
