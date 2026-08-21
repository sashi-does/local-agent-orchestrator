import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [ws] = useState(new WebSocket('ws://localhost:8080'));

  useEffect(() => {
    if(ws) {
      ws.onopen = () => {
        ws.send("hello from relient!!")
      }
    }
  })

  return (
    <>

    </>
  )
}

export default App
