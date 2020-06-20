import React, { useEffect } from 'react';
import { Editor }  from './editor'

import { firestore } from './firebase'

function App() {
  useEffect(() => {
    firestore.doc('forms/6aB798wMx3sP02ZK26C9').get()
    .then((snapshot) => {
      console.log(snapshot, snapshot.data())
    })
  })

  return (
    <div className="App">
      <Editor/>
    </div>
  );
}

export default App;
