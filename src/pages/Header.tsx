import { signIn, signOut, useSession } from "next-auth/react";

const { data: session } = useSession();

return session ? (
  <>
    <p>Welcome, {session.user?.name}!</p>
    <button onClick={() => signOut()}>Sign Out</button>
  </>
) : (
  <button onClick={() => signIn("google")}>Sign In</button>
);
