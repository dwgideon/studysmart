
import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [message, setMessage] = useState("");

  const handleAuth = async () => {
    setMessage("");
    let result;
    if (isLogin) {
      result = await supabase.auth.signInWithPassword({ email, password });
    } else {
      result = await supabase.auth.signUp({ email, password });
    }

    if (result.error) {
      setMessage(result.error.message);
    } else {
      setMessage(isLogin ? "✅ Logged in!" : "📩 Check your email to confirm signup.");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="w-1/2 bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex flex-col justify-center items-center p-10">
        <h1 className="text-4xl font-bold mb-4">Welcome to StudySmart</h1>
        <p className="text-lg">AI-powered flashcards, quizzes, and games to help you learn faster and retain longer.</p>
      </div>

      {/* Right Form Panel */}
      <div className="w-1/2 bg-white p-10 flex flex-col justify-center">
        <h2 className="text-2xl font-semibold mb-6">{isLogin ? "Log In" : "Sign Up"}</h2>

        {message && (
          <div className={`mb-4 text-sm ${message.startsWith("✅") || message.startsWith("📩") ? "text-green-600" : "text-red-500"}`}>
            {message}
          </div>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded px-4 py-2 mb-4"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded px-4 py-2 mb-4"
        />
        <button
          onClick={handleAuth}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded w-full"
        >
          {isLogin ? "Log In" : "Sign Up"}
        </button>

        <div className="text-center mt-6">
          {isLogin ? (
            <p>
              Don’t have an account?{" "}
              <button onClick={() => setIsLogin(false)} className="text-indigo-600 font-medium hover:underline">
                Sign up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{" "}
              <button onClick={() => setIsLogin(true)} className="text-indigo-600 font-medium hover:underline">
                Log in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

