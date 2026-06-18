import React from "react";
import { BrowserRouter } from "react-router-dom";
import AdminRoutes from "./routes/AdminRoutes";

function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AdminRoutes />
    </BrowserRouter>
  );
}

export default App;
  