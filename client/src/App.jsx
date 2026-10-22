
import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5001/api";

function App() {
    const [message, setMessage] = useState("Checking backend connection...");
    const [projectInfo, setProjectInfo] = useState(null);
    const [projectError, setProjectError] = useState("");
    const [totalUsers, setTotalUsers] = useState(null);
    const [usersError, setUsersError] = useState("");

    // Registration state
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [registerMessage, setRegisterMessage] = useState("");
    const [registerError, setRegisterError] = useState("");
    const [isRegistering, setIsRegistering] = useState(false);

    // Login state
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [loginError, setLoginError] = useState("");
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    // Keep the token in memory for now
    const [token, setToken] = useState("");
    const [currentUser, setCurrentUser] = useState(null);
    const [authMessage, setAuthMessage] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);

    useEffect(() => {
        async function loadData() {
            try {
                const response = await fetch(`${API_URL}/health`);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error("Health API request failed");
                }

                setMessage(data.message);
            } catch (error) {
                setMessage("Backend connection failed");
                console.error("Health API error:", error);
            }

            try {
                const response = await fetch(`${API_URL}/project-info`);
                const data = await response.json();

                if (!response.ok || !data.success || !data.data) {
                    throw new Error("Could not load project information");
                }

                setProjectInfo(data.data);
            } catch (error) {
                setProjectError("Could not load project information.");
                console.error("Project Info API error:", error);
            }

            await refreshUserStats();
        }

        loadData();
    }, []);

    async function refreshUserStats() {
        try {
            const response = await fetch(`${API_URL}/stats/users`);
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error("Could not load user statistics");
            }

            setTotalUsers(data.data.totalUsers);
            setUsersError("");
        } catch (error) {
            setUsersError("Could not load user statistics.");
            console.error("User Stats API error:", error);
        }
    }

    async function handleRegister(event) {
        event.preventDefault();

        setRegisterMessage("");
        setRegisterError("");
        setIsRegistering(true);

        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Registration failed");
            }

            setRegisterMessage(data.message);
            setName("");
            setEmail("");
            setPassword("");

            await refreshUserStats();
        } catch (error) {
            setRegisterError(error.message);
        } finally {
            setIsRegistering(false);
        }
    }

    async function handleLogin(event) {
        event.preventDefault();

        setLoginError("");
        setAuthMessage("");
        setIsLoggingIn(true);

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: loginEmail,
                    password: loginPassword,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Login failed");
            }

            const receivedToken = data.data?.token;

            if (!receivedToken) {
                throw new Error("Login response did not contain a token");
            }

            setToken(receivedToken);
            setLoginPassword("");
            setAuthMessage("Login successful. Verifying your session...");
        } catch (error) {
            setLoginError(error.message);
        } finally {
            setIsLoggingIn(false);
        }
    }

    // Verify the received JWT using the protected backend endpoint
    useEffect(() => {
        if (!token) {
            setCurrentUser(null);
            setIsVerifying(false);
            return;
        }

        let cancelled = false;

        async function verifyToken() {
            setIsVerifying(true);

            try {
                const response = await fetch(`${API_URL}/auth/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(data.message || "Session verification failed");
                }

                if (!cancelled) {
                    setCurrentUser(data.data);
                    setAuthMessage("Your session has been verified.");
                    setLoginError("");
                }
            } catch (error) {
                if (!cancelled) {
                    setToken("");
                    setCurrentUser(null);
                    setAuthMessage("");
                    setLoginError(error.message);
                }
            } finally {
                if (!cancelled) {
                    setIsVerifying(false);
                }
            }
        }

        verifyToken();

        return () => {
            cancelled = true;
        };
    }, [token]);

    function handleLogout() {
        setToken("");
        setCurrentUser(null);
        setLoginEmail("");
        setLoginPassword("");
        setLoginError("");
        setAuthMessage("You have been logged out.");
    }

    return (
        <main className="app-container">
            <header className="app-header">
                <h1>AI Interview Platform</h1>
                <p>{message}</p>
            </header>

            {projectError && (
                <p className="error-message">{projectError}</p>
            )}

            {projectInfo && (
                <section className="info-card">
                    <h2>{projectInfo.name}</h2>
                    <p>Version: {projectInfo.version}</p>
                    <p>Stack: {projectInfo.stack.join(", ")}</p>
                </section>
            )}

            <section className="info-card">
                <h2>Database Statistics</h2>
                {totalUsers !== null ? (
                    <p>Total registered users: {totalUsers}</p>
                ) : (
                    !usersError && <p>Loading user statistics...</p>
                )}
                {usersError && (
                    <p className="error-message">{usersError}</p>
                )}
            </section>

            {currentUser ? (
                <section className="auth-card">
                    <h2>Welcome, {currentUser.name || "User"}!</h2>
                    <p>Your login was successful.</p>
                    <p>User ID: {currentUser.userId}</p>
                    <p>Role: {currentUser.role}</p>
                    {authMessage && (
                        <p className="success-message" role="status">
                            {authMessage}
                        </p>
                    )}
                    <button type="button" onClick={handleLogout}>
                        Logout
                    </button>
                </section>
            ) : (
                <section className="auth-card">
                    <h2>Login</h2>
                    <p>Sign in with your registered account.</p>

                    <form onSubmit={handleLogin}>
                        <label htmlFor="login-email">Email address</label>
                        <input
                            id="login-email"
                            type="email"
                            value={loginEmail}
                            onChange={(event) => setLoginEmail(event.target.value)}
                            placeholder="Enter your email"
                            required
                        />

                        <label htmlFor="login-password">Password</label>
                        <input
                            id="login-password"
                            type="password"
                            value={loginPassword}
                            onChange={(event) => setLoginPassword(event.target.value)}
                            placeholder="Enter your password"
                            required
                        />

                        <button type="submit" disabled={isLoggingIn || isVerifying}>
                            {isLoggingIn
                                ? "Logging in..."
                                : isVerifying
                                  ? "Verifying session..."
                                  : "Login"}
                        </button>
                    </form>

                    {loginError && (
                        <p className="error-message" role="alert">
                            {loginError}
                        </p>
                    )}

                    {authMessage && (
                        <p className="success-message" role="status">
                            {authMessage}
                        </p>
                    )}
                </section>
            )}

            {!currentUser && (
                <section className="auth-card">
                    <h2>Create Your Account</h2>
                    <p>Register to get started with interview preparation.</p>

                    <form onSubmit={handleRegister}>
                        <label htmlFor="register-name">Full name</label>
                        <input
                            id="register-name"
                            type="text"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="Enter your name"
                            required
                            maxLength={100}
                        />

                        <label htmlFor="register-email">Email address</label>
                        <input
                            id="register-email"
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="Enter your email"
                            required
                        />

                        <label htmlFor="register-password">Password</label>
                        <input
                            id="register-password"
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="At least 8 characters"
                            minLength={8}
                            required
                        />

                        <button type="submit" disabled={isRegistering}>
                            {isRegistering ? "Creating account..." : "Register"}
                        </button>
                    </form>

                    {registerMessage && (
                        <p className="success-message" role="status">
                            {registerMessage}
                        </p>
                    )}

                    {registerError && (
                        <p className="error-message" role="alert">
                            {registerError}
                        </p>
                    )}
                </section>
            )}
        </main>
    );
}

export default App;
