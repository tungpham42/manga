import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Spin, Button, Result } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import api from "../api";

const MangaReader: React.FC = () => {
  const { chapterId } = useParams<{ chapterId: string }>();
  const [images, setImages] = useState<string[]>([]);
  const [mangaId, setMangaId] = useState<string | null>(null);
  const [mangaTitle, setMangaTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchChapterData = async () => {
      try {
        // Fetch both the page images and the chapter metadata (including parent manga details)
        const [atHomeRes, chapterRes] = await Promise.all([
          api.get(`/at-home/server/${chapterId}`),
          api.get(`/chapter/${chapterId}`, {
            params: { "includes[]": ["manga"] }, // <-- This tells the API to give us the parent manga info!
          }),
        ]);

        // 1. Process images
        const { baseUrl, chapter } = atHomeRes.data;
        const { hash, data } = chapter;
        const imageUrls = data.map(
          (filename: string) => `${baseUrl}/data/${hash}/${filename}`,
        );
        setImages(imageUrls);

        // 2. Extract Manga ID and Title from chapter relationships
        const mangaRel = chapterRes.data.data.relationships.find(
          (rel: any) => rel.type === "manga",
        );

        if (mangaRel) {
          setMangaId(mangaRel.id);
          const titleObj = mangaRel.attributes?.title;
          const title =
            titleObj?.en ||
            (titleObj ? Object.values(titleObj)[0] : "Unknown Manga");
          setMangaTitle(title as string);
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
        background: "var(--bg-dark)" /* Soft cream background */,
        minHeight: "100vh",
        margin: "-40px -20px",
        position: "relative",
      }}
    >
      {mangaId && mangaTitle && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "24px 0",
          }}
        >
          <Link
            to={`/manga/${mangaId}`}
            className="catchy-back-link"
            style={{
              background:
                "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
              color: "#ffffff",
              fontWeight: 800,
              fontSize: "16px",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              padding: "12px 28px",
              borderRadius: "30px", // High border-radius for a perfect pill shape
              boxShadow: "0 8px 20px rgba(255, 140, 105, 0.35)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              zIndex: 10,
            }}
          >
            <ArrowLeftOutlined style={{ fontSize: "18px" }} /> Back to{" "}
            {mangaTitle}
          </Link>
        </div>
      )}

      {/* Pages Container */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: "50px",
          paddingBottom: "50px",
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
