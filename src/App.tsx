// App.tsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { Layout } from "antd";
import { HeartFilled } from "@ant-design/icons"; // Swapped Fire for a cozy Heart
import MangaList from "./components/MangaList";
import MangaReader from "./components/MangaReader";
import MangaDetails from "./components/MangaDetails";
import "./App.css";

const { Header, Content, Footer } = Layout;

const App: React.FC = () => {
  return (
    <Router>
      <Layout style={{ minHeight: "100vh" }}>
        <Header
          style={{
            display: "flex",
            alignItems: "center",
            background:
              "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
            padding: "0 40px",
            position: "sticky",
            top: 0,
            zIndex: 100,
            boxShadow: "0 4px 15px rgba(255, 140, 105, 0.3)",
            borderBottomLeftRadius: "24px",
            borderBottomRightRadius: "24px",
            margin: "0 10px" /* Slight margin for a floating header look */,
          }}
        >
          <HeartFilled
            style={{ color: "#FFF", fontSize: "28px", marginRight: "12px" }}
          />
          <Link to="/" style={{ textDecoration: "none" }}>
            <h1
              className="gradient-text"
              style={{ margin: 0, fontSize: "28px" }}
            >
              Soft Manga
            </h1>
          </Link>
        </Header>

        <Content style={{ padding: "40px 20px" }}>
          <Routes>
            <Route path="/" element={<MangaList />} />
            <Route path="/manga/:mangaId" element={<MangaDetails />} />
            <Route path="/read/:chapterId" element={<MangaReader />} />
          </Routes>
        </Content>

        <Footer
          style={{
            textAlign: "center",
            background: "transparent",
            color: "var(--text-muted)",
            fontWeight: 600,
            fontSize: "16px",
          }}
        >
          Powered by MangaDex API © {new Date().getFullYear()} • Crafted with a
          cozy ♥
        </Footer>
      </Layout>
    </Router>
  );
};

export default App;
