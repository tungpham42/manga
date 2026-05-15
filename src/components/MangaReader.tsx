import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Spin, Button, Result } from "antd";
import { ArrowLeftOutlined, HomeOutlined } from "@ant-design/icons";
import api from "../api";

const MangaReader: React.FC = () => {
  const { chapterId } = useParams<{ chapterId: string }>();
  const [images, setImages] = useState<string[]>([]);
  const [mangaId, setMangaId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchChapterData = async () => {
      try {
        // Fetch both the page images and the chapter metadata at the same time
        const [atHomeRes, chapterRes] = await Promise.all([
          api.get(`/at-home/server/${chapterId}`),
          api.get(`/chapter/${chapterId}`),
        ]);

        // 1. Process images
        const { baseUrl, chapter } = atHomeRes.data;
        const { hash, data } = chapter;
        const imageUrls = data.map(
          (filename: string) => `${baseUrl}/data/${hash}/${filename}`,
        );
        setImages(imageUrls);

        // 2. Extract Manga ID from chapter relationships
        const mangaRel = chapterRes.data.data.relationships.find(
          (rel: any) => rel.type === "manga",
        );
        if (mangaRel) {
          setMangaId(mangaRel.id);
        }
      } catch (err) {
        console.error("Failed to load chapter data", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (chapterId) fetchChapterData();
  }, [chapterId]);

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "80vh",
        }}
      >
        <Spin size="large" />
        <p
          style={{
            color: "var(--accent-primary)",
            marginTop: "20px",
            fontWeight: 700,
            fontSize: "18px",
          }}
        >
          Loading crisp & cozy pages...
        </p>
      </div>
    );

  if (error)
    return (
      <Result
        status="error"
        title={
          <span
            style={{
              color: "var(--text-main)",
              fontFamily: "Comic Sans MS, cursive",
            }}
          >
            Oh no! Failed to load chapter
          </span>
        }
        subTitle={
          <span
            style={{
              color: "var(--text-muted)",
              fontFamily: "Comic Sans MS, cursive",
            }}
          >
            The MD@Home server might be taking a nap, or the chapter is
            restricted.
          </span>
        }
        extra={
          <Link to="/">
            <Button
              type="primary"
              shape="round"
              style={{
                background: "var(--accent-primary)",
                border: "none",
                fontWeight: "bold",
              }}
            >
              Return to Dashboard
            </Button>
          </Link>
        }
      />
    );

  return (
    <div
      style={{
        background:
          "var(--bg-dark)" /* Soft cream background instead of black */,
        minHeight: "100vh",
        margin: "-40px -20px",
        position: "relative",
      }}
    >
      {/* Floating Glass Header */}
      <div className="glass-header" style={{ justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: "12px" }}>
          {/* Dynamically link back to the Manga Details if we found the ID, otherwise fallback to home */}
          <Link to={mangaId ? `/manga/${mangaId}` : "/"}>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              style={{
                color: "var(--text-main)",
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                fontSize: "16px",
              }}
            >
              Back to Chapters
            </Button>
          </Link>

          <Link to="/">
            <Button
              type="text"
              icon={<HomeOutlined />}
              style={{
                color: "var(--text-muted)",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                fontSize: "16px",
              }}
            >
              Dashboard
            </Button>
          </Link>
        </div>

        <div
          style={{
            color: "var(--text-muted)",
            fontWeight: 700,
            fontSize: "16px",
          }}
        >
          {images.length} Pages
        </div>
      </div>

      {/* Pages Container */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: "100px",
          paddingBottom: "100px",
          gap: "12px",
        }}
      >
        {images.map((url, idx) => (
          <img
            key={idx}
            src={url}
            alt={`Page ${idx + 1}`}
            className="manga-page"
            style={{
              maxWidth: "100%",
              width: "800px",
              objectFit: "contain",
              backgroundColor: "#FFF0E5", // Cozy placeholder
            }}
            loading="lazy"
          />
        ))}
      </div>
    </div>
  );
};

export default MangaReader;
