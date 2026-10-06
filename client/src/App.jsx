import { useEffect, useState } from "react";
import "./App.css";

function App() {
    const [message, setMessage] = useState("Loading...");
    const [projectInfo, setProjectInfo] = useState(null);

    useEffect(() => {
        fetch("http://localhost:5001/api/health")
            .then((response) => response.json())
            .then((data) => {
                setMessage(data.message);
            })
            .catch(() => {
                setMessage("Backend connection failed");
            });

        fetch("http://localhost:5001/api/project-info")
            .then((response) => response.json())
            .then((data) => {
                setProjectInfo(data.data);
            })
            .catch(() => {
                setProjectInfo(null);
            });
    }, []);

    return (
        <div>
            <h1>AI Interview Platform</h1>
            <p>{message}</p>
            {projectInfo && (
                <div class='project-info'>
                    <h2>{projectInfo.name}</h2>
                    <p>Version: {projectInfo.version}</p>
                    <p>Stack: {projectInfo.stack.join(", ")}</p>
                </div>
            )}
        </div>
    );
}

export default App;