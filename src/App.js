import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PendingVisitors from "./components/PendingVisitor";
import AdminLogin from "./components/AdminLogin";
import VisitorForm from "./components/visitorForm";
import Navbar from "./components/navbar";


const App = () => (
  <Router>
     <Navbar/>
    <Routes>
      <Route path="/admin-login" element={<AdminLogin/>} />
      <Route path="/" element={<VisitorForm/>} />
      <Route path="/pending-visitors" element={<PendingVisitors/>} />
    </Routes>
  </Router>
);

export default App;
