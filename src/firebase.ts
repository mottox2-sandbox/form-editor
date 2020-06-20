import firebase from 'firebase/app'
import 'firebase/firestore'

const firebaseConfig = {

};

firebase.initializeApp(firebaseConfig)

const firestore = firebase.firestore()

firestore.settings({
  host: "localhost:8080",
  ssl: false,
})

export { firebase, firestore }