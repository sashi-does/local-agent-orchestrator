import "./index.css";
import { useSocket } from "./hooks/useSocket";

export function App() {
  const { socket, loading } = useSocket();
  if(loading) {
    return <div>
        loading....
    </div>
  }
  return (
    <div className="flex">
      <div className="flex-1 bg-blue">
        sidebar
      </div>
      <div className="flex-6 bg-red">
        chat
      </div>
    </div>
  );
}

export default App;
