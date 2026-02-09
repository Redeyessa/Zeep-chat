import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import GoogleAuth from "./otp";
import ChatMain from "./ChatMain";

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/login" element={<GoogleAuth />} />
          <Route path="/" element={<ChatMain />} />
          <Route path="*" element={<Navigate to="/login" />} />
          <Route path="Zeep-chat/" element={<GoogleAuth />} />
          <Route path="Zeep-chat/chat" element={<ChatMain />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;