import { Navigate } from "react-router-dom";

import { useAuth } from "@/hooks/use-auth";

/** Entry route: sends signed-in users to the board, everyone else to login. */
const Index = () => {
  const { user } = useAuth();

  return <Navigate to={user ? "/board" : "/login"} replace />;
};

export default Index;
